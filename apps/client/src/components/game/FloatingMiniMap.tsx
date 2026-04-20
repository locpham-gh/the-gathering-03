import type { RemotePlayer } from "../../hooks/useMultiplayer";

interface FloatingMiniMapProps {
  players: Record<string, RemotePlayer>;
  selfPlayerId?: string | null;
  selfPlayer?: RemotePlayer | null;
  playerCount: number;
  onFocusArea?: (point: { x: number; y: number }) => void;
  onZoomToArea?: (point: { x: number; y: number }) => void;
}

const MAP_WIDTH = 2048;
const MAP_HEIGHT = 2048;

export function FloatingMiniMap({
  players,
  selfPlayerId,
  selfPlayer,
  playerCount,
  onFocusArea,
  onZoomToArea,
}: FloatingMiniMapProps) {
  const x = selfPlayer?.x ?? 0;
  const y = selfPlayer?.y ?? 0;

  return (
    <div className="absolute top-4 right-4 z-40 w-56 pointer-events-auto">
      <div className="bg-white/95 backdrop-blur border border-slate-200 rounded-xl shadow-sm p-3">
        <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
          <span className="font-semibold">Mini-map</span>
          <span>{playerCount} online</span>
        </div>

        <button
          type="button"
          onClick={(event) => {
            if (!onFocusArea) return;
            const rect = event.currentTarget.getBoundingClientRect();
            const ratioX = (event.clientX - rect.left) / rect.width;
            const ratioY = (event.clientY - rect.top) / rect.height;
            onFocusArea({
              x: Math.max(0, Math.min(MAP_WIDTH, ratioX * MAP_WIDTH)),
              y: Math.max(0, Math.min(MAP_HEIGHT, ratioY * MAP_HEIGHT)),
            });
          }}
          onDoubleClick={(event) => {
            if (!onZoomToArea) return;
            const rect = event.currentTarget.getBoundingClientRect();
            const ratioX = (event.clientX - rect.left) / rect.width;
            const ratioY = (event.clientY - rect.top) / rect.height;
            onZoomToArea({
              x: Math.max(0, Math.min(MAP_WIDTH, ratioX * MAP_WIDTH)),
              y: Math.max(0, Math.min(MAP_HEIGHT, ratioY * MAP_HEIGHT)),
            });
          }}
          className="relative h-32 w-full rounded-lg bg-linear-to-br from-slate-200 to-slate-300 overflow-hidden cursor-crosshair border border-white/60"
          title="Click to focus, double click to zoom"
        >
          {Object.values(players).map((player) => {
            const pX = Math.max(0, Math.min(1, player.x / MAP_WIDTH));
            const pY = Math.max(0, Math.min(1, player.y / MAP_HEIGHT));
            const isSelf = player.id === selfPlayerId;
            return (
              <div
                key={player.id}
                className={`absolute rounded-full border border-white shadow ${
                  isSelf
                    ? "w-2.5 h-2.5 bg-indigo-600 z-10 ring-2 ring-indigo-200"
                    : "w-2 h-2 bg-emerald-500/90"
                }`}
                style={{
                  left: `${pX * 100}%`,
                  top: `${pY * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
              />
            );
          })}
        </button>

        <p className="mt-2 text-[11px] text-slate-500">
          x: {Math.round(x)} / y: {Math.round(y)}
        </p>
      </div>
    </div>
  );
}
