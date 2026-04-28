export type TabType = "dashboard" | "users" | "rooms" | "forum" | "whitelist";

export interface AdminStats {
  totalUsers: number;
  totalRooms: number;
  totalTopics: number;
  bannedUsers: number;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminDataItem {
  _id: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  role?: string;
  status?: string;
  name?: string;
  code?: string;
  ownerId?: { displayName: string };
  title?: string;
  authorId?: { displayName: string };
  createdAt: string;
}
