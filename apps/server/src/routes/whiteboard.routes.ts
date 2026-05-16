import { Elysia, t } from "elysia";
import { Whiteboard } from "../models/Whiteboard.js";

export const whiteboardRoutes = new Elysia({ prefix: "/api/whiteboard" })
  .get("/:roomId", async ({ params, set }) => {
    try {
      const { roomId } = params;
      const whiteboard = await Whiteboard.findOne({ roomId });
      if (!whiteboard) {
        return { data: null };
      }
      return { data: whiteboard };
    } catch (err: any) {
      set.status = 500;
      return { error: err.message };
    }
  })
  .post("/:roomId", async ({ params, body, set }) => {
    try {
      const { roomId } = params;
      const { elements, appState, files } = body as any;

      const updated = await Whiteboard.findOneAndUpdate(
        { roomId },
        { roomId, elements, appState, files },
        { upsert: true, new: true }
      );

      return { success: true, data: updated };
    } catch (err: any) {
      set.status = 500;
      return { error: err.message };
    }
  }, {
    body: t.Object({
      elements: t.Optional(t.Array(t.Any())),
      appState: t.Optional(t.Any()),
      files: t.Optional(t.Any())
    })
  });
