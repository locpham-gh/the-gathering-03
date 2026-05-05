import { User } from "../models/User.js";
import { Room } from "../models/Room.js";
import { ForumTopic } from "../models/ForumTopic.js";
import { Whitelist } from "../models/Whitelist.js";
import { Resource } from "../models/Resource.js";

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

  updateUserRole: async ({ params, body, user, set }: any) => {
    if (params.id === user.userId) {
      set.status = 403;
      return { success: false, error: "Cannot modify your own administrative role" };
    }

    // Protection: Cannot demote the person who whitelisted you
    const [targetUser, currentUserWhitelist] = await Promise.all([
      User.findById(params.id),
      Whitelist.findOne({ email: user.email.toLowerCase() })
    ]);

    if (currentUserWhitelist && currentUserWhitelist.addedBy && targetUser && 
        currentUserWhitelist.addedBy.toString() === targetUser._id.toString()) {
      set.status = 403;
      return { success: false, error: "Security restriction: Cannot modify the role of your authorization granter" };
    }

    const { role } = body;
    const updatedUser = await User.findByIdAndUpdate(
      params.id,
      { role },
      { new: true },
    );
    if (!updatedUser) {
      set.status = 404;
      return { success: false, error: "User not found" };
    }
    return { success: true, user: updatedUser };
  },

  updateUserStatus: async ({ params, body, user, set }: any) => {
    if (params.id === user.userId) {
      set.status = 403;
      return { success: false, error: "Cannot modify your own account status" };
    }

    // Protection: Cannot ban the person who whitelisted you
    const [targetUser, currentUserWhitelist] = await Promise.all([
      User.findById(params.id),
      Whitelist.findOne({ email: user.email.toLowerCase() })
    ]);

    if (currentUserWhitelist && currentUserWhitelist.addedBy && targetUser && 
        currentUserWhitelist.addedBy.toString() === targetUser._id.toString()) {
      set.status = 403;
      return { success: false, error: "Security restriction: Cannot modify the status of your authorization granter" };
    }

    const { status } = body;
    const updatedUser = await User.findByIdAndUpdate(
      params.id,
      { status },
      { new: true },
    );
    if (!updatedUser) {
      set.status = 404;
      return { success: false, error: "User not found" };
    }
    return { success: true, user: updatedUser };
  },

  deleteUser: async ({ params, user, set }: any) => {
    if (params.id === user.userId) {
      set.status = 403;
      return { success: false, error: "Cannot delete your own administrative account" };
    }
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

  removeFromWhitelist: async ({ params, user, set }: any) => {
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

    // Protection: Cannot remove the person who whitelisted you
    const [targetWhitelist, currentUserWhitelist] = await Promise.all([
      Whitelist.findOne({ email }),
      Whitelist.findOne({ email: user.email.toLowerCase() })
    ]);

    if (currentUserWhitelist && currentUserWhitelist.addedBy && targetWhitelist &&
        currentUserWhitelist.addedBy.toString() === (targetWhitelist as any)._id.toString()) {
        // Wait, addedBy is an ID, targetWhitelist is an object.
        // We need to see if the target person is the one who added us.
        // But targetWhitelist is identified by email. 
        // We need the User ID of the person with that email.
    }
    
    // Better logic:
    const targetUser = await User.findOne({ email });
    if (currentUserWhitelist && currentUserWhitelist.addedBy && targetUser &&
        currentUserWhitelist.addedBy.toString() === targetUser._id.toString()) {
        set.status = 403;
        return { success: false, error: "Security restriction: Cannot revoke access for your authorization granter" };
    }

    const deleted = await Whitelist.findOneAndDelete({ email });
    if (!deleted) {
      set.status = 404;
      return { success: false, error: "Email not found in whitelist" };
    }

    await User.updateOne({ email }, { role: "user" });

    return { success: true, message: "Email removed from whitelist" };
  },

  // --- LIBRARY MANAGEMENT ---
  getLibrary: async ({ query }: any) => {
    const { search, contentType, tag, page = 1, limit = 10 } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter: any = {};
    if (contentType) filter.contentType = contentType;
    if (tag) filter.tags = tag;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const [resources, total] = await Promise.all([
      Resource.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Resource.countDocuments(filter),
    ]);

    return {
      success: true,
      resources,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  },

  addResource: async ({ body, set }: any) => {
    try {
      const resource = new Resource(body);
      await resource.save();
      return { success: true, resource };
    } catch (error: any) {
      set.status = 400;
      return { success: false, error: error.message };
    }
  },

  deleteResource: async ({ params }: any) => {
    await Resource.findByIdAndDelete(params.id);
    return { success: true };
  },

  uploadFile: async ({ body, set }: any) => {
    try {
      const file = body.file as File;
      if (!file) {
        set.status = 400;
        return { success: false, error: "No file provided" };
      }
      
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const path = `./public/uploads/${fileName}`;
      
      // Ensure directory exists
      const fs = require('fs');
      if (!fs.existsSync('./public/uploads')) {
        fs.mkdirSync('./public/uploads', { recursive: true });
      }
      
      fs.writeFileSync(path, buffer);
      
      const fileUrl = `${process.env.VITE_API_URL || "http://localhost:3000"}/public/uploads/${fileName}`;
      
      return { success: true, url: fileUrl };
    } catch (error: any) {
      set.status = 500;
      return { success: false, error: error.message };
    }
  },
};
