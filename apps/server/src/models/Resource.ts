import mongoose, { Schema, Document } from "mongoose";

export interface IResource extends Document {
  title: string;
  type: "pdf" | "video";
  fileUrl: string;
  size: number;
}

const ResourceSchema = new Schema<IResource>(
  {
    title: { type: String, required: true },
    type: { type: String, enum: ["pdf", "video"], required: true },
    fileUrl: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { timestamps: true }
);

export const Resource = mongoose.model<IResource>("Resource", ResourceSchema);
