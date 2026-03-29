import mongoose, { Schema, Document, Types } from "mongoose";

export interface IEvent extends Document {
  title: string;
  date: Date;
  livekitRoomId: string;
  attendees: Types.ObjectId[];
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true },
    date: { type: Date, required: true },
    livekitRoomId: { type: String, required: true, unique: true },
    attendees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export const Event = mongoose.model<IEvent>("Event", EventSchema);
