import mongoose, { Schema, Document } from "mongoose";

export interface IService extends Document {
  name: string;
  provider: string;
  contactInfo: string;
}

const ServiceSchema = new Schema<IService>(
  {
    name: { type: String, required: true },
    provider: { type: String, required: true },
    contactInfo: { type: String, required: true },
  },
  { timestamps: true }
);

export const Service = mongoose.model<IService>("Service", ServiceSchema);
