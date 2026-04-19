import { useRef, useCallback } from "react";
import * as PIXI from "pixi.js";

/**
 * Custom hook for smooth, DPI-aware camera following.
 */
export function useCamera(
  worldRef: React.RefObject<PIXI.Container>,
  screenW: number,
  screenH: number
) {
  // Track float state so Lerp is fluid, but Container snap is rounded 
  const camExactPos = useRef({ x: 0, y: 0 });

  const updateCamera = useCallback((playerX: number, playerY: number, delta: number) => {
    if (!worldRef.current) return;

    // Follow player with a slight vertical offset (64px) to keep character centered-bottom
    const targetCamX = screenW / 2 - playerX;
    const targetCamY = screenH / 2 - playerY + 64; 

    // Initial snap or Lerp
    if (camExactPos.current.x === 0 && camExactPos.current.y === 0) {
      camExactPos.current.x = targetCamX;
      camExactPos.current.y = targetCamY;
    } else {
      camExactPos.current.x += (targetCamX - camExactPos.current.x) * 0.1 * delta;
      camExactPos.current.y += (targetCamY - camExactPos.current.y) * 0.1 * delta;
    }
    
    // ✅ DPI-AWARE ROUNDING: Snaps to physical pixels rather than CSS pixels.
    // This prevents the "wall shifting" and jittering when zoomed.
    const dpr = window.devicePixelRatio || 1;
    worldRef.current.x = Math.round(camExactPos.current.x * dpr) / dpr;
    worldRef.current.y = Math.round(camExactPos.current.y * dpr) / dpr;
  }, [worldRef, screenW, screenH]);

  return { updateCamera };
}
