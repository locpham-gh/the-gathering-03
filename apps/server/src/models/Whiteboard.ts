import mongoose, { Schema, Document } from "mongoose";

export interface IWhiteboard extends Document {
  roomId: string;
  elements: any[];
  appState: any;
  files: any;
  updatedAt: Date;
}

const WhiteboardSchema = new Schema<IWhiteboard>(
  {
    roomId: { type: String, required: true, unique: true },
    elements: { type: Schema.Types.Mixed, default: [] },
    appState: { type: Schema.Types.Mixed, default: {} },
    files: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const Whiteboard = mongoose.model<IWhiteboard>("Whiteboard", WhiteboardSchema);
