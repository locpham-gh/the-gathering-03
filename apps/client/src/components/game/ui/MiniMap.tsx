import React, { useRef, useEffect } from "react";
import type { RemotePlayer } from "../../../hooks/useMultiplayer";

interface MiniMapProps {
  mapWidthPx: number;
  mapHeightPx: number;
  localX: number;
  localY: number;
  players: Record<string, RemotePlayer>;
}

const MINIMAP_W = 180;
const MINIMAP_H = 130;
const PAD = 6;

export const MiniMap: React.FC<MiniMapProps> = ({
  mapWidthPx,
  mapHeightPx,
  localX,
  localY,
  players,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const dataRef = useRef({ localX, localY, players, mapWidthPx, mapHeightPx });

  // Keep ref in sync without re-running effect
  dataRef.current = { localX, localY, players, mapWidthPx, mapHeightPx };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = MINIMAP_W * dpr;
    canvas.height = MINIMAP_H * dpr;
    ctx.scale(dpr, dpr);

    const draw = () => {
      const { localX: lx, localY: ly, players: pl, mapWidthPx: mw, mapHeightPx: mh } = dataRef.current;

      const innerW = MINIMAP_W - PAD * 2;
      const innerH = MINIMAP_H - PAD * 2;
      const scaleX = innerW / mw;
      const scaleY = innerH / mh;

      ctx.clearRect(0, 0, MINIMAP_W, MINIMAP_H);

      // BG
      ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
      ctx.beginPath();
      ctx.roundRect(0, 0, MINIMAP_W, MINIMAP_H, 10);
      ctx.fill();

      // Border
      ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(PAD, PAD, innerW, innerH, 4);
      ctx.stroke();

      // Remote players
      Object.values(pl).forEach((p) => {
        const px = PAD + p.x * scaleX;
        const py = PAD + p.y * scaleY;
        ctx.fillStyle = "rgba(226, 232, 240, 0.7)";
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Local player glow
      const mx = PAD + lx * scaleX;
      const my = PAD + ly * scaleY;
      ctx.fillStyle = "rgba(34, 211, 238, 0.25)";
      ctx.beginPath();
      ctx.arc(mx, my, 6, 0, Math.PI * 2);
      ctx.fill();

      // Local player dot
      ctx.fillStyle = "#22d3ee";
      ctx.beginPath();
      ctx.arc(mx, my, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.fillStyle = "rgba(148, 163, 184, 0.5)";
      ctx.font = "bold 8px Arial";
      ctx.textAlign = "left";
      ctx.fillText("MAP", PAD + 3, MINIMAP_H - PAD - 2);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        bottom: 20,
        right: 20,
        width: MINIMAP_W,
        height: MINIMAP_H,
        zIndex: 50,
        pointerEvents: "none",
        borderRadius: 10,
      }}
    />
  );
};
