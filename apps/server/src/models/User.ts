import mongoose, { Schema, Document } from "mongoose";
import type { Character2D, Gender } from "../utils/profile.js";

export interface IUser extends Document {
  email: string;
  displayName?: string;
  avatarUrl?: string;
  gender: Gender;
  character2d: Character2D;
  googleId?: string;
  otpCode?: string;
  otpExpiresAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    displayName: { type: String },
    avatarUrl: { type: String },
    gender: { type: String, enum: ["male", "female", "other"], default: "other" },
    character2d: {
      type: String,
      enum: ["Adam", "Alex", "Amelia", "Bob"],
      default: "Adam",
    },
    googleId: { type: String, sparse: true, unique: true },
    otpCode: { type: String },
    otpExpiresAt: { type: Date },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", UserSchema);
