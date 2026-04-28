import { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";

export function useGameRoom(roomId: string | undefined) {
  const [room, setRoom] = useState<{
    map?: string;
    name?: string;
    code?: string;
  } | null>(null);
  const [initialServerPosition, setInitialServerPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) {
      setError("Invalid room ID");
      setIsLoading(false);
      return;
    }

    const joinRoom = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiFetch(`/api/rooms/join/${roomId}`, { method: "POST" });
        if (res.success) {
          setRoom(res.room);
          if (res.userPosition) {
            setInitialServerPosition(res.userPosition);
          }
        } else {
          setError(res.error || "Failed to join room");
        }
      } catch (err) {
        console.error("Room join failure:", err);
        setError("Network error while joining room");
      } finally {
        setIsLoading(false);
      }
    };

    joinRoom();
  }, [roomId]);

  return { room, initialServerPosition, isLoading, error };
}
