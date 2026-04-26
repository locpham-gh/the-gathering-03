import mongoose, { Schema, Document } from "mongoose";

export interface IRoom extends Document {
  name: string;
  code: string;
  map: string;
  ownerId: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  savedPositions?: Map<string, { x: number; y: number }>;
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    map: { type: String, default: "office" },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    savedPositions: {
      type: Map,
      of: new Schema({
        x: { type: Number, required: true },
        y: { type: Number, required: true }
      }, { _id: false }),
      default: {}
    },
  },
  { timestamps: true }
);

export const Room = mongoose.model<IRoom>("Room", RoomSchema);
