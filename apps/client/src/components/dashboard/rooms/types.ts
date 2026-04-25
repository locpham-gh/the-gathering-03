export interface RoomData {
  _id: string;
  name: string;
  code: string;
  map?: string;
  ownerId: { _id: string; displayName: string; avatarUrl: string };
  members: string[];
  createdAt: string;
}

export interface Member {
  _id: string;
  displayName: string;
  email?: string;
  avatarUrl: string;
}
