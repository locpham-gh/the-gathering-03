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
import { pack, unpack } from "msgpackr";
import { REALTIME_CONFIG } from "@the-gathering/shared";
import { metrics } from "./realtime/metrics.js";
import {
  REALTIME_PROTOCOL_VERSION,
  type PresenceStatus,
  type RoomActivityEvent,
  type RoomChatMessage,
  type RoomSnapshotPayload,
} from "./realtime/protocol.js";
import {
  InMemoryRealtimeStateAdapter,
  applyInputAuthoritatively,
  createInitialPlayerState,
  getNearbyPlayers,
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
const SNAPSHOT_TICK_MS = REALTIME_CONFIG.SNAPSHOT_TICK_MS;
const AWAY_THRESHOLD_MS = 20000;
const SNAPSHOT_KEYFRAME_INTERVAL = REALTIME_CONFIG.SNAPSHOT_KEYFRAME_INTERVAL;
const SNAPSHOT_NEAR_RADIUS = REALTIME_CONFIG.SNAPSHOT_NEAR_RADIUS;
const SNAPSHOT_FAR_RATE_TICKS = REALTIME_CONFIG.SNAPSHOT_FAR_RATE_TICKS;
const instanceId = crypto.randomUUID();
const snapshotBridge = createSnapshotBridge();
const realtimeDebug = process.env.REALTIME_DEBUG === "true";

const app = new Elysia();
const serializeRealtimeMessage = (type: string, payload: unknown) =>
  pack({ type, payload });

const parseRealtimeMessage = (rawMessage: unknown): { type: string; payload: any } | null => {
  try {
    if (rawMessage instanceof Uint8Array) {
      return unpack(rawMessage) as { type: string; payload: any };
    }
    if (rawMessage instanceof ArrayBuffer) {
      return unpack(new Uint8Array(rawMessage)) as { type: string; payload: any };
    }
  } catch (error) {
    if (realtimeDebug) {
      console.warn("Failed to parse realtime message", error);
    }
  }
  return null;
};

const rawMessageByteLength = (rawMessage: unknown): number => {
  if (rawMessage instanceof Uint8Array) return rawMessage.byteLength;
  if (rawMessage instanceof ArrayBuffer) return rawMessage.byteLength;
  return 0;
};

const playerSignature = (player: any): string =>
  JSON.stringify([
    Math.round(player.x),
    Math.round(player.y),
    Boolean(player.isSitting),
    Number(player.inputSeq || 0),
    player.profile?.displayName || "",
    player.profile?.avatarUrl || "",
    player.profile?.character2d || "",
    player.profile?.status || "active",
    Boolean(player.profile?.cameraEnabled),
  ]);

const isNearPlayer = (self: any, other: any) => {
  const dx = Number(other.x || 0) - Number(self.x || 0);
  const dy = Number(other.y || 0) - Number(self.y || 0);
  return dx * dx + dy * dy <= SNAPSHOT_NEAR_RADIUS * SNAPSHOT_NEAR_RADIUS;
};

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
  body: t.Any(),
  open(ws: any) {
    const roomId = ws.data.query.room;
    if (realtimeDebug) {
      console.log(`📡 New connection in room ${roomId}: ${ws.id}`);
    }
    ws.subscribe(`room-${roomId}`);
    metrics.inc("ws_connections_opened");

    const room = realtimeState.getOrCreateRoom(roomId);
    room.players.set(ws.id, createInitialPlayerState(ws.id, {}));
    room.sockets.set(ws.id, ws);
    room.seq += 1;
    metrics.setGauge("rooms_active", realtimeState.roomCount());
    metrics.setGauge("players_active", realtimeState.playerCount());

    const players = getNearbyPlayers(room, ws.id);
    ws.send(
      ((data) => {
        metrics.observeWsOutBytes(data.byteLength);
        return data;
      })(serializeRealtimeMessage("welcome", {
        protocolVersion: REALTIME_PROTOCOL_VERSION,
        playerId: ws.id,
        roomId,
      })),
    );
    metrics.inc("ws_messages_sent");

    const initialSnapshot: RoomSnapshotPayload = {
      roomId,
      seq: room.seq,
      ts: Date.now(),
      players,
      isDelta: false,
    };
    {
      const data = serializeRealtimeMessage("snapshot", initialSnapshot);
      ws.send(data);
      metrics.observeWsOutBytes(data.byteLength);
    }
    room.snapshotCacheByRecipient.set(
      ws.id,
      new Map(
        Object.entries(players).map(([playerId, current]) => [
          playerId,
          playerSignature(current),
        ]),
      ),
    );
    room.lastKeyframeSeqByRecipient.set(ws.id, room.seq);
    metrics.inc("ws_messages_sent");
  },
  message(ws: any, rawMessage: unknown) {
    metrics.observeWsInBytes(rawMessageByteLength(rawMessage));
    const envelope = parseRealtimeMessage(rawMessage);
    if (!envelope) return;
    const { type, payload } = envelope;
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
      {
        const data = serializeRealtimeMessage("heartbeat_ack", { seq: ackSeq, ts: Date.now() });
        ws.send(data);
        metrics.observeWsOutBytes(data.byteLength);
      }
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
      if (realtimeDebug && nextInput.seq % 20 === 0) {
        console.log("🎮 input", {
          roomId,
          wsId: ws.id,
          seq: nextInput.seq,
          dx: Number(nextInput.dx.toFixed(3)),
          dy: Number(nextInput.dy.toFixed(3)),
          isSitting: nextInput.isSitting,
        });
      }
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

  },
  close(ws: any) {
    const roomId = ws.data.query.room;
    const room = realtimeState.getRoom(roomId);
    if (room) room.sockets.delete(ws.id);
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
        const beforeX = player.x;
        const beforeY = player.y;
        const applied = applyInputAuthoritatively(player, input);
        if (applied) {
          metrics.inc("ws_input_applied");
          if (realtimeDebug && input.seq % 20 === 0) {
            console.log("✅ applied", {
              roomId: room.roomId,
              playerId,
              seq: input.seq,
              from: { x: Math.round(beforeX), y: Math.round(beforeY) },
              to: { x: Math.round(player.x), y: Math.round(player.y) },
            });
          }
        } else {
          metrics.inc("ws_input_rejected");
          if (realtimeDebug) {
            console.log("⛔ rejected", {
              roomId: room.roomId,
              playerId,
              seq: input.seq,
              inputSeq: player.inputSeq,
            });
          }
        }
      }
    }
    room.pendingInputs.clear();

    room.seq += 1;
    let snapshotRecipients = 0;
    let snapshotPlayersTotal = 0;
    let snapshotBytesTotal = 0;
    for (const [playerId, socket] of room.sockets.entries()) {
      const selfPlayer = room.players.get(playerId);
      if (!selfPlayer) continue;
      const players = getNearbyPlayers(room, playerId);
      const previousSignatures = room.snapshotCacheByRecipient.get(playerId) || new Map<string, string>();
      const nextSignatures = new Map<string, string>();
      const changedPlayers: Record<string, unknown> = {};
      const shouldSendFar = room.seq % SNAPSHOT_FAR_RATE_TICKS === 0;
      const lastKeyframeSeq = room.lastKeyframeSeqByRecipient.get(playerId) || 0;
      const forceKeyframe = room.seq - lastKeyframeSeq >= SNAPSHOT_KEYFRAME_INTERVAL;
      for (const [visibleId, visiblePlayer] of Object.entries(players)) {
        const sig = playerSignature(visiblePlayer);
        nextSignatures.set(visibleId, sig);
        const changed = previousSignatures.get(visibleId) !== sig;
        if (forceKeyframe) {
          changedPlayers[visibleId] = visiblePlayer;
          continue;
        }
        if (visibleId === playerId || isNearPlayer(selfPlayer, visiblePlayer)) {
          if (changed || shouldSendFar) changedPlayers[visibleId] = visiblePlayer;
          continue;
        }
        if (changed || shouldSendFar) {
          changedPlayers[visibleId] = visiblePlayer;
        }
      }
      const removedPlayerIds: string[] = [];
      for (const previousId of previousSignatures.keys()) {
        if (!nextSignatures.has(previousId)) {
          removedPlayerIds.push(previousId);
        }
      }
      room.snapshotCacheByRecipient.set(playerId, nextSignatures);
      if (Object.keys(changedPlayers).length === 0 && removedPlayerIds.length === 0) {
        continue;
      }
      const snapshot: RoomSnapshotPayload = {
        roomId: room.roomId,
        seq: room.seq,
        ts: now,
        players: changedPlayers as RoomSnapshotPayload["players"],
        removedPlayerIds: forceKeyframe ? [] : removedPlayerIds,
        isDelta: !forceKeyframe,
      };
      try {
        const serialized = serializeRealtimeMessage("snapshot", snapshot);
        socket.send(serialized);
        metrics.observeWsOutBytes(serialized.byteLength);
        metrics.observeKeyframe(forceKeyframe);
        if (forceKeyframe) room.lastKeyframeSeqByRecipient.set(playerId, room.seq);
        snapshotRecipients += 1;
        snapshotPlayersTotal += Object.keys(changedPlayers).length;
        snapshotBytesTotal += serialized.byteLength;
        metrics.inc("ws_messages_sent");
      } catch {
        // Ignore transient socket send errors; heartbeat cleanup handles stale clients.
      }
    }
    metrics.observeSnapshotStats(
      snapshotPlayersTotal,
      snapshotRecipients,
      snapshotBytesTotal,
    );
    metrics.inc("ws_snapshot_broadcasts");
  }

  metrics.setGauge("rooms_active", realtimeState.roomCount());
  metrics.setGauge("players_active", realtimeState.playerCount());
  metrics.observeTickMs(Date.now() - tickStart);
  metrics.endTick();
}, SNAPSHOT_TICK_MS);

app.listen(process.env.PORT || 3000);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`,
);
