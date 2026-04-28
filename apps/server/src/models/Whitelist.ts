import mongoose, { Schema, Document } from "mongoose";

export interface IWhitelist extends Document {
  email: string;
  addedBy?: mongoose.Types.ObjectId;
}

const WhitelistSchema = new Schema<IWhitelist>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    addedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export const Whitelist = mongoose.model<IWhitelist>(
  "Whitelist",
  WhitelistSchema,
);
