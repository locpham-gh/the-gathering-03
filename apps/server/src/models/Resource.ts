import mongoose, { Schema, Document } from "mongoose";

export interface IResource extends Document {
  title: string;
  description: string;
  contentType: "guide" | "e-book" | "course";
  fileUrl: string;
  thumbnailUrl: string;
  tags: string[];
  size?: number; // legacy backwards compatibility
}

const ResourceSchema = new Schema<IResource>(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    contentType: {
      type: String,
      enum: ["guide", "e-book", "course"],
      required: true,
    },
    fileUrl: { type: String, required: true },
    thumbnailUrl: { type: String, default: "" },
    tags: [{ type: String }],
    size: { type: Number },
  },
  { timestamps: true },
);

// Add index for search
ResourceSchema.index({ title: "text", tags: "text", description: "text" });

export const Resource = mongoose.model<IResource>("Resource", ResourceSchema);
