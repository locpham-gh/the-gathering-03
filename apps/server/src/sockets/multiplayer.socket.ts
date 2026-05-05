import { Elysia, t } from "elysia";
import { multiplayerService } from "../services/multiplayer.service.js";

export const multiplayerSocket = (app: Elysia) =>
  app.ws("/ws", {
    query: t.Object({
      room: t.Optional(t.String()),
      userId: t.Optional(t.String()),
    }),
    body: t.Object({
      type: t.String(),
      payload: t.Any(),
    }),
    async open(ws: any) {
      const roomId = ws.data.query.room || "lobby";
      const userId = ws.data.query.userId;

      if (roomId !== "lobby") ws.subscribe(`room-${roomId}`);
      ws.subscribe("global-forum");
      if (userId) ws.subscribe(`user-${userId}`);

      if (roomId !== "lobby") {
        const room = multiplayerService.getRoomPlayers(roomId);

        // Kick duplicates
        if (userId) {
          try {
            for (const [oldWsId, data] of room.entries()) {
              if (data.userId === userId && oldWsId !== ws.id) {
                room.delete(oldWsId);
                ws.publish(`room-${roomId}`, {
                  type: "player_left",
                  payload: { id: oldWsId },
                });
              }
            }
          } catch (e) {
            console.error("Error kicking duplicate", e);
          }
        }

        const initialData = {
          id: ws.id,
          userId,
          x: 0,
          y: 0,
          isSitting: false,
          character: "Adam",
        };
        room.set(ws.id, initialData);

        // Load position from DB
        try {
          const pos = await multiplayerService.loadInitialPosition(roomId, userId);
          if (pos) {
            const updated = { ...initialData, x: pos.x, y: pos.y };
            room.set(ws.id, updated);
            ws.publish(`room-${roomId}`, { type: "player_moved", payload: updated });
          }

          // Initial state
          ws.send({
            type: "initial_state",
            payload: { players: Object.fromEntries(room) },
          });

          // Whiteboard
          const wb = await multiplayerService.getWhiteboard(roomId);
          if (wb) ws.send({ type: "whiteboard_update", payload: wb });
        } catch (err) {
          console.error("WS Open Async Error:", err);
        }
      } else {
        ws.send({ type: "initial_state", payload: { players: {} } });
      }
    },
    message(ws: any, { type, payload }: any) {
      const roomId = ws.data.query.room || "lobby";
      if (type === "move") {
        multiplayerService.updatePlayer(roomId, ws.id, payload);
        ws.publish(`room-${roomId}`, {
          type: "player_moved",
          payload: { id: ws.id, ...payload },
        });
      } else if (type === "chat_message") {
        ws.publish(`room-${roomId}`, { type: "chat_message", payload });
      } else if (type === "emote") {
        ws.publish(`room-${roomId}`, {
          type: "emote",
          payload: { id: ws.id, ...payload },
        });
      } else if (type === "whiteboard_update") {
        ws.publish(`room-${roomId}`, { type: "whiteboard_update", payload });
        multiplayerService.updateWhiteboard(payload.roomId || roomId, payload);
      } else if (type === "whiteboard_open") {
        ws.publish(`room-${roomId}`, { type: "whiteboard_open", payload });
      } else if (type === "whiteboard_close") {
        ws.publish(`room-${roomId}`, { type: "whiteboard_close", payload });
      }
    },
    async close(ws: any) {
      const roomId = ws.data.query.room || "lobby";
      const userId = ws.data.query.userId;
      const room = multiplayerService.getRoomPlayers(roomId);
      const playerData = room.get(ws.id);

      if (playerData && userId) {
        try {
          await multiplayerService.savePosition(
            roomId,
            userId,
            playerData.x,
            playerData.y,
          );
        } catch (e) {
          console.error("Failed to save position on close", e);
        }
      }

      multiplayerService.removePlayer(roomId, ws.id);
      
      // In Bun, publishing on a closing socket can cause segfaults.
      // We wrap it in a try-catch to be safe.
      try {
        ws.publish(`room-${roomId}`, {
          type: "player_left",
          payload: { id: ws.id },
        });
      } catch (err) {
        console.error("Failed to publish player_left", err);
      }
    },
  });
