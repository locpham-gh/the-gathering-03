export type TabType = "dashboard" | "users" | "rooms" | "forum" | "whitelist" | "library";

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
  ownerId?: { displayName: string; email: string };
  title?: string;
  authorId?: { displayName: string; email: string };
  createdAt: string;
}
