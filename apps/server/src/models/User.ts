import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  displayName?: string;
  avatarUrl?: string;
  googleId?: string;
  otpCode?: string;
  otpExpiresAt?: Date;
  role: "user" | "admin";
  status: "active" | "banned";
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    displayName: { type: String },
    avatarUrl: { type: String },
    googleId: { type: String, sparse: true, unique: true },
    otpCode: { type: String },
    otpExpiresAt: { type: Date },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    status: { type: String, enum: ["active", "banned"], default: "active" },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", UserSchema);
