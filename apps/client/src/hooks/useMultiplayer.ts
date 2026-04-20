import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";

export interface RemotePlayer {
  id: string;
  userId?: string;
  authoritativeSeq?: number;
  x: number;
  y: number;
  lastUpdate: number;
  isSitting?: boolean;
  displayName?: string;
  avatarUrl?: string;
  character2d?: string;
  status?: "active" | "away" | "in_call";
  cameraEnabled?: boolean;
}

export interface RoomChatMessage {
  id: string;
  roomId: string;
  channelId: string;
  parentId?: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  ts: number;
}

export interface RoomActivityEvent {
  id: string;
  roomId: string;
  type: "join" | "leave" | "chat" | "presence";
  actorId: string;
  actorName: string;
  detail: string;
  ts: number;
}

const parseRealtimeEnvelope = async (
  rawData: unknown,
): Promise<{ type: string; payload: any } | null> => {
  try {
    if (typeof rawData === "string") {
      return JSON.parse(rawData);
    }
    if (rawData instanceof Blob) {
      const text = await rawData.text();
      return JSON.parse(text);
    }
    if (typeof rawData === "object" && rawData !== null) {
      return rawData as { type: string; payload: any };
    }
    return null;
  } catch (error) {
    console.warn("Failed to parse realtime message", error);
    return null;
  }
};

