import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";

export interface RemotePlayer {
  id: string; // Socket ID
  userId?: string; // Database User ID
  x: number;
  y: number;
  direction?: string;
  lastUpdate: number;
  isSitting?: boolean;
  character?: string;
  displayName?: string;
  avatarUrl?: string;
  emote?: { id: string; timestamp: number };
  chatBubble?: { text: string; timestamp: number };
  isPhoneOut?: boolean;
}

export function useMultiplayer(roomId?: string) {
  const { user } = useAuth();
  const [players, setPlayers] = useState<Record<string, RemotePlayer>>({});
  const [localPosition, setLocalPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const wsRef = useRef<WebSocket | null>(null);
  const lastUpdatePayloadRef = useRef<any>(null);

  useEffect(() => {
    if (!user) return;

    const effectiveRoomId = roomId || "lobby";
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // Use the backend URL from env or fallback to current host with port 3000
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const host = apiUrl.replace(/^https?:\/\//, "");
    
    let isClosing = false;
    let reconnectTimeoutId: ReturnType<typeof setTimeout>;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 10;

    const connect = () => {
      if (isClosing) return;
      const ws = new WebSocket(`${protocol}//${host}/ws?room=${effectiveRoomId}&userId=${user.id}`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log(`✅ WS Connected to room: ${roomId}`);
        
        // Resend last position if this is a reconnection
        if (reconnectAttempts > 0 && lastUpdatePayloadRef.current) {
          console.log(`🔄 Reconnected. Sending last known position...`);
          ws.send(JSON.stringify({
            type: "move",
            payload: lastUpdatePayloadRef.current
          }));
        }
        
        reconnectAttempts = 0; // Reset attempts on successful connection
      };

      ws.onerror = (error) => {
        console.error("❌ WS Connection Error:", error);
      };

      ws.onclose = (_event) => {
        if (isClosing) return;
        console.log(`🔌 WS Connection closed, attempting reconnect...`);
        if (reconnectAttempts < maxReconnectAttempts) {
          const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Exponential backoff up to 30s
          reconnectTimeoutId = setTimeout(() => {
            reconnectAttempts++;
            connect();
          }, timeout);
        } else {
          console.error("❌ Maximum WS reconnect attempts reached");
        }
      };

      ws.onmessage = (event) => {
        if (isClosing) return;
        const { type, payload } = JSON.parse(event.data);
        
        if (type === "player_moved") {
          // Skip if this is the local player
          if (payload.userId === user.id) return;

          setPlayers((prev) => ({
            ...prev,
            [payload.id]: {
              ...prev[payload.id],
              id: payload.id,
              userId: payload.userId,
              x: payload.x,
              y: payload.y,
              direction: payload.direction,
              isSitting: payload.isSitting,
              isPhoneOut: payload.isPhoneOut, // Sync phone state
              character: payload.character,
              lastUpdate: Date.now(),
              displayName: payload.displayName,
              avatarUrl: payload.avatarUrl,
            },
          }));
        } else if (type === "initial_state") {
          // Filter out local player from initial state
          setPlayers((prev) => {
            const next = { ...prev };
            Object.entries(payload.players as Record<string, RemotePlayer>).forEach(([id, p]) => {
              if (p.userId !== user.id) {
                next[id] = {
                  ...p,
                  isPhoneOut: p.isPhoneOut // Ensure initial state has phone info
                };
              }
            });
            return next;
          });
        } else if (type === "player_left") {
          setPlayers((prev) => {
            const next = { ...prev };
            delete next[payload.id];
            return next;
          });
        } else if (type === "forum_refresh") {
          window.dispatchEvent(new CustomEvent("forum-refresh"));
        } else if (type === "chat_message") {
          window.dispatchEvent(new CustomEvent("chat-message", { detail: payload }));
          // Show chat bubble on matching remote player
          const authorUserId = payload.authorId?._id || payload.authorId || payload.senderId;
          if (authorUserId && typeof payload.content === "string") {
            setPlayers((prev) => {
              const updated = { ...prev };
              for (const [wsId, p] of Object.entries(updated)) {
                if (p.userId === authorUserId) {
                  updated[wsId] = { ...p, chatBubble: { text: payload.content, timestamp: Date.now() } };
                  break;
                }
              }
              return updated;
            });
            setTimeout(() => {
              setPlayers((prev) => {
                const updated = { ...prev };
                for (const [wsId, p] of Object.entries(updated)) {
                  if (p.userId === authorUserId && p.chatBubble) {
                    updated[wsId] = { ...p, chatBubble: undefined };
                  }
                }
                return updated;
              });
            }, 4000);
          }
        } else if (type === "emote") {
          setPlayers((prev) => {
            if (!prev[payload.id]) return prev;
            return {
              ...prev,
              [payload.id]: {
                ...prev[payload.id],
                emote: { id: payload.emoteId, timestamp: Date.now() },
              },
            };
          });
        } else if (type === "whiteboard_update") {
          window.dispatchEvent(new CustomEvent("whiteboard-update", { detail: payload }));
        }
      };
    };

    connect();

    return () => {
      isClosing = true;
      clearTimeout(reconnectTimeoutId);
      if (wsRef.current) {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.close();
        } else if (wsRef.current.readyState === WebSocket.CONNECTING) {
          // If still connecting, wait for it to open before closing to avoid browser warning
          wsRef.current.onopen = () => wsRef.current?.close();
        }
      }
    };
  }, [user, roomId]);

  const lastSent = useRef<number>(0);
  const lastSittingState = useRef<boolean | undefined>(undefined);
  const lastPhoneState = useRef<boolean | undefined>(undefined);
  
  // Monitor Outgoing Message Rate
  const msgCounter = useRef(0);
  const lastLogTime = useRef(Date.now());

  const updatePosition = useCallback((x: number, y: number, direction: string, isSitting?: boolean, character?: string, customName?: string, isPhoneOut?: boolean) => {
    const now = Date.now();
    const stateChanged = isSitting !== lastSittingState.current || isPhoneOut !== lastPhoneState.current;
    if (!stateChanged && now - lastSent.current < 50) return;
    
    setLocalPosition({ x, y });

    if (wsRef.current?.readyState === WebSocket.OPEN && user) {
      const payload = {
        x,
        y,
        direction,
        isSitting,
        isPhoneOut,
        character,
        userId: user.id,
        displayName: customName || user.displayName,
        avatarUrl: user.avatarUrl
      };
      lastUpdatePayloadRef.current = payload;
      wsRef.current.send(JSON.stringify({
        type: "move",
        payload
      }));
      lastSent.current = now;
      lastSittingState.current = isSitting;
      lastPhoneState.current = isPhoneOut;

      // Log monitor stats
      msgCounter.current++;
      if (now - lastLogTime.current >= 1000) {
        if (import.meta.env.DEV) {
          console.log(`📡 WS Outgoing Rate: ${msgCounter.current} msg/s (Throttle: 20Hz target)`);
        }
        msgCounter.current = 0;
        lastLogTime.current = now;
      }
    }
  }, [user]);

  const sendChatMessage = useCallback((payload: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "chat_message",
        payload
      }));
    }
  }, []);

  const sendEmote = useCallback((emoteId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && user) {
      wsRef.current.send(JSON.stringify({
        type: "emote",
        payload: { id: user.id, emoteId, roomId }
      }));
    }
  }, [user, roomId]);

  const sendMessage = useCallback((type: string, payload: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  useEffect(() => {
    const handleSendChat = (e: CustomEvent) => {
      sendChatMessage(e.detail);
    };
    window.addEventListener("send-chat-message", handleSendChat as EventListener);
    return () => window.removeEventListener("send-chat-message", handleSendChat as EventListener);
  }, [sendChatMessage]);

  return { players, localPosition, updatePosition, sendChatMessage, sendEmote, sendMessage };
}
