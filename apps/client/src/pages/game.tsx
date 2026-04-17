import { useState, useCallback, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { GameCanvas } from "../components/game/GameCanvas";
import type { Zone } from "../components/game/zones";
import { ZoneOverlay } from "../components/game/ZoneOverlay";
import { LibraryModal } from "../components/game/LibraryModal";
import { RoomSidebar } from "../components/game/RoomSidebar";
import { useMultiplayer } from "../hooks/useMultiplayer";
import { LiveKitModal } from "../components/game/LiveKitModal";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../lib/api";

export default function GamePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [activeZone, setActiveZone] = useState<Zone | null>(null);
  const [currentZone, setCurrentZone] = useState<Zone | null>(null);
  const [liveKitToken, setLiveKitToken] = useState<string | null>(null);
  const [isCalling, setIsCalling] = useState(false);

  const { players, updatePosition } = useMultiplayer(roomId);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    // Join the room in the persistence layer
    if (roomId) {
      apiFetch(`/api/rooms/join/${roomId}`, { method: "POST" }).catch((err) =>
        console.error("Room join non-critical failure:", err),
      );
    }
  }, [user, navigate, roomId]);

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

  const handleProximityCall = useCallback(
    async (playerId: string | null) => {
      if (!playerId) {
        setLiveKitToken(null);
        setIsCalling(false);
        return;
      }

      if (!user || liveKitToken || isCalling) return;

      try {
        setIsCalling(true);
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
        const roomName = [user.id, playerId].sort().join("--");

        const res = await fetch(
          `${apiUrl}/api/livekit/token?room=${roomName}&username=${user.displayName}`,
        );
        const data = await res.json();

        if (data.token) {
          setLiveKitToken(data.token);
        } else {
          setIsCalling(false);
        }
      } catch (err) {
        console.error("Failed to fetch LiveKit token", err);
        setIsCalling(false);
      }
    },
    [user, liveKitToken, isCalling],
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
      <RoomSidebar roomId={roomId} user={user} players={players} />

      {/* 2. Main Game Viewport */}
      <div className="flex-1 relative flex items-center justify-center overflow-auto">
        <div className="relative pointer-events-auto">
          <GameCanvas
            onZoneChange={handleZoneChange}
            onInteract={handleInteract}
            activeZone={activeZone}
            onNearbyPlayer={handleProximityCall}
            roomId={roomId}
            players={players}
            updatePosition={updatePosition}
          />
        </div>

        {/* 3. In-Game Modals & Overlays */}
        <ZoneOverlay zone={currentZone} onPressE={handleInteract} />

        {activeZone && activeZone.id === "library" && (
          <LibraryModal onClose={handleZoneClose} />
        )}

        {liveKitToken && (
          <LiveKitModal
            token={liveKitToken}
            serverUrl={import.meta.env.VITE_LIVEKIT_URL}
            onDisconnect={() => {
              setLiveKitToken(null);
              setIsCalling(false);
            }}
          />
        )}

      </div>
    </div>
  );
}
