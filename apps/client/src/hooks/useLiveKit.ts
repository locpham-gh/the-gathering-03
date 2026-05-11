import { useState, useEffect } from "react";

export function useLiveKit(
  isJoined: boolean,
  user: { id: string } | null,
  roomId: string | undefined,
  authToken: string | null
) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (!isJoined || !user || !roomId || !authToken || token) return;

    const fetchToken = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
        const roomName = `space-${roomId}`;
        const res = await fetch(
          `${apiUrl}/api/livekit/token?room=${roomName}&username=${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          },
        );
        if (res.status === 401) {
          window.dispatchEvent(
            new CustomEvent("session-replaced", {
              detail: {
                message: "Bạn bị đăng xuất vì đăng nhập ở thiết bị khác.",
              },
            }),
          );
          return;
        }
        const data = await res.json();
        if (data.token) {
          setToken(data.token);
        }
      } catch (err) {
        console.error("Failed to fetch LiveKit token", err);
      }
    };

    fetchToken();
  }, [isJoined, user, roomId, authToken, token]);

  return { token, setToken };
}
