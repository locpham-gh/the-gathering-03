import { useState, useCallback, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { GameCanvas } from "../components/game/core/GameCanvas";
import type { Zone } from "../components/game/core/zones";
import { ZoneOverlay } from "../components/game/ui/ZoneOverlay";
import { LibraryModal } from "../components/game/library/LibraryModal";
import { RoomSidebar } from "../components/game/ui/RoomSidebar";
import { useMultiplayer } from "../hooks/useMultiplayer";
import { LiveKitModal } from "../components/game/ui/LiveKitModal";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { PreJoinScreen } from "../components/game/ui/PreJoinScreen";
import { ConferenceModal } from "../components/game/ui/ConferenceModal";
import { WhiteboardModal } from "../components/game/ui/WhiteboardModal";
import { InviteModal } from "../components/game/ui/InviteModal";

import { Loader2, AlertCircle } from "lucide-react";

export default function GamePage() {
  const { user, token: authToken } = useAuth();
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [activeZone, setActiveZone] = useState<Zone | null>(null);
  const [currentZone, setCurrentZone] = useState<Zone | null>(null);
  const [liveKitToken, setLiveKitToken] = useState<string | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [room, setRoom] = useState<any>(null);
  const [initialServerPosition, setInitialServerPosition] = useState<{ x: number; y: number } | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [customDisplayName, setCustomDisplayName] = useState<string | null>(null);
  const [localEmote, setLocalEmote] = useState<{ id: string; timestamp: number } | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const [roomError, setRoomError] = useState<string | null>(null);

  const { players, localPosition, updatePosition, sendEmote } = useMultiplayer(roomId);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    if (roomId) {
      setIsLoadingRoom(true);
      setRoomError(null);
      apiFetch(`/api/rooms/join/${roomId}`, { method: "POST" })
        .then((res) => {
          if (res.success) {
            setRoom(res.room);
            if (res.userPosition) {
              setInitialServerPosition(res.userPosition);
            }
          } else {
            setRoomError(res.error || "Failed to join room");
          }
        })
        .catch((err) => {
          console.error("Room join failure:", err);
          setRoomError("Network error while joining room");
        })
        .finally(() => {
          setIsLoadingRoom(false);
        });
    } else {
      setIsLoadingRoom(false);
      setRoomError("Invalid room ID");
    }
  }, [user, navigate, roomId]);

  const handleJoin = (data: { displayName: string; characterId: string }) => {
    setCustomDisplayName(data.displayName);
    setSelectedCharacter(data.characterId);
    setIsJoined(true);
  };

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

  useEffect(() => {
    if (!isJoined || !user || liveKitToken) return;

    const connectToSpace = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
        const roomName = `space-${roomId || "global"}`;
        const displayName = customDisplayName || user.displayName;
        // Use user.id as identity for reliable mapping, but displayName as name
        // Wait, the backend currently accepts 'username' for both. We'll pass user.id to be safe and use it to map.
        const res = await fetch(
          `${apiUrl}/api/livekit/token?room=${roomName}&username=${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );
        const data = await res.json();
        if (data.token) {
          setLiveKitToken(data.token);
        }
      } catch (err) {
        console.error("Failed to fetch LiveKit token", err);
      }
    };
    connectToSpace();
  }, [isJoined, user, liveKitToken, roomId, customDisplayName, authToken]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.key === "Escape") {
        handleZoneClose();
      } else if (e.key.toLowerCase() === "e" && currentZone && !activeZone) {
        handleInteract();
      } else if (["1", "2", "3", "4", "5", "6"].includes(e.key)) {
        const emoteMap: Record<string, string> = {
          "1": "❤️", "2": "👍", "3": "❓", "4": "💡", "5": "😂", "6": "👋"
        };
        const emoteId = emoteMap[e.key];
        setLocalEmote({ id: emoteId, timestamp: Date.now() });
        sendEmote(emoteId);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeZone, currentZone, handleZoneClose, handleInteract]);

  if (!user) return null;

  if (isLoadingRoom) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-slate-50 font-sans">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <h2 className="text-xl font-medium text-slate-700">Connecting to Space...</h2>
        <p className="text-slate-500 mt-2">Please wait while we set up your environment.</p>
      </div>
    );
  }

  if (roomError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-slate-50 font-sans p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-red-100">
          <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Room Unavailable</h2>
          <p className="text-slate-600 mb-6">{roomError}</p>
          <button 
            onClick={() => navigate("/home")}
            className="w-full py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors font-medium"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden font-sans relative">
      
      <RoomSidebar 
        roomId={roomId} 
        user={{ 
          ...user, 
          displayName: customDisplayName || user.displayName,
          avatarUrl: user.avatarUrl || "" 
        }} 
        players={players} 
        onOpenInvite={() => setShowInviteModal(true)}
      />

      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <div className="relative pointer-events-auto w-full h-full">
          <GameCanvas
            roomId={roomId}
            onZoneChange={handleZoneChange}
            onInteract={handleInteract}
            activeZone={activeZone}
            players={players}
            updatePosition={updatePosition}
            selectedCharacter={selectedCharacter || "Adam"}
            customDisplayName={customDisplayName || undefined}
            mapType={room?.map}
            localEmote={localEmote}
            initialServerPosition={initialServerPosition}
          />
        </div>

        <ZoneOverlay zone={currentZone} onPressE={handleInteract} />

        {activeZone && activeZone.id === "library" && (
          <LibraryModal onClose={handleZoneClose} />
        )}

        {activeZone && activeZone.id === ("conference" as any) && (
          <ConferenceModal onClose={handleZoneClose} />
        )}

        {activeZone && activeZone.id === "whiteboard" && (
          <WhiteboardModal onClose={handleZoneClose} roomId={roomId} />
        )}

        {liveKitToken && (
          <LiveKitModal
            token={liveKitToken}
            serverUrl={import.meta.env.VITE_LIVEKIT_URL}
            onDisconnect={() => setLiveKitToken(null)}
            players={players}
            localPosition={localPosition}
            currentZone={currentZone}
          />
        )}

        <InviteModal 
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          roomName={room?.name}
          roomCode={room?.code || roomId}
        />

      </div>

      {!isJoined && (
        <PreJoinScreen user={user} onJoin={handleJoin} />
      )}
    </div>
  );
}
