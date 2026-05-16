import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    roomCode: { type: String, required: true },
    channelName: { type: String, required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: false },
    fileUrl: { type: String, required: false },
    fileName: { type: String, required: false },
    fileType: { type: String, required: false },
    fileSize: { type: Number, required: false },
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", MessageSchema);
