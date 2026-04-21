import { useCallback, useMemo } from "react";
import type { MapData } from "../lib/gameTypes";
import { WORLD_CONFIG } from "../lib/constants";

/**
 * Custom hook to encapsulate map collision logic.
 */
export function useCollision(mapData: MapData) {
  const hasCollidesProperty = (layer: MapData["layers"][number]) =>
    Array.isArray(layer.properties) &&
    layer.properties.some(
      (property) =>
        property.name.toLowerCase() === "collides" && Boolean(property.value),
    );

  const solidTileSet = useMemo(() => {
    const explicitSolidLayers = mapData.layers.filter(
      (l) => hasCollidesProperty(l),
    );

    const nameMatchedSolidLayers = mapData.layers.filter((l) => {
      const name = l.name.toLowerCase();
      return (
        name.includes("collision") ||
        name.includes("collider") ||
        name.includes("wall") ||
        name.includes("furniture") ||
        name.includes("object") ||
        name.includes("block")
      );
    });

    const indexFallbackLayers = mapData.layers.filter(
      (l) => typeof l.order === "number" && l.order >= 2,
    );

    const fallbackLayers =
      explicitSolidLayers.length > 0
        ? explicitSolidLayers
        : nameMatchedSolidLayers.length > 0
          ? nameMatchedSolidLayers
          : indexFallbackLayers.length > 0
            ? indexFallbackLayers
            : mapData.layers.filter((l) => {
                const name = l.name.toLowerCase();
                return (
                  !name.includes("ground") &&
                  !name.includes("floor") &&
                  !name.includes("decoration") &&
                  !name.includes("overlay")
                );
              });

    const blocked = new Set<number>();
    for (const layer of fallbackLayers) {
      if (!Array.isArray(layer.data)) continue;
      for (let i = 0; i < layer.data.length; i += 1) {
        const tileId = layer.data[i] & 0x1fffffff;
        if (tileId !== 0) blocked.add(i);
      }
    }
    if (import.meta.env.DEV) {
      console.log(
        "[collision] solid layers",
        fallbackLayers.map((layer) => layer.name),
      );
    }
    return blocked;
  }, [mapData.layers]);
  
  const checkCollision = useCallback((nextX: number, nextY: number): boolean => {
    if (solidTileSet.size === 0) return false;

    const { TILE_SIZE_VIRTUAL } = WORLD_CONFIG;
    const footX = nextX + 32;
    const footY = nextY + 64;
    // Keep collision around feet only to reduce edge-stutter on furniture corners.
    const pRect = {
      left: footX - 10,
      right: footX + 10,
      top: footY - 12,
      bottom: footY - 2,
    };

    const leftCol = Math.max(0, Math.floor(pRect.left / TILE_SIZE_VIRTUAL));
    const rightCol = Math.min(
      mapData.width - 1,
      Math.floor((pRect.right - 1) / TILE_SIZE_VIRTUAL),
    );
    const topRow = Math.max(0, Math.floor(pRect.top / TILE_SIZE_VIRTUAL));
    const bottomRow = Math.min(
      mapData.height - 1,
      Math.floor((pRect.bottom - 1) / TILE_SIZE_VIRTUAL),
    );

    for (let row = topRow; row <= bottomRow; row += 1) {
      for (let col = leftCol; col <= rightCol; col += 1) {
        const index = row * mapData.width + col;
        if (solidTileSet.has(index)) return true;
      }
    }
    return false;
  }, [mapData.width, mapData.height, solidTileSet]);

  return { checkCollision };
}
