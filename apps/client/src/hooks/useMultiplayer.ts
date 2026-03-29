import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";

export interface RemotePlayer {
  id: string;
  x: number;
  y: number;
  lastUpdate: number;
  displayName?: string;
  avatarUrl?: string;
}

export function useMultiplayer() {
  const { user } = useAuth();
  const [players, setPlayers] = useState<Record<string, RemotePlayer>>({});
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = "localhost:3000"; // Assuming dev server host
    const ws = new WebSocket(`${protocol}//${host}/ws`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const { type, payload } = JSON.parse(event.data);
      
      if (type === "player_moved") {
        setPlayers((prev) => ({
          ...prev,
          [payload.id]: {
            ...prev[payload.id],
            id: payload.id,
            x: payload.x,
            y: payload.y,
            lastUpdate: Date.now(),
            displayName: payload.displayName,
            avatarUrl: payload.avatarUrl,
          },
        }));
      } else if (type === "player_left") {
        setPlayers((prev) => {
          const next = { ...prev };
          delete next[payload.id];
          return next;
        });
      }
    };

    return () => {
      ws.close();
    };
  }, [user]);

  const lastSent = useRef<number>(0);
  const updatePosition = useCallback((x: number, y: number) => {
    const now = Date.now();
    // Throttle to 20Hz (every 50ms) to save bandwidth
    if (now - lastSent.current < 50) return;
    
    if (wsRef.current?.readyState === WebSocket.OPEN && user) {
      wsRef.current.send(JSON.stringify({
        type: "move",
        payload: {
          x,
          y,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl
        }
      }));
      lastSent.current = now;
    }
  }, [user]);

  return { players, updatePosition };
}
