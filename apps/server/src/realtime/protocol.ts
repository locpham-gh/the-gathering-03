export const REALTIME_PROTOCOL_VERSION = "v2";
export type PresenceStatus = "active" | "away" | "in_call";

export interface PlayerProfile {
  userId?: string;
  displayName?: string;
  avatarUrl?: string;
  character2d?: string;
  status?: PresenceStatus;
  cameraEnabled?: boolean;
}

export interface PlayerState {
  id: string;
  x: number;
  y: number;
  isSitting?: boolean;
  lastUpdate: number;
  profile: PlayerProfile;
  inputSeq: number;
  lastAckSeq: number;
  heartbeatAt: number;
  lastInteractionAt: number;
}

export interface InputPayload {
  seq: number;
  dx: number;
  dy: number;
  isSitting?: boolean;
}

export interface RoomSnapshotPayload {
  roomId: string;
  seq: number;
  ts: number;
  players: Record<string, PlayerState>;
}

export interface RoomChatMessage {
  id: string;
  roomId: string;
  channelId: string;
  parentId?: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  ts: number;
}

export interface RoomActivityEvent {
  id: string;
  roomId: string;
  type: "join" | "leave" | "chat" | "presence";
  actorId: string;
  actorName: string;
  detail: string;
  ts: number;
}
