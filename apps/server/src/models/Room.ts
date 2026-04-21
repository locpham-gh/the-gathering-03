import mongoose, { Schema, Document } from "mongoose";

export interface IRoom extends Document {
  name: string;
  code: string;
  mapVersion: "v2" | "v3" | "v4";
  ownerId: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    mapVersion: {
      type: String,
      enum: ["v2", "v3", "v4"],
      default: "v3",
    },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export const Room = mongoose.model<IRoom>("Room", RoomSchema);
