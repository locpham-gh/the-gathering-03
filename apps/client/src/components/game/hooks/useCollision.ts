import { useCallback } from "react";
import type { MapData } from "../lib/gameTypes";
import { WORLD_CONFIG } from "../lib/constants";

/**
 * Custom hook to encapsulate map collision logic.
 */
export function useCollision(mapData: MapData) {
  
  const checkCollision = useCallback((nextX: number, nextY: number): boolean => {
    // 1. Identify solid layers (Furniture, Walls, etc.)
    const solidLayers = mapData.layers.filter(
      (l) => l.name !== "Tile Layer 1" && l.name !== "Floor" && l.name !== "floor",
    );

    if (solidLayers.length === 0) return false;

    const { TILE_SIZE_VIRTUAL } = WORLD_CONFIG;
    
    // Player collision box (centered narrow box)
    const pRect = {
      left: nextX + 16,
      right: nextX + 48,
      top: nextY + 32,
      bottom: nextY + 64,
    };

    for (const layer of solidLayers) {
      if (!layer.data) continue;
      for (let i = 0; i < layer.data.length; i++) {
        const tileId = layer.data[i] & 0x1fffffff;
        if (tileId !== 0) {
          const tx = (i % mapData.width) * TILE_SIZE_VIRTUAL;
          const ty = Math.floor(i / mapData.width) * TILE_SIZE_VIRTUAL;

          // Standard AABB collision
          if (
            pRect.right > tx &&
            pRect.left < tx + TILE_SIZE_VIRTUAL &&
            pRect.bottom > ty &&
            pRect.top < ty + TILE_SIZE_VIRTUAL
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }, [mapData]);

  return { checkCollision };
}
