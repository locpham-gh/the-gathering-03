import { useState, useCallback, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { GameCanvas } from "../components/game/GameCanvas";
import type { Zone } from "../components/game/zones";
import { ZoneOverlay } from "../components/game/ZoneOverlay";
import { ZoneModal } from "../components/game/ZoneModal";
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

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    // Join the room in the persistence layer
    if (roomId) {
      apiFetch(`/api/rooms/join/${roomId}`, { method: "POST" });
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

  const handleProximityCall = useCallback(async (playerId: string | null) => {
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
      
      const res = await fetch(`${apiUrl}/api/livekit/token?room=${roomName}&username=${user.displayName}`);
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
  }, [user, liveKitToken, isCalling]);

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
    <div className="flex h-screen w-screen items-center justify-center bg-slate-950 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-sky-500/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="absolute inset-0 z-0 flex items-center justify-center overflow-auto pointer-events-auto">
        <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-800 ring-4 ring-black/50">
          <GameCanvas
            onZoneChange={handleZoneChange}
            onInteract={handleInteract}
            activeZone={activeZone}
            onNearbyPlayer={handleProximityCall}
            roomId={roomId}
          />
        </div>
      </div>

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

      <ZoneOverlay zone={currentZone} onPressE={handleInteract} />

      {activeZone && (
        <ZoneModal zone={activeZone} onClose={handleZoneClose} />
      )}

      {/* User UI Panel */}
      <div className="absolute top-4 right-4 glass p-4 rounded-xl flex items-center gap-4 z-50 animate-in fade-in slide-in-from-right duration-500">
        <img
          src={user.avatarUrl}
          alt="Avatar"
          className="w-12 h-12 rounded-full border-2 border-primary/50 shadow-xl"
        />
        <div className="hidden md:block">
          <h2 className="text-sm font-bold text-white tracking-tight uppercase">
            {user.displayName}
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">{user.email}</p>
        </div>
        <div className="h-10 w-[1px] bg-white/10 mx-2"></div>
        <button
          onClick={() => navigate("/home")}
          className="px-4 py-2 bg-slate-500/10 hover:bg-slate-500/20 text-white text-xs font-bold rounded-lg transition-all border border-white/20 uppercase tracking-wider"
        >
          Leave Room
        </button>
      </div>
    </div>
  );
}
