import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { jwt } from "@elysiajs/jwt";
import { connectDB } from "./db/connection.js";
import { authRoutes } from "./routes/auth.routes.js";
import { resourceRoutes } from "./routes/resource.routes.js";
import { forumRoutes } from "./routes/forum.routes.js";
import { roomRoutes } from "./routes/room.routes.js";
import { eventRoutes } from "./routes/event.routes.js";
import { chatRoutes } from "./routes/chat.routes.js";
import { adminRoutes } from "./routes/admin.routes.js";
import { AccessToken } from "livekit-server-sdk";
import { rateLimit } from "elysia-rate-limit";
import { multiplayerService } from "./services/multiplayer.service.js";
import { multiplayerSocket } from "./sockets/multiplayer.socket.js";

// Boot up MongoDB
connectDB();

const jwtConfig = jwt({
  name: "jwt",
  secret: process.env.JWT_SECRET || "fallback_secret_for_development",
});

const app = new Elysia()
  .use(rateLimit({ duration: 60000, max: 100 }))
  .use(cors())
  .use(jwtConfig)
  .use(authRoutes)
  .use(resourceRoutes)
  .use(forumRoutes)
  .use(roomRoutes)
  .use(eventRoutes)
  .use(chatRoutes)
  .use(adminRoutes);

// Global Broadcasters
export const broadcastForumUpdate = () => {
  if (!app.server) return;
  app.server.publish("global-forum", JSON.stringify({
    type: "forum_refresh",
    payload: { timestamp: Date.now() },
  }));
};

export const broadcastNotification = (userId: string) => {
  if (!app.server) return;
  app.server.publish(`user-${userId}`, JSON.stringify({
    type: "new_notification",
    payload: { timestamp: Date.now() },
  }));
};

// HTTP Handlers
app.get("/", () => "Hello from The Gathering Backend");

app.get("/public/*", async ({ params }) => {
  const filePath = params["*"];
  const file = Bun.file(`./public/${filePath}`);
  if (!(await file.exists())) {
    return new Response("Not Found", { status: 404 });
  }
  return file;
});

app.get("/api/livekit/token", async ({ query, jwt, headers, set }: any) => {
  const auth = headers["authorization"];
  if (!auth) { set.status = 401; return { error: "Missing token" }; }
  
  const token = auth.startsWith("Bearer ") ? auth.split(" ")[1] : auth;
  const profile = await jwt.verify(token);
  if (!profile) { set.status = 401; return { error: "Invalid token" }; }

  const { room, username } = query;
  const at = new AccessToken(process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!, { identity: username });
  at.addGrant({ roomJoin: true, room: room || "lobby" });
  return { token: await at.toJwt() };
}, {
  query: t.Object({ room: t.Optional(t.String()), username: t.String() })
});

// WebSocket Setup
app.use(multiplayerSocket);

app.listen(process.env.PORT || 3000);
console.log(`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`);
