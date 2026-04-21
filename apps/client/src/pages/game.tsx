import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { LocateFixed } from "lucide-react";
import { GameCanvas } from "../components/game/GameCanvas";
import type { Zone } from "../components/game/zones";
import { ZoneOverlay } from "../components/game/ZoneOverlay";
import { LibraryModal } from "../components/game/LibraryModal";
import { RoomSidebar } from "../components/game/RoomSidebar";
import { ChatWorkspace } from "../components/game/ChatWorkspace";
import { CommunityWorkspace } from "../components/game/CommunityWorkspace";
import { CalendarWorkspace } from "../components/game/CalendarWorkspace";
import { AIWorkspace } from "../components/game/AIWorkspace";
import { FloatingMiniMap } from "../components/game/FloatingMiniMap";
import { MediaControlBar } from "../components/game/MediaControlBar";
import { useMultiplayer } from "../hooks/useMultiplayer";
import { LiveKitModal } from "../components/game/LiveKitModal";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { resolveAvatarUrl } from "../lib/profile";
import { loadPrejoinSettings, savePrejoinSettings } from "../lib/prejoin";
import type { MapVersion } from "../components/game/config";

export default function GamePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeZone, setActiveZone] = useState<Zone | null>(null);
  const [currentZone, setCurrentZone] = useState<Zone | null>(null);
  const [liveKitToken, setLiveKitToken] = useState<string | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [callMode, setCallMode] = useState<"auto" | "manual" | null>(null);
  const [activeCallPeerId, setActiveCallPeerId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<
    "world" | "chat" | "community" | "calendar" | "ai"
  >("world");
  const [roomMapVersion, setRoomMapVersion] = useState<MapVersion>("v3");
  const [cameraFocusTarget, setCameraFocusTarget] = useState<{
    x: number;
    y: number;
    id: number;
  } | null>(null);
  const [cameraZoomTarget, setCameraZoomTarget] = useState<{
    x: number;
    y: number;
    id: number;
  } | null>(null);
  const [resetCameraSignal, setResetCameraSignal] = useState(0);
  const [viewportState, setViewportState] = useState({ x: 0, y: 0, scale: 1 });
  const [localRenderPosition, setLocalRenderPosition] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [activeChatChannelId, setActiveChatChannelId] = useState("general");
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [unreadByChannel, setUnreadByChannel] = useState<Record<string, number>>({});
  const [mentionUnreadByChannel, setMentionUnreadByChannel] = useState<Record<string, number>>({});
  const [unreadMentionCount, setUnreadMentionCount] = useState(0);
  const seenChatCountRef = useRef(0);
  const initialDeepLinkAppliedRef = useRef(false);
  const deepLinkedChannelId = searchParams.get("channel");
  const deepLinkedThreadId = searchParams.get("thread");
  const prejoinMedia = useRef(loadPrejoinSettings());
  const [micEnabled, setMicEnabled] = useState(prejoinMedia.current.micEnabled);
  const [cameraEnabled, setCameraEnabled] = useState(prejoinMedia.current.cameraEnabled);
  const localCameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const localCameraStreamRef = useRef<MediaStream | null>(null);

  const isMentionedMessage = useCallback(
    (text: string) => {
      const normalizedText = text.toLowerCase();
      if (normalizedText.includes("@you")) return true;
      const displayName = (user?.displayName || "").trim().toLowerCase();
      if (!displayName) return false;
      return normalizedText.includes(`@${displayName}`);
    },
    [user?.displayName],
  );

  const setChatView = useCallback(
    (view: "world" | "chat" | "community" | "calendar" | "ai") => {
      setActiveView(view);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (view !== "chat") {
          next.delete("channel");
          next.delete("thread");
        } else {
          next.set("channel", activeChatChannelId);
        }
        return next;
      });
    },
    [activeChatChannelId, setSearchParams],
  );

  const {
    players,
    selfId,
    updatePosition,
    authoritativeSelf,
    chatMessages,
    sendChatMessage,
    updatePresence,
    updateMediaState,
  } = useMultiplayer(roomId, cameraEnabled);
  const selfPlayer =
    authoritativeSelf || (selfId ? players[selfId] || null : null);
  const activeCallPeerName =
    Object.values(players).find((player) => player.userId === activeCallPeerId)?.displayName ||
    activeCallPeerId;

  const persistMediaSetting = useCallback(
    (next: { micEnabled: boolean; cameraEnabled: boolean }) => {
      savePrejoinSettings({
        ...prejoinMedia.current,
        micEnabled: next.micEnabled,
        cameraEnabled: next.cameraEnabled,
      });
      prejoinMedia.current = {
        ...prejoinMedia.current,
        micEnabled: next.micEnabled,
        cameraEnabled: next.cameraEnabled,
      };
    },
    [],
  );

  useEffect(() => {
    if (chatMessages.length < seenChatCountRef.current) {
      seenChatCountRef.current = chatMessages.length;
      return;
    }

    const newMessages = chatMessages.slice(seenChatCountRef.current);
    if (newMessages.length === 0) return;

    setUnreadByChannel((prev) => {
      const next = { ...prev };
      for (const message of newMessages) {
        if (message.senderId === user?.id) continue;
        const shouldMarkRead =
          activeView === "chat" && message.channelId === activeChatChannelId;
        if (shouldMarkRead) continue;
        next[message.channelId] = (next[message.channelId] || 0) + 1;
      }
      return next;
    });
    setMentionUnreadByChannel((prev) => {
      const next = { ...prev };
      for (const message of newMessages) {
        if (message.senderId === user?.id) continue;
        const shouldMarkRead =
          activeView === "chat" && message.channelId === activeChatChannelId;
        if (shouldMarkRead) continue;
        if (!isMentionedMessage(message.text)) continue;
        next[message.channelId] = (next[message.channelId] || 0) + 1;
      }
      return next;
    });
    seenChatCountRef.current = chatMessages.length;
  }, [chatMessages, user?.id, activeView, activeChatChannelId, isMentionedMessage]);

  useEffect(() => {
    if (activeView !== "chat") return;
    setUnreadByChannel((prev) => {
      if (!prev[activeChatChannelId]) return prev;
      return { ...prev, [activeChatChannelId]: 0 };
    });
    setMentionUnreadByChannel((prev) => {
      if (!prev[activeChatChannelId]) return prev;
      return { ...prev, [activeChatChannelId]: 0 };
    });
  }, [activeView, activeChatChannelId]);

  useEffect(() => {
    const total = Object.values(unreadByChannel).reduce((acc, value) => acc + value, 0);
    setUnreadChatCount(total);
  }, [unreadByChannel]);

  useEffect(() => {
    const total = Object.values(mentionUnreadByChannel).reduce(
      (acc, value) => acc + value,
      0,
    );
    setUnreadMentionCount(total);
  }, [mentionUnreadByChannel]);

  useEffect(() => {
    if (!initialDeepLinkAppliedRef.current && deepLinkedChannelId) {
      initialDeepLinkAppliedRef.current = true;
      setActiveView("chat");
      if (deepLinkedChannelId !== activeChatChannelId) {
        setActiveChatChannelId(deepLinkedChannelId);
      }
      return;
    }
    if (!deepLinkedChannelId || activeView !== "chat") return;
    if (deepLinkedChannelId !== activeChatChannelId) {
      setActiveChatChannelId(deepLinkedChannelId);
    }
  }, [deepLinkedChannelId, activeChatChannelId, activeView]);

  useEffect(() => {
    updateMediaState(cameraEnabled);
  }, [cameraEnabled, updateMediaState]);

  useEffect(() => {
    let cancelled = false;
    const setupCameraPreview = async () => {
      if (!cameraEnabled) {
        if (localCameraStreamRef.current) {
          localCameraStreamRef.current.getTracks().forEach((track) => track.stop());
          localCameraStreamRef.current = null;
        }
        if (localCameraVideoRef.current) {
          localCameraVideoRef.current.srcObject = null;
        }
        return;
      }
      try {
        const preferredCameraId = prejoinMedia.current.preferredCameraId;
        const stream = await navigator.mediaDevices.getUserMedia({
          video: preferredCameraId
            ? { deviceId: { exact: preferredCameraId } }
            : true,
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        if (localCameraStreamRef.current) {
          localCameraStreamRef.current.getTracks().forEach((track) => track.stop());
        }
        localCameraStreamRef.current = stream;
        if (localCameraVideoRef.current) {
          localCameraVideoRef.current.srcObject = stream;
          localCameraVideoRef.current.play().catch(() => {});
        }
      } catch (error) {
        console.error("Local camera preview failed", error);
        setCameraEnabled(false);
      }
    };
    setupCameraPreview();
    return () => {
      cancelled = true;
    };
  }, [cameraEnabled]);

  useEffect(() => {
    return () => {
      if (localCameraStreamRef.current) {
        localCameraStreamRef.current.getTracks().forEach((track) => track.stop());
        localCameraStreamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    // Join the room in the persistence layer
    if (roomId) {
      apiFetch(`/api/rooms/join/${roomId}`, { method: "POST" })
        .then((res) => {
          const nextMapVersion = res?.room?.mapVersion;
          if (nextMapVersion === "v2" || nextMapVersion === "v3" || nextMapVersion === "v4") {
            setRoomMapVersion(nextMapVersion);
          }
        })
        .catch((err) => console.error("Room join non-critical failure:", err));
    }
  }, [user, navigate, roomId]);

  useEffect(() => {
    // Gather-style behavior: prevent browser/page zoom in room.
    // Map zoom is handled by GameCanvas camera only.
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key === "+" || key === "-" || key === "=" || key === "0") {
        event.preventDefault();
      }
    };
    const onGesture = (event: Event) => {
      event.preventDefault();
    };

    const wheelOptions: AddEventListenerOptions = { capture: true, passive: false };
    document.addEventListener("wheel", onWheel, wheelOptions);
    window.addEventListener("wheel", onWheel, wheelOptions);
    window.addEventListener("keydown", onKeyDown, { capture: true });
    window.addEventListener("gesturestart", onGesture, wheelOptions);
    window.addEventListener("gesturechange", onGesture, wheelOptions);

    return () => {
      document.removeEventListener("wheel", onWheel, wheelOptions);
      window.removeEventListener("wheel", onWheel, wheelOptions);
      window.removeEventListener("keydown", onKeyDown, { capture: true });
      window.removeEventListener("gesturestart", onGesture, wheelOptions);
      window.removeEventListener("gesturechange", onGesture, wheelOptions);
    };
  }, []);

  const handleZoneChange = useCallback((zone: Zone | null) => {
    setCurrentZone(zone);
  }, []);

  const handleZoneClose = useCallback(() => {
    setActiveZone(null);
  }, []);

  const handleInteract = useCallback(() => {
    if (currentZone) {
      setActiveZone(currentZone);
    }
  }, [currentZone]);

  const startCall = useCallback(
    async (playerId: string, mode: "auto" | "manual") => {
      if (!user || (liveKitToken && activeCallPeerId === playerId) || isCalling) return;

      try {
        setIsCalling(true);
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
        const roomName = [user.id, playerId].sort().join("--");

        const res = await fetch(
          `${apiUrl}/api/livekit/token?room=${roomName}&username=${user.id}`,
        );
        const data = await res.json();

        if (data.token) {
          setLiveKitToken(data.token);
          setCallMode(mode);
          setActiveCallPeerId(playerId);
          updatePresence("in_call");
        } else {
          setIsCalling(false);
          setCallMode(null);
          setActiveCallPeerId(null);
        }
      } catch (err) {
        console.error("Failed to fetch LiveKit token", err);
        setIsCalling(false);
        setCallMode(null);
        setActiveCallPeerId(null);
      }
    },
    [user, liveKitToken, activeCallPeerId, isCalling, updatePresence],
  );

  const handleProximityCall = useCallback(
    async (playerId: string | null) => {
      if (callMode === "manual") return;
      if (!playerId) {
        setLiveKitToken(null);
        setIsCalling(false);
        setCallMode(null);
        setActiveCallPeerId(null);
        updatePresence("active");
        return;
      }

      await startCall(playerId, "auto");
    },
    [callMode, updatePresence, startCall],
  );

  const handleManualCall = useCallback(
    async (memberId: string) => {
      if (!user) return;
      if (memberId === user.id) return;
      await startCall(memberId, "manual");
    },
    [startCall, user],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleZoneClose();
      } else if (e.key.toLowerCase() === "e" && currentZone && !activeZone) {
        handleInteract();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeZone, currentZone, handleZoneClose, handleInteract]);

  if (!user) return null;

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden font-sans relative">
      
      {/* 1. Gather.town Style Sidebar */}
      <RoomSidebar 
        roomId={roomId} 
        user={{ ...user, avatarUrl: resolveAvatarUrl(user.avatarUrl, user.gender) }}
        players={players}
        activeView={activeView}
        unreadChatCount={unreadChatCount}
        unreadMentionCount={unreadMentionCount}
        onOpenChatPage={() => setChatView("chat")}
        onReturnToWorld={() => setChatView("world")}
        onOpenCommunityPage={() => setChatView("community")}
        onOpenCalendarPage={() => setChatView("calendar")}
        onOpenAiPage={() => setChatView("ai")}
        onUpdatePresence={updatePresence}
        onCallVideo={handleManualCall}
        callingUserId={activeCallPeerId}
      />

      {/* 2. Main Game Viewport */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-auto">
          <GameCanvas
            onZoneChange={handleZoneChange}
            onInteract={handleInteract}
            activeZone={activeZone}
            onNearbyPlayer={handleProximityCall}
            players={players}
            selfPlayerId={selfId}
            cameraFocusTarget={cameraFocusTarget}
            cameraZoomTarget={cameraZoomTarget}
            resetCameraSignal={resetCameraSignal}
            paused={activeView !== "world"}
            localCameraEnabled={cameraEnabled}
            onViewportChange={setViewportState}
            onLocalPlayerRenderPosition={setLocalRenderPosition}
            updatePosition={updatePosition}
            localCharacter2d={user.character2d}
            authoritativeSelf={authoritativeSelf}
            mapVersion={roomMapVersion}
          />
        </div>

        {/* 3. In-Game Modals & Overlays */}
        {activeView === "world" && <ZoneOverlay zone={currentZone} onPressE={handleInteract} />}

        {activeView === "world" && activeZone && activeZone.id === "library" && (
          <LibraryModal onClose={handleZoneClose} />
        )}

        {liveKitToken && (
          <LiveKitModal
            token={liveKitToken}
            serverUrl={import.meta.env.VITE_LIVEKIT_URL}
            videoEnabled={cameraEnabled}
            audioEnabled={micEnabled}
            players={players}
            selfUserId={user.id}
            viewport={viewportState}
            onDisconnect={() => {
              setLiveKitToken(null);
              setIsCalling(false);
              setCallMode(null);
              setActiveCallPeerId(null);
              updatePresence("active");
            }}
          />
        )}

        {liveKitToken && activeCallPeerName && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none rounded-full border border-emerald-200 bg-emerald-50/95 px-3 py-1.5 text-xs font-semibold text-emerald-700 backdrop-blur">
            Connected to {activeCallPeerName}
          </div>
        )}

        {activeView === "world" && cameraEnabled && (localRenderPosition || selfPlayer) && (
          <div
            className="absolute z-30 pointer-events-none rounded-xl overflow-hidden border-2 border-white bg-black shadow-[0_10px_30px_-10px_rgba(0,0,0,0.45)]"
            style={{
              width: 96,
              height: 72,
              left:
                (localRenderPosition?.x ?? selfPlayer?.x ?? 0) * viewportState.scale +
                viewportState.x -
                48,
              top:
                (localRenderPosition?.y ?? selfPlayer?.y ?? 0) * viewportState.scale +
                viewportState.y -
                146,
            }}
          >
            <video
              ref={localCameraVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {!liveKitToken && (
          <MediaControlBar
            micEnabled={micEnabled}
            cameraEnabled={cameraEnabled}
            onToggleMic={() => {
              const next = !micEnabled;
              setMicEnabled(next);
              persistMediaSetting({ micEnabled: next, cameraEnabled });
            }}
            onToggleCamera={() => {
              const next = !cameraEnabled;
              setCameraEnabled(next);
              persistMediaSetting({ micEnabled, cameraEnabled: next });
              updateMediaState(next);
            }}
          />
        )}

        <button
          onClick={() => {
            setChatView("world");
            setResetCameraSignal((v) => v + 1);
          }}
          className="absolute top-4 right-4 z-50 pointer-events-auto bg-white/95 backdrop-blur border border-slate-200 shadow-sm rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 hover:bg-white"
          title="Reset camera to player center"
        >
          <LocateFixed size={14} />
          Reset camera
        </button>

        {activeView === "chat" ? (
          <div className="absolute inset-0 z-20">
          <ChatWorkspace
            messages={chatMessages}
            currentUserId={user.id}
            currentUserName={user.displayName}
            currentUserAvatar={resolveAvatarUrl(user.avatarUrl, user.gender)}
            activeChannelId={activeChatChannelId}
            unreadByChannel={unreadByChannel}
            mentionUnreadByChannel={mentionUnreadByChannel}
            initialThreadMessageId={deepLinkedThreadId}
            onActiveChannelChange={(channelId) => {
              setActiveChatChannelId(channelId);
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.set("channel", channelId);
                next.delete("thread");
                return next;
              });
            }}
            onThreadOpen={(threadRootId, channelId) => {
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.set("channel", channelId);
                next.set("thread", threadRootId);
                return next;
              });
            }}
            onBackToMap={() => setChatView("world")}
            onSendMessage={sendChatMessage}
          />
          </div>
        ) : activeView !== "world" ? (
          <div className="absolute inset-0 z-20">
          <>
            {activeView === "community" ? (
              <CommunityWorkspace
                user={{
                  id: user.id,
                  displayName: user.displayName,
                  avatarUrl: resolveAvatarUrl(user.avatarUrl, user.gender),
                  gender: user.gender,
                }}
              />
            ) : activeView === "calendar" ? (
              <CalendarWorkspace />
            ) : (
              <AIWorkspace />
            )}

            <FloatingMiniMap
              players={players}
              selfPlayerId={selfId}
              selfPlayer={selfPlayer}
              playerCount={Object.keys(players).length}
              onFocusArea={(point) => {
                setCameraFocusTarget({
                  x: point.x,
                  y: point.y,
                  id: Date.now(),
                });
                setChatView("world");
              }}
              onZoomToArea={(point) => {
                setCameraFocusTarget({
                  x: point.x,
                  y: point.y,
                  id: Date.now(),
                });
                setCameraZoomTarget({
                  x: point.x,
                  y: point.y,
                  id: Date.now() + 1,
                });
                setChatView("world");
              }}
            />
          </>
          </div>
        ) : null}
      </div>
    </div>
  );
}
