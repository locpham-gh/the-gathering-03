import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { jwt } from "@elysiajs/jwt";
import { connectDB } from "./db/connection.js";
import { authRoutes } from "./routes/auth.routes.js";
import { resourceRoutes } from "./routes/resource.routes.js";
import { forumRoutes } from "./routes/forum.routes.js";
import { roomRoutes } from "./routes/room.routes.js";
import { eventRoutes } from "./routes/event.routes.js";
import { AccessToken } from "livekit-server-sdk";
import crypto from "crypto";
import { metrics } from "./realtime/metrics.js";
import {
  REALTIME_PROTOCOL_VERSION,
  type PresenceStatus,
  type RoomActivityEvent,
  type RoomChatMessage,
} from "./realtime/protocol.js";
import {
  InMemoryRealtimeStateAdapter,
  applyInputAuthoritatively,
  createInitialPlayerState,
} from "./realtime/state.js";
import { createSnapshotBridge } from "./realtime/redisBridge.js";

// Boot up MongoDB
connectDB();

const jwtConfig = jwt({
  name: "jwt",
  secret: process.env.JWT_SECRET || "fallback_secret_for_development",
});

const realtimeState = new InMemoryRealtimeStateAdapter();
const HEARTBEAT_TIMEOUT_MS = 15000;
const SNAPSHOT_TICK_MS = 50;
const AWAY_THRESHOLD_MS = 20000;
const instanceId = crypto.randomUUID();
const snapshotBridge = createSnapshotBridge();
const realtimeDebug = process.env.REALTIME_DEBUG === "true";

const app = new Elysia();
const serializeRealtimeMessage = (type: string, payload: unknown) =>
  JSON.stringify({ type, payload });

// 1. Plugins & Routes
app.use(cors());
app.use(jwtConfig);
app.use(authRoutes);
app.use(resourceRoutes);
app.use(forumRoutes);
app.use(roomRoutes);
app.use(eventRoutes);

// 2. HTTP Handlers
app.get("/", () => "Hello from The Gathering Backend");
app.get("/api/realtime/metrics", () => metrics.snapshot());

app.get(
  "/api/livekit/token",
  async ({ query }: any) => {
    const { room, username } = query;
    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!,
      { identity: username },
    );
    at.addGrant({ roomJoin: true, room: room });
    return { token: await at.toJwt() };
  },
  {
    query: t.Object({ room: t.String(), username: t.String() }),
  },
);

