import mongoose, { Schema, Document, Types } from "mongoose";

interface IReply {
  _id?: Types.ObjectId;
  authorId: Types.ObjectId;
  replyTo?: Types.ObjectId; // Optional: The user being replied to
  content: string;
  likes: Types.ObjectId[]; // Added likes for replies
  createdAt: Date;
}

export interface IForumTopic extends Document {
  title: string;
  authorId: Types.ObjectId;
  likes: Types.ObjectId[];
  replies: IReply[];
}

const ReplySchema = new Schema<IReply>({
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  replyTo: { type: Schema.Types.ObjectId, ref: 'User' },
  content: { type: String, required: true },
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

const ForumTopicSchema = new Schema<IForumTopic>(
  {
    title: { type: String, required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    replies: [ReplySchema],
  },
  { timestamps: true }
);

export const ForumTopic = mongoose.model<IForumTopic>("ForumTopic", ForumTopicSchema);
