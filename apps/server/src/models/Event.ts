import mongoose, { Schema, Document, Types } from "mongoose";

export interface IEvent extends Document {
  title: string;
  description: string;
  roomId: Types.ObjectId;
  hostId: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  guestEmails: string[];
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    guestEmails: [{ type: String }],
  },
  { timestamps: true }
);

export const Event = mongoose.model<IEvent>("Event", EventSchema);
