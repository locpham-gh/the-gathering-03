import type { Zone } from "./zones";

interface ZoneOverlayProps {
  zone: Zone | null;
  onPressE: () => void;
}

export function ZoneOverlay({ zone, onPressE }: ZoneOverlayProps) {
  if (!zone) return null;

  return (
    <div
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
      onClick={onPressE}
    >
      <div className="glass px-6 py-4 rounded-xl flex items-center gap-4 animate-bounce">
        <div className="w-10 h-10 rounded-full bg-primary/30 flex items-center justify-center">
          <span className="text-2xl">⌨️</span>
        </div>
        <div className="text-center">
          <p className="text-white font-semibold text-lg">{zone.label}</p>
          <p className="text-slate-300 text-sm">
            Press <kbd className="px-2 py-0.5 bg-slate-700 rounded text-xs font-mono">E</kbd> to enter
          </p>
        </div>
      </div>
    </div>
  );
}
