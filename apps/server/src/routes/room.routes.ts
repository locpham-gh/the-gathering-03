import { Elysia, t } from "elysia";
import { Room } from "../models/Room.js";
import { jwt } from "@elysiajs/jwt";

/**
 * Using 'any' for the export to resolve the TypeScript error:
 * "The inferred type of 'roomRoutes' cannot be named without a reference to '.bun/jose@6.2.2/node_modules/jose'"
 * This happens because Elysia's JWT plugin type inference is extremely complex.
 */
export const roomRoutes: any = new Elysia({ prefix: "/api/rooms" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "fallback_secret_for_development",
    }),
  )
  .derive(async ({ jwt, headers }: any) => {
    const auth = headers["authorization"];
    if (!auth) return { user: null };

    const token = auth.split(" ")[1];
    const user = await jwt.verify(token);
    return { user };
  })
  .get("/", async ({ user, set }: any) => {
    const userId = user?.userId || user?.id;

    if (!userId) {
      set.status = 401;
      return { success: false, error: "Unauthorized: No user ID in session" };
    }

    try {
      // 1. Assign current user as owner for orphaned rooms
      await Room.updateMany(
        { ownerId: { $exists: false } },
        { ownerId: user.userId },
      );
      await Room.updateMany({ ownerId: null }, { ownerId: user.userId });

      // 2. Fetch all rooms where the user is owner OR member
      const rooms = await Room.find({
        $or: [{ ownerId: userId }, { members: userId }],
      })
        .populate("ownerId", "displayName email avatarUrl")
        .sort({ createdAt: -1 });

      return { success: true, rooms };
    } catch (err: any) {
      console.error("GET /api/rooms Error:", err);
      set.status = 500;
      return { success: false, error: err.message };
    }
  })
  .post(
    "/",
    async ({ body, user, set }: any) => {
      if (!user) {
        set.status = 401;
        return { success: false, error: "Unauthorized" };
      }

      const { name, code } = body;

      try {
        const room = await Room.create({
          name,
          code,
          ownerId: user.userId,
          members: [user.userId],
        });

        return { success: true, room };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      body: t.Object({
        name: t.String(),
        code: t.String(),
      }),
    },
  )
  .post("/join/:code", async ({ params, user, set }: any) => {
    if (!user) {
      set.status = 401;
      return { success: false, error: "Unauthorized" };
    }

    try {
      const room = await Room.findOne({ code: params.code });
      if (!room) {
        set.status = 404;
        return { success: false, error: "Room not found" };
      }

      if (!room.members.includes(user.userId)) {
        room.members.push(user.userId);
        await room.save();
      }

      return { success: true, room };
    } catch (err: any) {
      set.status = 500;
      return { success: false, error: err.message };
    }
  })
  .delete("/:id", async ({ params, user, set }: any) => {
    if (!user) {
      set.status = 401;
      return { success: false, error: "Unauthorized" };
    }

    try {
      const room = await Room.findById(params.id);
      if (!room) {
        set.status = 404;
        return { success: false, error: "Room not found" };
      }

      if (room.ownerId.toString() !== user.userId) {
        set.status = 403;
        return { success: false, error: "Only the owner can delete this room" };
      }

      await Room.findByIdAndDelete(params.id);
      return { success: true, message: "Room deleted successfully" };
    } catch (err: any) {
      set.status = 500;
      return { success: false, error: err.message };
    }
  });
