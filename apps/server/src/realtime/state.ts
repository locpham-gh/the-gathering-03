import type { InputPayload, PlayerProfile, PlayerState } from "./protocol.js";
import { REALTIME_CONFIG } from "@the-gathering/shared";

const PLAYER_SPEED_PER_TICK = REALTIME_CONFIG.PLAYER_SPEED_PER_TICK;
const WORLD_MIN = 0;
const WORLD_MAX = 5000;
const SPATIAL_CELL_SIZE = REALTIME_CONFIG.SPATIAL_CELL_SIZE;
const SNAPSHOT_ENTER_RADIUS = REALTIME_CONFIG.SNAPSHOT_ENTER_RADIUS;
const SNAPSHOT_EXIT_RADIUS = REALTIME_CONFIG.SNAPSHOT_EXIT_RADIUS;

export interface RoomState {
  roomId: string;
  seq: number;
  players: Map<string, PlayerState>;
  pendingInputs: Map<string, InputPayload[]>;
  sockets: Map<string, { send: (data: string | Uint8Array) => unknown }>;
  snapshotCacheByRecipient: Map<string, Map<string, string>>;
  visibilityByRecipient: Map<string, Set<string>>;
  lastKeyframeSeqByRecipient: Map<string, number>;
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
        sockets: new Map<string, { send: (data: string | Uint8Array) => unknown }>(),
        snapshotCacheByRecipient: new Map<string, Map<string, string>>(),
        visibilityByRecipient: new Map<string, Set<string>>(),
        lastKeyframeSeqByRecipient: new Map<string, number>(),
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
    room.sockets.delete(playerId);
    room.snapshotCacheByRecipient.delete(playerId);
    room.visibilityByRecipient.delete(playerId);
    room.lastKeyframeSeqByRecipient.delete(playerId);
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
  // Keep a conservative spawn that fits all current map presets.
  x: 768,
  y: 576,
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

const spatialCellKey = (x: number, y: number) =>
  `${Math.floor(x / SPATIAL_CELL_SIZE)}:${Math.floor(y / SPATIAL_CELL_SIZE)}`;

const buildSpatialIndex = (players: Map<string, PlayerState>) => {
  const grid = new Map<string, string[]>();
  for (const [playerId, player] of players.entries()) {
    const key = spatialCellKey(player.x, player.y);
    const list = grid.get(key) || [];
    list.push(playerId);
    grid.set(key, list);
  }
  return grid;
};

export const getNearbyPlayers = (
  room: RoomState,
  centerPlayerId: string,
): Record<string, PlayerState> => {
  const center = room.players.get(centerPlayerId);
  if (!center) return {};
  const nearby: Record<string, PlayerState> = {};
  const spatial = buildSpatialIndex(room.players);
  const centerCol = Math.floor(center.x / SPATIAL_CELL_SIZE);
  const centerRow = Math.floor(center.y / SPATIAL_CELL_SIZE);
  const prevVisible = room.visibilityByRecipient.get(centerPlayerId) || new Set<string>();
  const nextVisible = new Set<string>();
  const enterRadiusSq = SNAPSHOT_ENTER_RADIUS * SNAPSHOT_ENTER_RADIUS;
  const exitRadiusSq = SNAPSHOT_EXIT_RADIUS * SNAPSHOT_EXIT_RADIUS;

  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      const key = `${centerCol + dx}:${centerRow + dy}`;
      const members = spatial.get(key);
      if (!members) continue;
      for (const otherId of members) {
        const other = room.players.get(otherId);
        if (!other) continue;
        const distX = other.x - center.x;
        const distY = other.y - center.y;
        const distSq = distX * distX + distY * distY;
        const wasVisible = prevVisible.has(otherId);
        const within =
          otherId === centerPlayerId || distSq <= (wasVisible ? exitRadiusSq : enterRadiusSq);
        if (within) {
          nearby[otherId] = other;
          nextVisible.add(otherId);
        }
      }
    }
  }
  room.visibilityByRecipient.set(centerPlayerId, nextVisible);
  return nearby;
};
