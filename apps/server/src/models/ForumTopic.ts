import mongoose, { Schema, Document, Types } from "mongoose";

interface IReply {
  authorId: Types.ObjectId;
  content: string;
  createdAt: Date;
}

export interface IForumTopic extends Document {
  title: string;
  authorId: Types.ObjectId;
  replies: IReply[];
}

const ReplySchema = new Schema<IReply>({
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const ForumTopicSchema = new Schema<IForumTopic>(
  {
    title: { type: String, required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    replies: [ReplySchema],
  },
  { timestamps: true }
);

export const ForumTopic = mongoose.model<IForumTopic>("ForumTopic", ForumTopicSchema);