// 3. WebSocket Setup
app.ws("/ws", {
  query: t.Object({ room: t.String() }),
  body: t.Object({ type: t.String(), payload: t.Any() }),
  open(ws: any) {
    const roomId = ws.data.query.room;
    if (realtimeDebug) {
      console.log(`📡 New connection in room ${roomId}: ${ws.id}`);
    }
    ws.subscribe(`room-${roomId}`);
    metrics.inc("ws_connections_opened");

    const room = realtimeState.getOrCreateRoom(roomId);
    room.players.set(ws.id, createInitialPlayerState(ws.id, {}));
    room.seq += 1;
    metrics.setGauge("rooms_active", realtimeState.roomCount());
    metrics.setGauge("players_active", realtimeState.playerCount());

    const players = Object.fromEntries(room.players.entries());
    ws.send(
      serializeRealtimeMessage("welcome", {
        protocolVersion: REALTIME_PROTOCOL_VERSION,
        playerId: ws.id,
        roomId,
      }),
    );
    metrics.inc("ws_messages_sent");

    ws.send(
      serializeRealtimeMessage("snapshot", {
        roomId,
        seq: room.seq,
        ts: Date.now(),
        players,
      }),
    );
    metrics.inc("ws_messages_sent");
  },
  message(ws: any, { type, payload }: any) {
    const roomId = ws.data.query.room;
    metrics.inc("ws_messages_received");
    const room = realtimeState.getOrCreateRoom(roomId);
    const player = room.players.get(ws.id);
    if (!player) return;

    if (type === "join") {
      const hadIdentity = Boolean(player.profile.displayName);
      player.profile = {
        userId: payload?.userId,
        displayName: payload?.displayName,
        avatarUrl: payload?.avatarUrl,
        character2d: payload?.character2d,
        status: "active",
        cameraEnabled: Boolean(payload?.cameraEnabled),
      };
      player.heartbeatAt = Date.now();
      player.lastInteractionAt = Date.now();
      if (!hadIdentity) {
        const event: RoomActivityEvent = {
          id: crypto.randomUUID(),
          roomId,
          type: "join",
          actorId: ws.id,
          actorName: player.profile.displayName || "Guest",
          detail: "joined the room",
          ts: Date.now(),
        };
        app.server?.publish(`room-${roomId}`, serializeRealtimeMessage("activity_event", event));
        metrics.inc("ws_messages_sent");
      }
      return;
    }

    if (type === "heartbeat") {
      player.heartbeatAt = Date.now();
      const ackSeq =
        typeof payload?.lastSeq === "number" ? payload.lastSeq : room.seq;
      player.lastAckSeq = ackSeq;
      ws.send(serializeRealtimeMessage("heartbeat_ack", { seq: ackSeq, ts: Date.now() }));
      metrics.inc("ws_messages_sent");
      return;
    }

    if (type === "presence_update") {
      const nextStatus = payload?.status as PresenceStatus;
      if (nextStatus === "active" || nextStatus === "away" || nextStatus === "in_call") {
        player.profile.status = nextStatus;
        if (typeof payload?.cameraEnabled === "boolean") {
          player.profile.cameraEnabled = payload.cameraEnabled;
        }
        player.lastInteractionAt = Date.now();
        const event: RoomActivityEvent = {
          id: crypto.randomUUID(),
          roomId,
          type: "presence",
          actorId: ws.id,
          actorName: player.profile.displayName || "Guest",
          detail: `is now ${nextStatus}`,
          ts: Date.now(),
        };
        app.server?.publish(`room-${roomId}`, serializeRealtimeMessage("presence_updated", event));
        metrics.inc("ws_messages_sent");
      }
      return;
    }

    if (type === "media_state") {
      if (typeof payload?.cameraEnabled === "boolean") {
        player.profile.cameraEnabled = payload.cameraEnabled;
        player.lastInteractionAt = Date.now();
      }
      return;
    }

    if (type === "chat_message") {
      const text = String(payload?.text || "").trim();
      if (!text) return;
      const channelId = String(payload?.channelId || "general").trim() || "general";
      const parentId =
        typeof payload?.parentId === "string" && payload.parentId.trim().length > 0
          ? payload.parentId.trim()
          : undefined;
      const truncated = text.slice(0, 500);
      const chatMessage: RoomChatMessage = {
        id: crypto.randomUUID(),
        roomId,
        channelId,
        parentId,
        senderId: ws.id,
        senderName: player.profile.displayName || "Guest",
        senderAvatar: player.profile.avatarUrl,
        text: truncated,
        ts: Date.now(),
      };
      app.server?.publish(`room-${roomId}`, serializeRealtimeMessage("chat_message", chatMessage));
      const event: RoomActivityEvent = {
        id: crypto.randomUUID(),
        roomId,
        type: "chat",
        actorId: ws.id,
        actorName: player.profile.displayName || "Guest",
        detail: `sent a message in #${channelId}: ${truncated.slice(0, 60)}`,
        ts: Date.now(),
      };
      app.server?.publish(`room-${roomId}`, serializeRealtimeMessage("activity_event", event));
      player.lastInteractionAt = Date.now();
      metrics.inc("ws_messages_sent", 2);
      return;
    }

    if (type === "ack") {
      if (typeof payload?.seq === "number") {
        player.lastAckSeq = payload.seq;
      }
      return;
    }

    if (type === "input") {
      const nextInput = {
        seq: Number(payload?.seq ?? 0),
        dx: Number(payload?.dx ?? 0),
        dy: Number(payload?.dy ?? 0),
        isSitting: Boolean(payload?.isSitting),
      };
      const queue = room.pendingInputs.get(ws.id) || [];
      // Keep queue ordered and bounded to avoid stale buildup.
      if (queue.length > 24) queue.splice(0, queue.length - 24);
      if (!queue.some((input) => input.seq === nextInput.seq)) {
        queue.push(nextInput);
        queue.sort((a, b) => a.seq - b.seq);
      }
      if (realtimeDebug && queue.length > 8) {
        console.log(`⚠️ input queue backlog ${ws.id} -> ${queue.length}`);
      }
      room.pendingInputs.set(ws.id, queue);
      return;
    }

    // Backward compatibility for old clients that still send absolute positions.
    if (type === "move") {
      const nextX = Number(payload?.x ?? player.x);
      const nextY = Number(payload?.y ?? player.y);
      const dx = Math.max(-1, Math.min(1, (nextX - player.x) / 16));
      const dy = Math.max(-1, Math.min(1, (nextY - player.y) / 16));
      const queue = room.pendingInputs.get(ws.id) || [];
      queue.push({
        seq: player.inputSeq + 1,
        dx,
        dy,
        isSitting: Boolean(payload?.isSitting),
      });
      queue.sort((a, b) => a.seq - b.seq);
      room.pendingInputs.set(ws.id, queue);
    }
  },
  close(ws: any) {
    const roomId = ws.data.query.room;
    const roomBeforeClose = realtimeState.getRoom(roomId);
    const playerBeforeClose = roomBeforeClose?.players.get(ws.id);
    if (realtimeDebug) {
      console.log(`🔌 Connection closed in room ${roomId}: ${ws.id}`);
    }
    metrics.inc("ws_connections_closed");
    realtimeState.removePlayer(roomId, ws.id);
    metrics.setGauge("rooms_active", realtimeState.roomCount());
    metrics.setGauge("players_active", realtimeState.playerCount());
    ws.publish(`room-${roomId}`, serializeRealtimeMessage("player_left", { id: ws.id }));
    const event: RoomActivityEvent = {
      id: crypto.randomUUID(),
      roomId,
      type: "leave",
      actorId: ws.id,
      actorName: playerBeforeClose?.profile.displayName || "A participant",
      detail: "left the room",
      ts: Date.now(),
    };
    ws.publish(`room-${roomId}`, serializeRealtimeMessage("activity_event", event));
    metrics.inc("ws_messages_sent");
  },
});

