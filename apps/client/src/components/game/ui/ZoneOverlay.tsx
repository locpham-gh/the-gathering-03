import type { Zone } from "../core/zones";

interface ZoneOverlayProps {
  zone: Zone | null;
  onPressE: () => void;
}

export function ZoneOverlay({ zone, onPressE }: ZoneOverlayProps) {
  // Hide popup for passive/auto-entry zones:
  // - chill: auto-mute and music (passive)
  // - conference: auto-view whiteboard (passive for attendees)
  if (!zone || zone.id === "chill" || zone.id === "conference") return null;

  const isSeat = zone.id === "seat";
  const isLeader = zone.id === "whiteboard_leader";
  const isLibrary = zone.id === "library";
  
  // Use "open" if sitting in a zone like library
  const actionText = isSeat ? "sit" : (isLeader ? "present" : (isLibrary ? "open" : "enter"));

  return (
    <div
      className="absolute top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
      onClick={onPressE}
    >
      <div className={`${
        isSeat 
          ? "bg-slate-900/90 border-amber-400 shadow-[0_0_30px_-5px_rgba(251,191,36,0.3)]" 
          : "bg-slate-900 border-teal-500 shadow-[0_0_40px_-5px_rgba(20,184,166,0.3)]"
      } border-2 px-6 py-3 rounded-2xl flex items-center gap-4 animate-bounce backdrop-blur-sm`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          isSeat ? "bg-amber-500/20 text-amber-400" : "bg-teal-500/20 text-teal-400"
        }`}>
          <span className="text-xl">{isSeat ? "🪑" : "⌨️"}</span>
        </div>
        <div>
          <p className="text-white font-bold text-base mb-0.5">{zone.label}</p>
          <p className={`font-medium text-sm ${isSeat ? "text-amber-400" : "text-teal-400"}`}>
            Press <kbd className={`px-2 py-0.5 rounded-md text-xs font-mono font-black border ${
              isSeat 
                ? "bg-amber-500/20 border-amber-500/30" 
                : "bg-teal-500/20 border-teal-500/30"
            }`}>E</kbd> to {actionText}
          </p>
        </div>
      </div>
    </div>
  );
}
