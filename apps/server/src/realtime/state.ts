import type { InputPayload, PlayerProfile, PlayerState } from "./protocol.js";

const PLAYER_SPEED_PER_TICK = 8;
const WORLD_MIN = 0;
const WORLD_MAX = 5000;

export interface RoomState {
  roomId: string;
  seq: number;
  players: Map<string, PlayerState>;
  pendingInputs: Map<string, InputPayload[]>;
}

export interface RealtimeStateAdapter {
  getOrCreateRoom(roomId: string): RoomState;
  getRoom(roomId: string): RoomState | undefined;
  removePlayer(roomId: string, playerId: string): void;
  getRooms(): IterableIterator<RoomState>;
  roomCount(): number;
  playerCount(): number;
}

export class InMemoryRealtimeStateAdapter implements RealtimeStateAdapter {
  private readonly rooms = new Map<string, RoomState>();

  getOrCreateRoom(roomId: string): RoomState {
    let room = this.rooms.get(roomId);
    if (!room) {
      room = {
        roomId,
        seq: 0,
        players: new Map<string, PlayerState>(),
        pendingInputs: new Map<string, InputPayload[]>(),
      };
      this.rooms.set(roomId, room);
    }
    return room;
  }

  getRoom(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  removePlayer(roomId: string, playerId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.players.delete(playerId);
    room.pendingInputs.delete(playerId);
    if (room.players.size === 0) this.rooms.delete(roomId);
  }

  getRooms(): IterableIterator<RoomState> {
    return this.rooms.values();
  }

  roomCount(): number {
    return this.rooms.size;
  }

  playerCount(): number {
    let count = 0;
    for (const room of this.rooms.values()) count += room.players.size;
    return count;
  }
}

export const createInitialPlayerState = (
  playerId: string,
  profile: PlayerProfile,
): PlayerState => ({
  id: playerId,
  x: 2400 + Math.random() * 200 - 100,
  y: 2400 + Math.random() * 200 - 100,
  isSitting: false,
  lastUpdate: Date.now(),
  profile,
  inputSeq: 0,
  lastAckSeq: 0,
  heartbeatAt: Date.now(),
  lastInteractionAt: Date.now(),
});

export const applyInputAuthoritatively = (
  state: PlayerState,
  input: InputPayload,
): boolean => {
  if (!Number.isFinite(input.dx) || !Number.isFinite(input.dy)) return false;
  if (input.seq <= state.inputSeq) return false;

  const clampedDx = Math.max(-1, Math.min(1, input.dx));
  const clampedDy = Math.max(-1, Math.min(1, input.dy));

  state.x = Math.max(
    WORLD_MIN,
    Math.min(WORLD_MAX, state.x + clampedDx * PLAYER_SPEED_PER_TICK),
  );
  state.y = Math.max(
    WORLD_MIN,
    Math.min(WORLD_MAX, state.y + clampedDy * PLAYER_SPEED_PER_TICK),
  );
  state.isSitting = Boolean(input.isSitting);
  state.inputSeq = input.seq;
  state.lastUpdate = Date.now();
  state.lastInteractionAt = Date.now();
  return true;
};
