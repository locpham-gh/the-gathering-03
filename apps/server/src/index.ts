import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { jwt } from "@elysiajs/jwt";
import { connectDB } from "./db/connection.js";
import { authRoutes } from "./routes/auth.routes.js";
import { AccessToken } from "livekit-server-sdk";

// Boot up MongoDB
connectDB();

const jwtConfig = jwt({
  name: "jwt",
  secret: process.env.JWT_SECRET || "fallback_secret_for_development",
});

const app = new Elysia()
  .use(cors())
  .use(jwtConfig)
  .use(authRoutes)
  .get("/", () => "Hello from The Gathering Backend")
  // Generate LiveKit Token
  .get("/api/livekit/token", async ({ query, jwt }: any) => {
    const { room, username } = query;
    
    // We can also verify JWT here to ensure user is logged in
    
    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!,
      {
        identity: username,
      }
    );
    at.addGrant({ roomJoin: true, room: room });

    return { token: await at.toJwt() };
  }, {
    query: t.Object({
      room: t.String(),
      username: t.String()
    })
  })
  // Native Bun WebSocket Support
  .ws("/ws", {
    body: t.Object({
      type: t.String(),
      payload: t.Any()
    }),
    open(ws) {
      console.log(`📡 New connection: ${ws.id}`);
      ws.subscribe("global-presence");
    },
    message(ws, { type, payload }) {
      if (type === "move") {
        // Broadcast player movement to everyone else
        ws.publish("global-presence", {
          type: "player_moved",
          payload: {
            id: ws.id,
            ...payload
          }
        });
      }
    },
    close(ws) {
      console.log(`🔌 Connection closed: ${ws.id}`);
      ws.publish("global-presence", {
        type: "player_left",
        payload: { id: ws.id }
      });
    }
  })
  .listen(process.env.PORT || 3000);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`,
);
