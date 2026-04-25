import { Elysia, t } from "elysia";
import { Message } from "../models/Message.js";

export const chatRoutes = new Elysia({ prefix: "/api/chat" })
  .get(
    "/:roomCode/:channelName",
    async ({ params, set }: any) => {
      try {
        const { roomCode, channelName } = params;
        const messages = await Message.find({ roomCode, channelName })
          .populate("authorId", "displayName avatarUrl")
          .sort({ createdAt: 1 })
          .limit(100);
        return { success: true, messages };
      } catch (err: any) {
        set.status = 500;
        return { success: false, message: "Error fetching messages" };
      }
    },
    {
      params: t.Object({
        roomCode: t.String(),
        channelName: t.String(),
      }),
    }
  )
  .post(
    "/",
    async ({ body, set }: any) => {
      try {
        const { roomCode, channelName, content, authorId } = body;
        const newMessage = new Message({
          roomCode,
          channelName,
          content,
          authorId,
        });
        await newMessage.save();

        const populatedMessage = await Message.findById(newMessage._id).populate(
          "authorId",
          "displayName avatarUrl"
        );

        return { success: true, message: populatedMessage };
      } catch (err: any) {
        set.status = 500;
        return { success: false, message: "Error saving message" };
      }
    },
    {
      body: t.Object({
        roomCode: t.String(),
        channelName: t.String(),
        content: t.String(),
        authorId: t.String(),
      }),
    }
  );
