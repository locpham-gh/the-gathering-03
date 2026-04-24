import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";

export interface RemotePlayer {
  id: string; // Socket ID
  userId?: string; // Database User ID
  x: number;
  y: number;
  lastUpdate: number;
  isSitting?: boolean;
  character?: string;
  displayName?: string;
  avatarUrl?: string;
}

export function useMultiplayer(roomId?: string) {
  const { user } = useAuth();
  const [players, setPlayers] = useState<Record<string, RemotePlayer>>({});
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!user) return;

    const effectiveRoomId = roomId || "lobby";
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // Use the backend URL from env or fallback to current host with port 3000
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const host = apiUrl.replace(/^https?:\/\//, "");
    
    let isClosing = false;
    const ws = new WebSocket(`${protocol}//${host}/ws?room=${effectiveRoomId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`✅ WS Connected to room: ${roomId}`);
    };

    ws.onerror = (error) => {
      console.error("❌ WS Connection Error:", error);
    };

    ws.onmessage = (event) => {
      if (isClosing) return;
      console.log("📩 WS Received:", event.data);
      const { type, payload } = JSON.parse(event.data);
      
      if (type === "player_moved") {
        setPlayers((prev) => ({
          ...prev,
          [payload.id]: {
            ...prev[payload.id],
            id: payload.id,
            userId: payload.userId,
            x: payload.x,
            y: payload.y,
            isSitting: payload.isSitting,
            character: payload.character,
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
      } else if (type === "forum_refresh") {
        console.log("WS: Received forum_refresh signal");
        window.dispatchEvent(new CustomEvent("forum-refresh"));
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

  const updatePosition = useCallback((x: number, y: number, isSitting?: boolean, character?: string) => {
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
          character,
          userId: user.id,
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
