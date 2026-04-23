export interface EventItem {
  _id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  hostId: { _id: string; displayName: string; avatarUrl: string };
  roomId: { _id: string; code: string; name: string };
  guestEmails: string[];
}
