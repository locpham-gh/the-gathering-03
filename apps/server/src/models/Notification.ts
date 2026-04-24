import { Schema, model, Document, Types } from "mongoose";

export interface INotification extends Document {
  recipient: Types.ObjectId;
  sender: Types.ObjectId;
  type: "like" | "reply";
  topicId: Types.ObjectId;
  content?: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["like", "reply"], required: true },
    topicId: { type: Schema.Types.ObjectId, ref: "ForumTopic", required: true },
    content: { type: String },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Notification = model<INotification>("Notification", NotificationSchema);
