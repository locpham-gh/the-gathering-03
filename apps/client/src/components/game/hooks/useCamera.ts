import { useRef, useCallback } from "react";
import * as PIXI from "pixi.js";

/**
 * Custom hook for smooth, DPI-aware camera following.
 */
export function useCamera(
  worldRef: React.RefObject<PIXI.Container>,
  screenW: number,
  screenH: number,
  mapWidth: number,
  mapHeight: number
) {
  // Track float state so Lerp is fluid, but Container snap is rounded 
  const camExactPos = useRef({ x: 0, y: 0 });
  const lastApplied = useRef({ x: Number.NaN, y: Number.NaN });

  const updateCamera = useCallback((playerX: number, playerY: number, delta: number) => {
    if (!worldRef.current) return;
    const d = Math.min(delta, 2);

    // 1. Calculate ideal target (centered on player)
    // Vertical offset (64px) to keep character centered-bottom
    let targetCamX = screenW / 2 - playerX;
    let targetCamY = screenH / 2 - playerY + 64; 

    // 2. ✅ CAMERA CLAMPING
    // Limit X: Clamp between -(mapWidth - screenW) and 0
    if (mapWidth > screenW) {
      targetCamX = Math.min(0, Math.max(targetCamX, -(mapWidth - screenW)));
    } else {
      targetCamX = screenW / 2 - mapWidth / 2; // Center map if smaller than screen
    }

    // Limit Y: Clamp between -(mapHeight - screenH) and 0
    if (mapHeight > screenH) {
      targetCamY = Math.min(0, Math.max(targetCamY, -(mapHeight - screenH)));
    } else {
      targetCamY = screenH / 2 - mapHeight / 2;
    }

    // 3. Initial snap or Lerp
    if (camExactPos.current.x === 0 && camExactPos.current.y === 0) {
      camExactPos.current.x = targetCamX;
      camExactPos.current.y = targetCamY;
    } else {
      // Softer follow to reduce motion sickness and shake.
      const ease = 0.06 * d;
      camExactPos.current.x += (targetCamX - camExactPos.current.x) * ease;
      camExactPos.current.y += (targetCamY - camExactPos.current.y) * ease;

      // Deadzone: avoid tiny subpixel oscillations that look like shaking.
      if (Math.abs(targetCamX - camExactPos.current.x) < 0.4) {
        camExactPos.current.x = targetCamX;
      }
      if (Math.abs(targetCamY - camExactPos.current.y) < 0.4) {
        camExactPos.current.y = targetCamY;
      }
    }
    
    // Round only when changed to reduce visible jitter.
    const nextX = Math.round(camExactPos.current.x);
    const nextY = Math.round(camExactPos.current.y);
    if (nextX !== lastApplied.current.x || nextY !== lastApplied.current.y) {
      worldRef.current.x = nextX;
      worldRef.current.y = nextY;
      lastApplied.current.x = nextX;
      lastApplied.current.y = nextY;
    }
  }, [worldRef, screenW, screenH, mapWidth, mapHeight]);

  return { updateCamera };
}
