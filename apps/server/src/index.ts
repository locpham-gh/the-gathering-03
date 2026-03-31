import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { jwt } from "@elysiajs/jwt";
import { connectDB } from "./db/connection.js";
import { authRoutes } from "./routes/auth.routes.js";
import { resourceRoutes } from "./routes/resource.routes.js";
import { forumRoutes } from "./routes/forum.routes.js";
import { roomRoutes } from "./routes/room.routes.js";
import { AccessToken } from "livekit-server-sdk";

// Boot up MongoDB
connectDB();

const jwtConfig = jwt({
  name: "jwt",
  secret: process.env.JWT_SECRET || "fallback_secret_for_development",
});

// Multiplayer State (In-memory for development)
const activePlayers = new Map<string, Map<string, any>>(); // roomId -> (wsId -> data)

const app = new Elysia()
  .use(cors())
  .use(jwtConfig)
  .use(authRoutes)
  .use(resourceRoutes)
  .use(forumRoutes)
  .use(roomRoutes)
  .get("/", () => "Hello from The Gathering Backend")
  // Generate LiveKit Token
  .get("/api/livekit/token", async ({ query }: any) => {
    const { room, username } = query;
    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!,
      { identity: username }
    );
    at.addGrant({ roomJoin: true, room: room });
    return { token: await at.toJwt() };
  }, {
    query: t.Object({ room: t.String(), username: t.String() })
  })
  // Native Bun WebSocket Support
  .ws("/ws", {
    query: t.Object({ room: t.String() }),
    body: t.Object({ type: t.String(), payload: t.Any() }),
    open(ws) {
      const roomId = ws.data.query.room;
      console.log(`📡 New connection in room ${roomId}: ${ws.id}`);
      
      ws.subscribe(`room-${roomId}`);
      
      // Initialize room if not exists
      if (!activePlayers.has(roomId)) {
        activePlayers.set(roomId, new Map());
      }

      // Send current players in room to newcomer
      const playersInRoom = Object.fromEntries(activePlayers.get(roomId)!);
      ws.send({
        type: "initial_state",
        payload: { players: playersInRoom }
      });
    },
    message(ws, { type, payload }) {
      const roomId = ws.data.query.room;
      
      if (type === "move") {
        // Update player data in memory
        const room = activePlayers.get(roomId);
        if (room) {
          room.set(ws.id, { id: ws.id, ...payload });
        }

        // Broadcast player movement to room
        ws.publish(`room-${roomId}`, {
          type: "player_moved",
          payload: { id: ws.id, ...payload }
        });
      }
    },
    close(ws) {
      const roomId = ws.data.query.room;
      console.log(`🔌 Connection closed in room ${roomId}: ${ws.id}`);
      
      const room = activePlayers.get(roomId);
      if (room) {
        room.delete(ws.id);
        if (room.size === 0) activePlayers.delete(roomId);
      }

      ws.publish(`room-${roomId}`, {
        type: "player_left",
        payload: { id: ws.id }
      });
    }
  })
  .listen(process.env.PORT || 3000);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`,
);
