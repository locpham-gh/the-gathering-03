import { useState, useCallback, useEffect } from "react";
import { useAuth } from "./contexts/AuthContext";
import { GoogleOneTap } from "./components/auth/GoogleOneTap";
import { GameCanvas } from "./components/game/GameCanvas";
import type { Zone } from "./components/game/zones";
import { ZoneOverlay } from "./components/game/ZoneOverlay";
import { ZoneModal } from "./components/game/ZoneModal";
import { LiveKitModal } from "./components/game/LiveKitModal";

function App() {
  const { user, logout } = useAuth();
  const [activeZone, setActiveZone] = useState<Zone | null>(null);
  const [currentZone, setCurrentZone] = useState<Zone | null>(null);
  const [liveKitToken, setLiveKitToken] = useState<string | null>(null);
  const [isCalling, setIsCalling] = useState(false);

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

  if (user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-sky-500/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="absolute inset-0 z-0 flex items-center justify-center overflow-auto pointer-events-auto">
          <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-800 ring-4 ring-black">
            <GameCanvas
              onZoneChange={handleZoneChange}
              onInteract={handleInteract}
              activeZone={activeZone}
              onNearbyPlayer={handleProximityCall}
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

        <div className="absolute top-4 right-4 glass p-4 rounded-xl flex items-center gap-4 z-50">
          <img
            src={user.avatarUrl}
            alt="Avatar"
            className="w-12 h-12 rounded-full border-2 border-slate-800 shadow-xl"
          />
          <div className="hidden md:block">
            <h2 className="text-sm font-bold text-white tracking-tight">
              {user.displayName}
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">{user.email}</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-200 text-xs font-semibold rounded-lg transition-all border border-red-500/20"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-950 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="glass p-12 rounded-[2rem] sm:w-[440px] flex flex-col items-center mx-4 z-10 shadow-2xl">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-indigo-600 rounded-2xl mb-8 shadow-lg flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>

        <h1 className="text-3xl font-semibold text-white mb-3 tracking-tight">
          The Gathering
        </h1>
        <p className="text-slate-400 text-center mb-8 leading-relaxed max-w-[280px]">
          Join your virtual co-working space and collaborate seamlessly.
        </p>

        <GoogleOneTap />

        <p className="text-xs text-slate-500 mt-8 text-center px-4">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

export default App;
