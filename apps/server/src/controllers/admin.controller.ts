import { User } from "../models/User.js";
import { Room } from "../models/Room.js";
import { ForumTopic } from "../models/ForumTopic.js";
import { Whitelist } from "../models/Whitelist.js";

export const adminController = {
  getStats: async () => {
    const [userCount, roomCount, topicCount, bannedCount] = await Promise.all([
      User.countDocuments(),
      Room.countDocuments(),
      ForumTopic.countDocuments(),
      User.countDocuments({ status: "banned" }),
    ]);

    return {
      success: true,
      stats: {
        totalUsers: userCount,
        totalRooms: roomCount,
        totalTopics: topicCount,
        bannedUsers: bannedCount,
      },
    };
  },

  getUsers: async ({ query }: any) => {
    const { search, page = 1, limit = 10 } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = search
      ? {
          $or: [
            { email: { $regex: search, $options: "i" } },
            { displayName: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    return {
      success: true,
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  },

  updateUserRole: async ({ params, body, set }: any) => {
    const { role } = body;
    const user = await User.findByIdAndUpdate(
      params.id,
      { role },
      { new: true },
    );
    if (!user) {
      set.status = 404;
      return { success: false, error: "User not found" };
    }
    return { success: true, user };
  },

  updateUserStatus: async ({ params, body, set }: any) => {
    const { status } = body;
    const user = await User.findByIdAndUpdate(
      params.id,
      { status },
      { new: true },
    );
    if (!user) {
      set.status = 404;
      return { success: false, error: "User not found" };
    }
    return { success: true, user };
  },

  deleteUser: async ({ params }: any) => {
    await User.findByIdAndDelete(params.id);
    return { success: true };
  },

  getRooms: async ({ query }: any) => {
    const { page = 1, limit = 10 } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [rooms, total] = await Promise.all([
      Room.find()
        .populate("ownerId", "email displayName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Room.countDocuments(),
    ]);

    return {
      success: true,
      rooms,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  },

  deleteRoom: async ({ params }: any) => {
    await Room.findByIdAndDelete(params.id);
    return { success: true };
  },

  getForumTopics: async ({ query }: any) => {
    const { page = 1, limit = 10 } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [topics, total] = await Promise.all([
      ForumTopic.find()
        .populate("authorId", "displayName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ForumTopic.countDocuments(),
    ]);

    return {
      success: true,
      topics,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  },

  deleteForumTopic: async ({ params }: any) => {
    await ForumTopic.findByIdAndDelete(params.id);
    return { success: true };
  },

  getWhitelist: async () => {
    const list = await Whitelist.find()
      .sort({ createdAt: -1 })
      .populate("addedBy", "email displayName");
    return { success: true, list };
  },

  addToWhitelist: async ({ body, user, set }: any) => {
    const email = body.email.toLowerCase().trim();
    if (!email) {
      set.status = 400;
      return { success: false, error: "Email is required" };
    }

    let whitelisted = await Whitelist.findOne({ email });
    if (whitelisted) {
      set.status = 400;
      return { success: false, error: "Email is already in whitelist" };
    }

    whitelisted = new Whitelist({ email, addedBy: user.userId });
    await whitelisted.save();

    await User.updateOne({ email }, { role: "admin" });

    return { success: true, item: whitelisted };
  },

  removeFromWhitelist: async ({ params, set }: any) => {
    const email = params.email.toLowerCase().trim();
    const masterAdminEmails = (process.env.MASTER_ADMIN_EMAIL || "")
      .toLowerCase()
      .split(",")
      .map((e) => e.trim());

    if (masterAdminEmails.includes(email)) {
      set.status = 403;
      return {
        success: false,
        error: "Cannot remove Master Admin from whitelist",
      };
    }

    const deleted = await Whitelist.findOneAndDelete({ email });
    if (!deleted) {
      set.status = 404;
      return { success: false, error: "Email not found in whitelist" };
    }

    await User.updateOne({ email }, { role: "user" });

    return { success: true, message: "Email removed from whitelist" };
  },
};
