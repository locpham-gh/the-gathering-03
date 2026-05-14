import { multiplayerService } from "./services/multiplayer.service.js";

type Publisher = { publish: (topic: string, data: string) => void } | null;

let publisher: Publisher = null;

export function setRealtimePublisher(pub: NonNullable<Publisher>) {
  publisher = pub;
}

export function broadcastForumUpdate() {
  if (!publisher) return;
  publisher.publish(
    "global-forum",
    JSON.stringify({
      type: "forum_refresh",
      payload: { timestamp: Date.now() },
    }),
  );
}

export function broadcastNotification(userId: string) {
  if (!publisher) return;
  publisher.publish(
    `user-${userId}`,
    JSON.stringify({
      type: "new_notification",
      payload: { timestamp: Date.now() },
    }),
  );
}

export function broadcastMemberKickedFromRoom(
  roomCode: string,
  kickedUserId: string,
  message = "Bạn đã bị mời ra khỏi phòng bởi chủ phòng.",
) {
  if (!publisher) return;
  const uid = kickedUserId.toString();
  const wsIds = multiplayerService.evictUserFromRoom(roomCode, uid);
  for (const wsId of wsIds) {
    publisher.publish(
      `room-${roomCode}`,
      JSON.stringify({ type: "player_left", payload: { id: wsId } }),
    );
  }
  publisher.publish(
    `user-${uid}`,
    JSON.stringify({
      type: "kicked_from_room",
      payload: { message, roomCode },
    }),
  );
}