snapshotBridge.subscribe((roomId, payload: any) => {
  if (!payload || payload.instanceId === instanceId) return;
  app.server?.publish(`room-${roomId}`, serializeRealtimeMessage("snapshot", payload.snapshot));
});

setInterval(() => {
  const tickStart = Date.now();
  const now = Date.now();
  for (const room of realtimeState.getRooms()) {
    for (const [playerId, player] of room.players.entries()) {
      if (now - player.heartbeatAt > HEARTBEAT_TIMEOUT_MS) {
        metrics.inc("ws_heartbeat_timeouts");
        room.players.delete(playerId);
        room.pendingInputs.delete(playerId);
        continue;
      }

      if (player.profile.status !== "in_call") {
        const nextStatus: PresenceStatus =
          now - player.lastInteractionAt > AWAY_THRESHOLD_MS ? "away" : "active";
        if (player.profile.status !== nextStatus) {
          player.profile.status = nextStatus;
          app.server?.publish(
            `room-${room.roomId}`,
            serializeRealtimeMessage("presence_updated", {
              id: crypto.randomUUID(),
              roomId: room.roomId,
              type: "presence",
              actorId: player.id,
              actorName: player.profile.displayName || "Guest",
              detail: `is now ${nextStatus}`,
              ts: now,
            } as RoomActivityEvent),
          );
          metrics.inc("ws_messages_sent");
        }
      }
    }

    for (const [playerId, inputQueue] of room.pendingInputs.entries()) {
      const player = room.players.get(playerId);
      if (!player) continue;
      for (const input of inputQueue) {
        const applied = applyInputAuthoritatively(player, input);
        if (applied) metrics.inc("ws_input_applied");
        else metrics.inc("ws_input_rejected");
      }
    }
    room.pendingInputs.clear();

    room.seq += 1;
    const players = Object.fromEntries(room.players.entries());
    const snapshot = { roomId: room.roomId, seq: room.seq, ts: now, players };
    app.server?.publish(`room-${room.roomId}`, serializeRealtimeMessage("snapshot", snapshot));
    snapshotBridge.publish(room.roomId, { instanceId, snapshot }).catch(() => {});
    metrics.inc("ws_snapshot_broadcasts");
    metrics.inc("ws_messages_sent");
  }

  metrics.setGauge("rooms_active", realtimeState.roomCount());
  metrics.setGauge("players_active", realtimeState.playerCount());
  metrics.observeTickMs(Date.now() - tickStart);
}, SNAPSHOT_TICK_MS);

app.listen(process.env.PORT || 3000);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`,
);
