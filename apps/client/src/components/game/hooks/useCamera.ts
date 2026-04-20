import { useRef, useCallback } from "react";
import * as PIXI from "pixi.js";

/**
 * Custom hook for smooth, DPI-aware camera following.
 */
export function useCamera(
  worldRef: React.RefObject<PIXI.Container>,
  screenW: number,
  screenH: number,
  zoom = 1,
  panOffset: { x: number; y: number } = { x: 0, y: 0 },
  worldSize?: { width: number; height: number },
  onTransformChange?: (next: { x: number; y: number; scale: number }) => void,
) {
  // Track float state so Lerp is fluid, but Container snap is rounded 
  const camExactPos = useRef({ x: 0, y: 0 });

  const updateCamera = useCallback((playerX: number, playerY: number, delta: number) => {
    if (!worldRef.current) return;

    // Follow player with a slight vertical offset (64px) to keep character centered-bottom
    const targetCamX = screenW / 2 - playerX * zoom + panOffset.x;
    const targetCamY = screenH / 2 - playerY * zoom + 64 * zoom + panOffset.y;

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
    const worldWidth = worldSize?.width || 0;
    const worldHeight = worldSize?.height || 0;
    const scaledWorldWidth = worldWidth * zoom;
    const scaledWorldHeight = worldHeight * zoom;

    let clampedX = camExactPos.current.x;
    let clampedY = camExactPos.current.y;

    if (scaledWorldWidth > 0) {
      if (scaledWorldWidth <= screenW) {
        clampedX = (screenW - scaledWorldWidth) / 2;
      } else {
        const minX = screenW - scaledWorldWidth;
        const maxX = 0;
        clampedX = Math.max(minX, Math.min(maxX, clampedX));
      }
    }

    if (scaledWorldHeight > 0) {
      if (scaledWorldHeight <= screenH) {
        clampedY = (screenH - scaledWorldHeight) / 2;
      } else {
        const minY = screenH - scaledWorldHeight;
        const maxY = 0;
        clampedY = Math.max(minY, Math.min(maxY, clampedY));
      }
    }

    const dpr = window.devicePixelRatio || 1;
    const finalX = Math.round(clampedX * dpr) / dpr;
    const finalY = Math.round(clampedY * dpr) / dpr;
    worldRef.current.x = finalX;
    worldRef.current.y = finalY;
    worldRef.current.scale.set(zoom);
    onTransformChange?.({ x: finalX, y: finalY, scale: zoom });
  }, [
    worldRef,
    screenW,
    screenH,
    zoom,
    panOffset.x,
    panOffset.y,
    worldSize?.width,
    worldSize?.height,
    onTransformChange,
  ]);

  return { updateCamera };
}
