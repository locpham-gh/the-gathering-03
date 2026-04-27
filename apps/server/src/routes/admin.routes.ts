import { Elysia, t } from "elysia";
import { User } from "../models/User.js";
import { Room } from "../models/Room.js";
import { ForumTopic } from "../models/ForumTopic.js";

// Admin middleware plugin
const adminGuard = (app: Elysia) => 
  app.derive(async ({ jwt, headers, set }: any) => {
    const auth = headers["authorization"];
    if (!auth) {
      set.status = 401;
      return { success: false, error: "Unauthorized" };
    }

    const token = auth.split(" ")[1];
    const decoded = await jwt.verify(token);
    
    if (!decoded || decoded.role !== "admin") {
      set.status = 403;
      return { success: false, error: "Admin access required" };
    }

    return { adminUser: decoded };
  });

export const adminRoutes = new Elysia({ prefix: "/api/admin" })
  .use(adminGuard)
  
  // --- USER MANAGEMENT ---
  .get("/users", async ({ query }: any) => {
    const { search } = query;
    const filter = search 
      ? { $or: [{ email: { $regex: search, $options: "i" } }, { displayName: { $regex: search, $options: "i" } }] }
      : {};
    
    const users = await User.find(filter).sort({ createdAt: -1 });
    return { success: true, users };
  })
  .patch("/users/:id/role", async ({ params, body, set }: any) => {
    const { role } = body;
    const user = await User.findByIdAndUpdate(params.id, { role }, { new: true });
    if (!user) {
      set.status = 404;
      return { success: false, error: "User not found" };
    }
    return { success: true, user };
  }, {
    body: t.Object({ role: t.String() })
  })
  .patch("/users/:id/status", async ({ params, body, set }: any) => {
    const { status } = body;
    const user = await User.findByIdAndUpdate(params.id, { status }, { new: true });
    if (!user) {
      set.status = 404;
      return { success: false, error: "User not found" };
    }
    return { success: true, user };
  }, {
    body: t.Object({ status: t.String() })
  })
  .delete("/users/:id", async ({ params, set }: any) => {
    await User.findByIdAndDelete(params.id);
    return { success: true };
  })

  // --- ROOM MANAGEMENT ---
  .get("/rooms", async () => {
    const rooms = await Room.find().populate('ownerId', 'email displayName').sort({ createdAt: -1 });
    return { success: true, rooms };
  })
  .delete("/rooms/:id", async ({ params }: any) => {
    await Room.findByIdAndDelete(params.id);
    return { success: true };
  })

  // --- FORUM MANAGEMENT ---
  .get("/forum/topics", async () => {
    const topics = await ForumTopic.find().populate('authorId', 'displayName').sort({ createdAt: -1 });
    return { success: true, topics };
  })
  .delete("/forum/topics/:id", async ({ params }: any) => {
    await ForumTopic.findByIdAndDelete(params.id);
    return { success: true };
  });
