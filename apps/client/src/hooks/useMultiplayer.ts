import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";

export interface RemotePlayer {
  id: string;
  x: number;
  y: number;
  lastUpdate: number;
  isSitting?: boolean;
  displayName?: string;
  avatarUrl?: string;
}

export function useMultiplayer(roomId?: string) {
  const { user } = useAuth();
  const [players, setPlayers] = useState<Record<string, RemotePlayer>>({});
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!user || !roomId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // Use the backend URL from env or fallback to current host with port 3000
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const host = apiUrl.replace(/^https?:\/\//, "");
    
    let isClosing = false;
    const ws = new WebSocket(`${protocol}//${host}/ws?room=${roomId}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      if (isClosing) return;
      const { type, payload } = JSON.parse(event.data);
      
      if (type === "player_moved") {
        setPlayers((prev) => ({
          ...prev,
          [payload.id]: {
            ...prev[payload.id],
            id: payload.id,
            x: payload.x,
            y: payload.y,
            isSitting: payload.isSitting,
            lastUpdate: Date.now(),
            displayName: payload.displayName,
            avatarUrl: payload.avatarUrl,
          },
        }));
      } else if (type === "initial_state") {
        setPlayers(payload.players);
      } else if (type === "player_left") {
        setPlayers((prev) => {
          const next = { ...prev };
          delete next[payload.id];
          return next;
        });
      }
    };

    return () => {
      isClosing = true;
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      } else if (ws.readyState === WebSocket.CONNECTING) {
        // If still connecting, wait for it to open before closing to avoid browser warning
        ws.onopen = () => ws.close();
      }
    };
  }, [user, roomId]);

  const lastSent = useRef<number>(0);
  const lastSittingState = useRef<boolean | undefined>(undefined);

  const updatePosition = useCallback((x: number, y: number, isSitting?: boolean) => {
    const now = Date.now();
    const stateChanged = isSitting !== lastSittingState.current;

    // Bắt buộc gửi lên Server nếu hành động Ngồi/Đứng (isSitting) bị thay đổi (Bypass throttle).
    // Nếu chỉ là di chuyển thông thường thì Throttle về 20Hz (mỗi 50ms) để tiết kiệm băng thông.
    if (!stateChanged && now - lastSent.current < 50) return;
    
    if (wsRef.current?.readyState === WebSocket.OPEN && user) {
      wsRef.current.send(JSON.stringify({
        type: "move",
        payload: {
          x,
          y,
          isSitting,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl
        }
      }));
      lastSent.current = now;
      lastSittingState.current = isSitting;
    }
  }, [user]);

  return { players, updatePosition };
}
