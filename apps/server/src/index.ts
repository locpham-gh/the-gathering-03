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

// Boot up MongoDB
connectDB();

const jwtConfig = jwt({
  name: "jwt",
  secret: process.env.JWT_SECRET || "fallback_secret_for_development",
});

// Multiplayer State (In-memory for development)
const activePlayers = new Map<string, Map<string, any>>(); // roomId -> (wsId -> data)

const app = new Elysia();

export const broadcastForumUpdate = () => {
  if (!app.server) {
    console.log("⚠️ Server instance not ready for broadcast");
    return;
  }
  console.log("📢 Broadcasting forum update to global-forum...");
  const message = JSON.stringify({
    type: "forum_refresh",
    payload: { timestamp: Date.now() }
  });
  app.server.publish("global-forum", message);
};

export const broadcastNotification = (userId: string) => {
  if (!app.server) return;
  console.log(`📢 Broadcasting notification to user-${userId}`);
  const message = JSON.stringify({
    type: "new_notification",
    payload: { timestamp: Date.now() }
  });
  app.server.publish(`user-${userId}`, message);
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

app.get(
  "/api/livekit/token",
  async ({ query }: any) => {
    const { room, username } = query;
    const effectiveRoomId = room || "lobby";
    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!,
      { identity: username },
    );
    at.addGrant({ roomJoin: true, room: effectiveRoomId });
    return { token: await at.toJwt() };
  },
  {
    query: t.Object({ room: t.Optional(t.String()), username: t.String() }),
  },
);

// 3. WebSocket Setup
app.ws("/ws", {
  query: t.Object({ 
    room: t.Optional(t.String()),
    userId: t.Optional(t.String())
  }),
  body: t.Object({ type: t.String(), payload: t.Any() }),
  open(ws: any) {
    const roomId = ws.data.query.room || "lobby";
    const userId = ws.data.query.userId;
    
    console.log(`📡 New connection in room ${roomId}: ${ws.id}${userId ? ` (User: ${userId})` : ""}`);
    
    if (roomId !== "lobby") {
      ws.subscribe(`room-${roomId}`);
    }
    ws.subscribe("global-forum");
    
    if (userId) {
      ws.subscribe(`user-${userId}`);
    }

    if (roomId !== "lobby") {
      if (!activePlayers.has(roomId)) {
        activePlayers.set(roomId, new Map());
      }
      activePlayers.get(roomId)?.set(ws.id, {
        id: ws.id,
        x: 0,
        y: 0,
        isSitting: false,
        character: "Adam",
      });
    }

    const playersInRoom = roomId !== "lobby" ? Object.fromEntries(activePlayers.get(roomId)!) : {};
    ws.send({
      type: "initial_state",
      payload: { players: playersInRoom },
    });
  },
  message(ws: any, { type, payload }: any) {
    const roomId = ws.data.query.room || "lobby";
    if (type === "move") {
      const room = activePlayers.get(roomId);
      if (room) {
        room.set(ws.id, { id: ws.id, ...payload });
      }
      ws.publish(`room-${roomId}`, {
        type: "player_moved",
        payload: { id: ws.id, ...payload },
      });
    }
  },
  close(ws: any) {
    const roomId = ws.data.query.room || "lobby";
    console.log(`🔌 Connection closed in room ${roomId}: ${ws.id}`);

    const room = activePlayers.get(roomId);
    if (room) {
      room.delete(ws.id);
      if (room.size === 0) activePlayers.delete(roomId);
    }

    ws.publish(`room-${roomId}`, {
      type: "player_left",
      payload: { id: ws.id },
    });
  },
});

app.listen(process.env.PORT || 3000);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`,
);
