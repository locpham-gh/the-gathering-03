import { useCallback } from "react";
import type { MapData, MapLayer } from "../../../types/game";
import { WORLD_CONFIG } from "../lib/constants";

/**
 * Custom hook to encapsulate map collision logic.
 */
export function useCollision(mapData: MapData) {
  
  const checkCollision = useCallback((nextX: number, nextY: number): boolean => {
    const { TILE_SIZE_VIRTUAL } = WORLD_CONFIG;
    
    // 1. Recursive helper to get all data-bearing layers
    const getAllLayers = (layers: MapLayer[]): MapLayer[] => {
      let result: MapLayer[] = [];
      for (const layer of layers) {
        if (layer.layers) {
          result = result.concat(getAllLayers(layer.layers));
        } else if (layer.data) {
          result.push(layer);
        }
      }
      return result;
    };

    const allLayers = getAllLayers(mapData.layers);

    // 2. Identify solid layers (Prioritize layers named "collision")
    let solidLayers = allLayers.filter(l => l.name && l.name.toLowerCase().includes("collision"));
    
    // Fallback if no specific collision layer is found
    if (solidLayers.length === 0) {
      solidLayers = allLayers.filter(
        (l) => l.name && 
               l.name !== "Tile Layer 1" && 
               !l.name.toLowerCase().includes("floor") && 
               !l.name.toLowerCase().includes("ground") &&
               !l.name.toLowerCase().includes("above")
      );
    }

    if (solidLayers.length === 0) return false;

    // Player collision box (slightly smaller than sprite)
    const pRect = {
      left: nextX + 16,
      right: nextX + 48,
      top: nextY + 40,
      bottom: nextY + 64,
    };

    // Calculate grid range to check (Optimization: O(1) tiles instead of O(N) map size)
    const startCol = Math.floor(pRect.left / TILE_SIZE_VIRTUAL);
    const endCol = Math.floor(pRect.right / TILE_SIZE_VIRTUAL);
    const startRow = Math.floor(pRect.top / TILE_SIZE_VIRTUAL);
    const endRow = Math.floor(pRect.bottom / TILE_SIZE_VIRTUAL);

    for (const layer of solidLayers) {
      if (!layer.data) continue;
      for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
          if (row < 0 || row >= mapData.height || col < 0 || col >= mapData.width) continue;
          
          const i = row * mapData.width + col;
          const tileId = layer.data[i] & 0x1fffffff;
          
          if (tileId !== 0) {
            const tx = col * TILE_SIZE_VIRTUAL;
            const ty = row * TILE_SIZE_VIRTUAL;

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
    }
    return false;
  }, [mapData]);

  return { checkCollision };
}
