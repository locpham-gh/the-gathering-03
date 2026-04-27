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
const PADDING = 6;

export const MiniMap: React.FC<MiniMapProps> = ({
  mapWidthPx,
  mapHeightPx,
  localX,
  localY,
  players,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = MINIMAP_W * dpr;
    canvas.height = MINIMAP_H * dpr;
    ctx.scale(dpr, dpr);

    // Scale factors
    const scaleX = (MINIMAP_W - PADDING * 2) / mapWidthPx;
    const scaleY = (MINIMAP_H - PADDING * 2) / mapHeightPx;

    // Clear
    ctx.clearRect(0, 0, MINIMAP_W, MINIMAP_H);

    // Background
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.beginPath();
    ctx.roundRect(0, 0, MINIMAP_W, MINIMAP_H, 10);
    ctx.fill();

    // Map area outline
    ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(PADDING, PADDING, MINIMAP_W - PADDING * 2, MINIMAP_H - PADDING * 2, 4);
    ctx.stroke();

    // Remote players (white dots)
    ctx.fillStyle = "rgba(226, 232, 240, 0.8)";
    Object.values(players).forEach((p) => {
      const px = PADDING + p.x * scaleX;
      const py = PADDING + p.y * scaleY;
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Local player (bright cyan dot)
    const lx = PADDING + localX * scaleX;
    const ly = PADDING + localY * scaleY;

    // Glow
    ctx.fillStyle = "rgba(34, 211, 238, 0.3)";
    ctx.beginPath();
    ctx.arc(lx, ly, 6, 0, Math.PI * 2);
    ctx.fill();

    // Core dot
    ctx.fillStyle = "#22d3ee";
    ctx.beginPath();
    ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Label
    ctx.fillStyle = "rgba(148, 163, 184, 0.6)";
    ctx.font = "bold 8px Arial";
    ctx.textAlign = "left";
    ctx.fillText("MAP", PADDING + 3, MINIMAP_H - PADDING - 2);
  }, [mapWidthPx, mapHeightPx, localX, localY, players]);

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
