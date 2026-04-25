import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    roomCode: { type: String, required: true },
    channelName: { type: String, required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", MessageSchema);