export function useMultiplayer(roomId?: string, initialCameraEnabled = false) {
  const { user } = useAuth();
  const realtimeDebug = import.meta.env.VITE_REALTIME_DEBUG === "true";
  const [players, setPlayers] = useState<Record<string, RemotePlayer>>({});
  const [selfId, setSelfId] = useState<string | null>(null);
  const [authoritativeSelf, setAuthoritativeSelf] = useState<RemotePlayer | null>(null);
  const [chatMessages, setChatMessages] = useState<RoomChatMessage[]>([]);
  const [activityEvents, setActivityEvents] = useState<RoomActivityEvent[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const initialCameraEnabledRef = useRef(initialCameraEnabled);
  const pendingMediaStateRef = useRef<boolean | null>(null);
  const selfIdRef = useRef<string | null>(null);
  const inputSeqRef = useRef(0);
  const lastSentPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    initialCameraEnabledRef.current = initialCameraEnabled;
  }, [initialCameraEnabled]);

  useEffect(() => {
    if (!user || !roomId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // Use the backend URL from env or fallback to current host with port 3000
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const host = apiUrl.replace(/^https?:\/\//, "");
    
    let isClosing = false;
    const ws = new WebSocket(`${protocol}//${host}/ws?room=${roomId}`);
    wsRef.current = ws;

    ws.onmessage = async (event) => {
      if (isClosing) return;
      const envelope = await parseRealtimeEnvelope(event.data);
      if (!envelope) return;
      const { type, payload } = envelope;
      
      if (type === "welcome") {
        const nextSelfId = payload?.playerId || null;
        selfIdRef.current = nextSelfId;
        setSelfId(nextSelfId);
      } else if (type === "snapshot") {
        const rawPlayers = (payload?.players || {}) as Record<string, any>;
        const nextPlayers = Object.fromEntries(
          Object.entries(rawPlayers).map(([id, state]) => [
            id,
            {
              id,
              userId: state?.profile?.userId,
              authoritativeSeq: Number(state?.inputSeq ?? 0),
              x: Number(state?.x ?? 0),
              y: Number(state?.y ?? 0),
              isSitting: Boolean(state?.isSitting),
              lastUpdate: Number(state?.lastUpdate ?? Date.now()),
              displayName: state?.profile?.displayName,
              avatarUrl: state?.profile?.avatarUrl,
              character2d: state?.profile?.character2d,
              status: state?.profile?.status || "active",
              cameraEnabled: Boolean(state?.profile?.cameraEnabled),
            } as RemotePlayer,
          ]),
        ) as Record<string, RemotePlayer>;
        setPlayers(nextPlayers);
        const currentSelfId = selfIdRef.current;
        if (currentSelfId && nextPlayers[currentSelfId]) {
          setAuthoritativeSelf(nextPlayers[currentSelfId]);
          if (!lastSentPosRef.current) {
            lastSentPosRef.current = {
              x: nextPlayers[currentSelfId].x,
              y: nextPlayers[currentSelfId].y,
            };
          }
        }
      } else if (type === "player_left") {
        setPlayers((prev) => {
          const next = { ...prev };
          delete next[payload.id];
          return next;
        });
      } else if (type === "chat_message") {
        const chat = payload as RoomChatMessage;
        setChatMessages((prev) => [...prev.slice(-99), chat]);
      } else if (type === "activity_event" || type === "presence_updated") {
        const eventPayload = payload as RoomActivityEvent;
        setActivityEvents((prev) => [...prev.slice(-199), eventPayload]);
      }
    };

    ws.onopen = () => {
      if (realtimeDebug) {
        console.log("[realtime] ws open", { roomId, initialCameraEnabled: initialCameraEnabledRef.current });
      }
      ws.send(
        JSON.stringify({
          type: "join",
          payload: {
            userId: user.id,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            character2d: user.character2d,
            status: "active",
            cameraEnabled: initialCameraEnabledRef.current,
          },
        }),
      );
      const pendingMedia = pendingMediaStateRef.current;
      if (typeof pendingMedia === "boolean") {
        if (realtimeDebug) console.log("[realtime] flush pending media_state", pendingMedia);
        ws.send(
          JSON.stringify({
            type: "media_state",
            payload: { cameraEnabled: pendingMedia },
          }),
        );
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

  useEffect(() => {
    if (!wsRef.current) return;
    const timer = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "heartbeat",
            payload: { lastSeq: inputSeqRef.current },
          }),
        );
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [roomId, user]);

  const updatePosition = useCallback((x: number, y: number, isSitting?: boolean) => {
    const now = Date.now();
    const stateChanged = isSitting !== lastSittingState.current;

    // Bắt buộc gửi lên Server nếu hành động Ngồi/Đứng (isSitting) bị thay đổi (Bypass throttle).
    // Nếu chỉ là di chuyển thông thường thì Throttle về 20Hz (mỗi 50ms) để tiết kiệm băng thông.
    if (!stateChanged && now - lastSent.current < 50) return null;
    
    if (wsRef.current?.readyState === WebSocket.OPEN && user) {
      const prev = lastSentPosRef.current ?? { x, y };
      const rawDx = x - prev.x;
      const rawDy = y - prev.y;
      const maxStep = 8;
      const dx = Math.max(-1, Math.min(1, rawDx / maxStep));
      const dy = Math.max(-1, Math.min(1, rawDy / maxStep));
      inputSeqRef.current += 1;
      wsRef.current.send(JSON.stringify({
        type: "input",
        payload: {
          seq: inputSeqRef.current,
          dx,
          dy,
          isSitting,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          character2d: user.character2d,
        }
      }));
      lastSentPosRef.current = { x, y };
      lastSent.current = now;
      lastSittingState.current = isSitting;
      if (realtimeDebug && inputSeqRef.current % 20 === 0) {
        console.log("[realtime] input seq", inputSeqRef.current);
      }
      return inputSeqRef.current;
    }
    return null;
  }, [user]);

  const sendChatMessage = useCallback(
    (text: string, channelId = "general", parentId?: string) => {
      if (wsRef.current?.readyState !== WebSocket.OPEN) return false;
      const normalizedText = text.trim();
      if (!normalizedText) return false;
      const normalizedChannel = channelId.trim() || "general";
      const normalizedParentId =
        typeof parentId === "string" && parentId.trim().length > 0
          ? parentId.trim()
          : undefined;

      wsRef.current.send(
        JSON.stringify({
          type: "chat_message",
          payload: {
            text: normalizedText,
            channelId: normalizedChannel,
            parentId: normalizedParentId,
          },
        }),
      );
      return true;
    },
    [],
  );

  const updatePresence = useCallback((status: "active" | "away" | "in_call") => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(
      JSON.stringify({
        type: "presence_update",
        payload: { status },
      }),
    );
  }, []);

  const updateMediaState = useCallback((cameraEnabled: boolean) => {
    pendingMediaStateRef.current = cameraEnabled;
    if (realtimeDebug) console.log("[realtime] set media_state", cameraEnabled);
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(
      JSON.stringify({
        type: "media_state",
        payload: { cameraEnabled },
      }),
    );
  }, []);

  return {
    players,
    selfId,
    updatePosition,
    authoritativeSelf,
    chatMessages,
    activityEvents,
    sendChatMessage,
    updatePresence,
    updateMediaState,
  };
}
