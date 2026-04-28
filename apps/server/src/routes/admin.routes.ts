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
  
  // --- STATS OVERVIEW ---
  .get("/stats", async () => {
    const [userCount, roomCount, topicCount, bannedCount] = await Promise.all([
      User.countDocuments(),
      Room.countDocuments(),
      ForumTopic.countDocuments(),
      User.countDocuments({ status: "banned" })
    ]);

    return { 
      success: true, 
      stats: {
        totalUsers: userCount,
        totalRooms: roomCount,
        totalTopics: topicCount,
        bannedUsers: bannedCount
      }
    };
  })

  // --- USER MANAGEMENT ---
  .get("/users", async ({ query }: any) => {
    const { search, page = 1, limit = 10 } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const filter = search 
      ? { $or: [{ email: { $regex: search, $options: "i" } }, { displayName: { $regex: search, $options: "i" } }] }
      : {};
    
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(filter)
    ]);

    return { 
      success: true, 
      users, 
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
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
  .get("/rooms", async ({ query }: any) => {
    const { page = 1, limit = 10 } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [rooms, total] = await Promise.all([
      Room.find().populate('ownerId', 'email displayName').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Room.countDocuments()
    ]);

    return { 
      success: true, 
      rooms,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  })
  .delete("/rooms/:id", async ({ params }: any) => {
    await Room.findByIdAndDelete(params.id);
    return { success: true };
  })

  // --- FORUM MANAGEMENT ---
  .get("/forum/topics", async ({ query }: any) => {
    const { page = 1, limit = 10 } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [topics, total] = await Promise.all([
      ForumTopic.find().populate('authorId', 'displayName').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      ForumTopic.countDocuments()
    ]);

    return { 
      success: true, 
      topics,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  })
  .delete("/forum/topics/:id", async ({ params }: any) => {
    await ForumTopic.findByIdAndDelete(params.id);
    return { success: true };
  });
