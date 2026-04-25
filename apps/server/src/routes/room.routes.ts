import { Elysia, t } from "elysia";
import { Room } from "../models/Room.js";
import { jwt } from "@elysiajs/jwt";
import mongoose from "mongoose";

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
    const userId = (user?.userId || user?.id)?.toString();

    if (!userId || userId.length !== 24) {
      set.status = 401;
      return {
        success: false,
        error: "Unauthorized: Invalid or missing user ID in session",
      };
    }

    try {
      // 1. Health check & Self-healing for current user's rooms
      // This fixes legacy data where ownerId or members might contain Buffer objects
      const allRooms = await Room.find({
        $or: [
          { ownerId: userId },
          { members: userId },
          { ownerId: null },
          { ownerId: { $exists: false } },
        ],
      });

      for (const room of allRooms) {
        let changed = false;

        // Fix orphaned rooms (legacy logic)
        if (!room.ownerId) {
          room.ownerId = userId as any;
          changed = true;
        }

        // Fix ownerId if it's a corrupted 'buffer' object (NOT a valid ObjectId instance)
        // A valid Mongoose ObjectId has a .toHexString method
        const rawOwner = room.ownerId as any;
        if (
          rawOwner &&
          typeof rawOwner.toHexString !== "function" &&
          rawOwner.buffer
        ) {
          console.log(`🛠️ Repairing corrupted ownerId in ${room.code}`);
          room.ownerId = userId as any;
          changed = true;
        }

        // Sanitize members array: convert buffers, map to string, filter invalid
        const rawMembers = room.members || [];
        const cleanMembers = rawMembers
          .map((m: any) => {
            if (m && typeof m.toHexString !== "function" && m.buffer)
              return userId;
            return m?.toString();
          })
          .filter((m) => m && m.length === 24);

        const uniqueMembers = [...new Set(cleanMembers)];

        if (uniqueMembers.length !== rawMembers.length || changed) {
          room.members = uniqueMembers as any;
          changed = true;
        }

        if (changed) {
          await room.save();
        }
      }

      // 2. Fetch all rooms (fresh query after healing)
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
      const userId = (user?.userId || user?.id)?.toString();
      if (!userId || userId.length !== 24) {
        set.status = 401;
        return { success: false, error: "Unauthorized" };
      }

        const { name, code, map } = body;

        try {
          const room = await Room.create({
            name,
            code,
            map: map || "office",
            ownerId: userId,
            members: [userId],
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
        map: t.Optional(t.String()),
      }),
    },
  )
  .post("/join/:code", async ({ params, user, set }: any) => {
    const userId = (user?.userId || user?.id)?.toString();
    if (!userId || userId.length !== 24) {
      set.status = 401;
      return { success: false, error: "Unauthorized" };
    }

    try {
      const room = await Room.findOne({ code: params.code });
      if (!room) {
        set.status = 404;
        return { success: false, error: "Room not found" };
      }

      // Sanitize existing members to ensure no corrupt data remains before check
      const currentMembers = (room.members || [])
        .map((m) => m?.toString())
        .filter((m) => m && m.length === 24);

      if (!currentMembers.includes(userId)) {
        currentMembers.push(userId);
        // Ensure uniqueness and save
        const uniqueMembers = [...new Set(currentMembers)];
        room.members = uniqueMembers as any;
        await room.save();
      }

      return { success: true, room };
    } catch (err: any) {
      set.status = 500;
      return { success: false, error: err.message };
    }
  })
  .get("/:id/members", async ({ params, user, set }: any) => {
    const userId = (user?.userId || user?.id)?.toString();
    if (!userId || userId.length !== 24) {
      set.status = 401;
      return { success: false, error: "Unauthorized" };
    }

    try {
      let room;
      if (params.id.length === 24 && params.id.match(/^[0-9a-fA-F]{24}$/)) {
        room = await Room.findById(params.id).populate("members", "displayName email avatarUrl");
      }
      if (!room) {
        room = await Room.findOne({ code: params.id }).populate("members", "displayName email avatarUrl");
      }

      if (!room) {
        set.status = 404;
        return { success: false, error: "Room not found" };
      }

      // Deduplicate populated members by their ID
      const uniqueMembersMap = new Map();
      room.members.forEach((member: any) => {
        if (member && member._id) {
          uniqueMembersMap.set(member._id.toString(), member);
        }
      });
      const uniqueMembers = Array.from(uniqueMembersMap.values());

      return { success: true, members: uniqueMembers };
    } catch (err: any) {
      set.status = 500;
      return { success: false, error: err.message };
    }
  })
  .post(
    "/:id/kick",
    async ({ params, body, user, set }: any) => {
      const userId = (user?.userId || user?.id)?.toString();
      if (!userId || userId.length !== 24) {
        set.status = 401;
        return { success: false, error: "Unauthorized" };
      }

      try {
        const { userId: kickId } = body;
        const room = await Room.findById(params.id);
        if (!room) {
          set.status = 404;
          return { success: false, error: "Room not found" };
        }

        if (room.ownerId.toString() !== userId) {
          set.status = 403;
          return { success: false, error: "Only the owner can kick members" };
        }

        room.members = room.members.filter((m) => m.toString() !== kickId);
        await room.save();

        return { success: true, message: "Member kicked successfully" };
      } catch (err: any) {
        set.status = 500;
        return { success: false, error: err.message };
      }
    },
    {
      body: t.Object({ userId: t.String() }),
    },
  )
  .patch(
    "/:id",
    async ({ params, body, user, set }: any) => {
      const userId = (user?.userId || user?.id)?.toString();
      if (!userId || userId.length !== 24) {
        set.status = 401;
        return { success: false, error: "Unauthorized" };
      }

      try {
        const room = await Room.findById(params.id);
        if (!room) {
          set.status = 404;
          return { success: false, error: "Room not found" };
        }

        if (room.ownerId.toString() !== userId) {
          set.status = 403;
          return {
            success: false,
            error: "Only the owner can update settings",
          };
        }

        if (body.name) room.name = body.name;
        await room.save();

        return { success: true, room };
      } catch (err: any) {
        set.status = 500;
        return { success: false, error: err.message };
      }
    },
    {
      body: t.Object({ name: t.Optional(t.String()) }),
    },
  )
  .delete("/:id", async ({ params, user, set }: any) => {
    const userId = (user?.userId || user?.id)?.toString();
    if (!userId || userId.length !== 24) {
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
