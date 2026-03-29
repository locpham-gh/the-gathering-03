import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  displayName: string;
  avatarUrl?: string;
  googleId: string;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    avatarUrl: { type: String },
    googleId: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", UserSchema);
