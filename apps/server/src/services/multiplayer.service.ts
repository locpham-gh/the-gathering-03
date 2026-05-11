import { Room } from "../models/Room.js";
import { Whiteboard } from "../models/Whiteboard.js";

export class MultiplayerService {
  // roomId -> (wsId -> data)
  private activePlayers = new Map<string, Map<string, any>>();

  constructor() {
    // Periodic snapshots (every 30s)
    setInterval(() => this.takeSnapshots(), 30000);
  }

  getRoomPlayers(roomId: string) {
    if (!this.activePlayers.has(roomId)) {
      this.activePlayers.set(roomId, new Map());
    }
    return this.activePlayers.get(roomId)!;
  }

  updatePlayer(roomId: string, wsId: string, data: any) {
    const room = this.getRoomPlayers(roomId);
    room.set(wsId, { ...room.get(wsId), ...data });
  }

  removePlayer(roomId: string, wsId: string) {
    const room = this.activePlayers.get(roomId);
    if (room) {
      room.delete(wsId);
      if (room.size === 0) this.activePlayers.delete(roomId);
    }
  }

  /** All socket ids removed for this user in the given room (room id = room code in URL). */
  evictUserFromRoom(roomId: string, userId: string): string[] {
    if (roomId === "lobby" || !userId) return [];
    const room = this.activePlayers.get(roomId);
    if (!room) return [];
    const removed: string[] = [];
    for (const [wsId, data] of [...room.entries()]) {
      if (data.userId === userId) {
        removed.push(wsId);
        room.delete(wsId);
      }
    }
    if (room.size === 0) this.activePlayers.delete(roomId);
    return removed;
  }

  async loadInitialPosition(roomId: string, userId: string) {
    if (roomId === "lobby" || !userId) return null;
    const dbRoom = await Room.findOne({ code: roomId });
    if (dbRoom?.savedPositions?.has(userId)) {
      return dbRoom.savedPositions.get(userId);
    }
    return null;
  }

  async savePosition(roomId: string, userId: string, x: number, y: number) {
    if (roomId === "lobby" || !userId || (x === 0 && y === 0)) return;
    const dbRoom = await Room.findOne({ code: roomId });
    if (dbRoom) {
      if (!dbRoom.savedPositions) dbRoom.savedPositions = new Map();
      dbRoom.savedPositions.set(userId, { x, y });
      await dbRoom.save();
    }
  }

  async getWhiteboard(roomId: string) {
    if (roomId === "lobby") return null;
    return await Whiteboard.findOne({ roomId });
  }

  async updateWhiteboard(roomId: string, payload: any) {
    if (roomId === "lobby") return;
    await Whiteboard.findOneAndUpdate(
      { roomId },
      {
        elements: payload.elements,
        appState: payload.appState,
        files: payload.files,
      },
      { upsert: true }
    );
  }

  private async takeSnapshots() {
    for (const [roomId, roomPlayers] of this.activePlayers.entries()) {
      if (roomId === "lobby" || roomPlayers.size === 0) continue;
      // In a real app, we'd persist all player positions here
    }
  }
}

export const multiplayerService = new MultiplayerService();
