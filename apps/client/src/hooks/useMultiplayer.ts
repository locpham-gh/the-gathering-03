import { useEffect, useRef, useState, useCallback } from "react";
import { pack, unpack } from "msgpackr";
import { useAuth } from "../contexts/AuthContext";
import type {
  RoomActivityEvent,
  RoomChatMessage,
  PresenceStatus,
} from "@the-gathering/shared";
export type { RoomActivityEvent, RoomChatMessage } from "@the-gathering/shared";

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
  status?: PresenceStatus;
  cameraEnabled?: boolean;
}

const parseRealtimeEnvelope = async (
  rawData: unknown,
): Promise<{ type: string; payload: unknown } | null> => {
  try {
    if (rawData instanceof ArrayBuffer) {
      return unpack(new Uint8Array(rawData)) as { type: string; payload: unknown };
    }
    if (rawData instanceof Uint8Array) {
      return unpack(rawData) as { type: string; payload: unknown };
    }
    if (rawData instanceof Blob) {
      const binary = new Uint8Array(await rawData.arrayBuffer());
      return unpack(binary) as { type: string; payload: unknown };
    }
    return null;
  } catch (error) {
    console.warn("Failed to parse realtime message", error);
    return null;
  }
};

const encodeRealtimeEnvelope = (type: string, payload: unknown) =>
  pack({ type, payload });

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
  const snapshotDebugCounterRef = useRef(0);
  const playersBufferRef = useRef<Record<string, RemotePlayer>>({});
  const playersFlushRafRef = useRef<number | null>(null);

  const flushPlayersToReact = useCallback(() => {
    if (playersFlushRafRef.current !== null) return;
    playersFlushRafRef.current = requestAnimationFrame(() => {
      playersFlushRafRef.current = null;
      setPlayers(playersBufferRef.current);
      const currentSelfId = selfIdRef.current;
      if (currentSelfId && playersBufferRef.current[currentSelfId]) {
        setAuthoritativeSelf(playersBufferRef.current[currentSelfId]);
      }
    });
  }, []);

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
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onmessage = async (event) => {
      if (isClosing) return;
      const envelope = await parseRealtimeEnvelope(event.data);
      if (!envelope) return;
      const { type } = envelope;
      const payload = (envelope.payload ?? {}) as Record<string, unknown>;
      
      if (type === "welcome") {
        const nextSelfId =
          typeof payload.playerId === "string" ? payload.playerId : null;
        selfIdRef.current = nextSelfId;
        setSelfId(nextSelfId);
      } else if (type === "snapshot") {
        const rawPlayers = (payload.players ?? {}) as Record<string, unknown>;
        const mappedPlayers = Object.fromEntries(
          Object.entries(rawPlayers).map(([id, state]) => [
            id,
            (() => {
              const stateRecord = (state ?? {}) as Record<string, unknown>;
              const profile =
                (stateRecord.profile ?? {}) as Record<string, unknown>;
              const statusValue = profile.status;
              const safeStatus =
                statusValue === "away" || statusValue === "in_call"
                  ? statusValue
                  : "active";
              return {
              id,
              userId:
                typeof profile.userId === "string" ? profile.userId : undefined,
              authoritativeSeq: Number(stateRecord.inputSeq ?? 0),
              x: Number(stateRecord.x ?? 0),
              y: Number(stateRecord.y ?? 0),
              isSitting: Boolean(stateRecord.isSitting),
              lastUpdate: Number(stateRecord.lastUpdate ?? Date.now()),
              displayName:
                typeof profile.displayName === "string"
                  ? profile.displayName
                  : undefined,
              avatarUrl:
                typeof profile.avatarUrl === "string"
                  ? profile.avatarUrl
                  : undefined,
              character2d:
                typeof profile.character2d === "string"
                  ? profile.character2d
                  : undefined,
              status: safeStatus,
              cameraEnabled: Boolean(profile.cameraEnabled),
              };
            })() as RemotePlayer,
          ]),
        ) as Record<string, RemotePlayer>;
        const isDelta = Boolean((payload as Record<string, unknown>).isDelta);
        const removedPlayerIds = Array.isArray((payload as Record<string, unknown>).removedPlayerIds)
          ? ((payload as Record<string, unknown>).removedPlayerIds as unknown[]).filter(
              (id): id is string => typeof id === "string",
            )
          : [];
        const currentBuffered = playersBufferRef.current;
        const nextPlayers = isDelta ? { ...currentBuffered, ...mappedPlayers } : mappedPlayers;
        for (const removedId of removedPlayerIds) {
          delete nextPlayers[removedId];
        }
        playersBufferRef.current = nextPlayers;
        flushPlayersToReact();
        const currentSelfId = selfIdRef.current;
        const snapshotForSelf = mappedPlayers[currentSelfId ?? ""];
        if (currentSelfId && snapshotForSelf) {
          if (realtimeDebug) {
            snapshotDebugCounterRef.current += 1;
            if (snapshotDebugCounterRef.current % 15 === 0) {
              const me = snapshotForSelf;
              console.log("[realtime] snapshot self", {
                roomId,
                seq: payload.seq,
                authoritativeSeq: me.authoritativeSeq,
                x: Math.round(me.x),
                y: Math.round(me.y),
                players: Object.keys(mappedPlayers).length,
                isDelta,
              });
            }
          }
          if (!lastSentPosRef.current) {
            lastSentPosRef.current = {
              x: snapshotForSelf.x,
              y: snapshotForSelf.y,
            };
          }
        }
      } else if (type === "player_left") {
        setPlayers((prev) => {
          const next = { ...prev };
          if (typeof payload.id === "string") {
            delete next[payload.id];
          }
          playersBufferRef.current = next;
          return next;
        });
      } else if (type === "chat_message") {
        const chat = payload as unknown as RoomChatMessage;
        setChatMessages((prev) => [...prev.slice(-99), chat]);
      } else if (type === "activity_event" || type === "presence_updated") {
        const eventPayload = payload as unknown as RoomActivityEvent;
        setActivityEvents((prev) => [...prev.slice(-199), eventPayload]);
      }
    };

    ws.onopen = () => {
      if (realtimeDebug) {
        console.log("[realtime] ws open", { roomId, initialCameraEnabled: initialCameraEnabledRef.current });
      }
      ws.send(
        encodeRealtimeEnvelope("join", {
          userId: user.id,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          character2d: user.character2d,
          status: "active",
          cameraEnabled: initialCameraEnabledRef.current,
        }),
      );
      const pendingMedia = pendingMediaStateRef.current;
      if (typeof pendingMedia === "boolean") {
        if (realtimeDebug) console.log("[realtime] flush pending media_state", pendingMedia);
        ws.send(
          encodeRealtimeEnvelope("media_state", { cameraEnabled: pendingMedia }),
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
      if (playersFlushRafRef.current !== null) {
        cancelAnimationFrame(playersFlushRafRef.current);
        playersFlushRafRef.current = null;
      }
    };
  }, [user, roomId, realtimeDebug, flushPlayersToReact]);

  const lastSent = useRef<number>(0);
  const lastSittingState = useRef<boolean | undefined>(undefined);

  useEffect(() => {
    if (!wsRef.current) return;
    const timer = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          encodeRealtimeEnvelope("heartbeat", { lastSeq: inputSeqRef.current }),
        );
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [roomId, user]);

  const lastIntentRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  const updatePosition = useCallback((
    x: number,
    y: number,
    isSitting?: boolean,
    intent?: { dx: number; dy: number },
  ) => {
    const now = Date.now();
    const stateChanged = isSitting !== lastSittingState.current;
    const nextIntent = intent || { dx: 0, dy: 0 };
    const prevIntent = lastIntentRef.current;
    const intentChanged = nextIntent.dx !== prevIntent.dx || nextIntent.dy !== prevIntent.dy;

    // Bắt buộc gửi lên Server nếu hành động Ngồi/Đứng (isSitting) bị thay đổi (Bypass throttle).
    // Nếu chỉ là di chuyển thông thường thì Throttle về 20Hz (mỗi 50ms) để tiết kiệm băng thông.
    if (!stateChanged && !intentChanged && now - lastSent.current < 50) return null;
    
    if (wsRef.current?.readyState === WebSocket.OPEN && user) {
      const prev = lastSentPosRef.current ?? { x, y };
      const rawDx = x - prev.x;
      const rawDy = y - prev.y;
      // Drop tiny noise only when there is no active movement intent.
      if (
        !stateChanged &&
        !intentChanged &&
        nextIntent.dx === 0 &&
        nextIntent.dy === 0 &&
        Math.abs(rawDx) < 0.2 &&
        Math.abs(rawDy) < 0.2
      ) {
        return null;
      }
      const maxStep = 8;
      const dx =
        typeof nextIntent.dx === "number"
          ? Math.max(-1, Math.min(1, nextIntent.dx))
          : Math.max(-1, Math.min(1, rawDx / maxStep));
      const dy =
        typeof nextIntent.dy === "number"
          ? Math.max(-1, Math.min(1, nextIntent.dy))
          : Math.max(-1, Math.min(1, rawDy / maxStep));
      inputSeqRef.current += 1;
      wsRef.current.send(
        encodeRealtimeEnvelope("input", {
          seq: inputSeqRef.current,
          dx,
          dy,
          isSitting,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          character2d: user.character2d,
        }),
      );
      lastSentPosRef.current = { x, y };
      lastSent.current = now;
      lastSittingState.current = isSitting;
      lastIntentRef.current = { dx, dy };
      if (realtimeDebug && (intentChanged || inputSeqRef.current % 20 === 0)) {
        console.log("[realtime] input", {
          seq: inputSeqRef.current,
          dx: Number(dx.toFixed(3)),
          dy: Number(dy.toFixed(3)),
          intentChanged,
          x: Math.round(x),
          y: Math.round(y),
          roomId,
        });
      }
      return inputSeqRef.current;
    }
    return null;
  }, [user, roomId, realtimeDebug]);

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
        encodeRealtimeEnvelope("chat_message", {
          text: normalizedText,
          channelId: normalizedChannel,
          parentId: normalizedParentId,
        }),
      );
      return true;
    },
    [],
  );

  const updatePresence = useCallback((status: "active" | "away" | "in_call") => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(
      encodeRealtimeEnvelope("presence_update", { status }),
    );
  }, [realtimeDebug]);

  const updateMediaState = useCallback((cameraEnabled: boolean) => {
    pendingMediaStateRef.current = cameraEnabled;
    if (realtimeDebug) console.log("[realtime] set media_state", cameraEnabled);
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(
      encodeRealtimeEnvelope("media_state", { cameraEnabled }),
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
