import type { Zone } from "../core/zones";

interface ZoneOverlayProps {
  zone: Zone | null;
  onPressE: () => void;
}

export function ZoneOverlay({ zone, onPressE }: ZoneOverlayProps) {
  if (!zone) return null;

  return (
    <div
      className="absolute top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
      onClick={onPressE}
    >
      <div className="bg-slate-900 border-2 border-teal-500 shadow-[0_0_40px_-5px_rgba(20,184,166,0.3)] px-6 py-4 rounded-2xl flex items-center gap-4 animate-bounce">
        <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-400">
          <span className="text-2xl font-black">⌨️</span>
        </div>
        <div className="text-center">
          <p className="text-white font-bold text-lg mb-0.5">{zone.label}</p>
          <p className="text-teal-400 font-medium text-sm">
            Press <kbd className="px-2 py-1 bg-teal-500/20 rounded-md text-xs font-mono font-black border border-teal-500/30">E</kbd> to enter
          </p>
        </div>
      </div>
    </div>
  );
}
