import React, { useMemo } from "react";
import { Container, Sprite } from "@pixi/react";
import { getTileDataForGid, getTileDataForGidFromTilesets } from "./lib/tileUtils";
import { WORLD_CONFIG } from "./lib/constants";
import type { MapData } from "./lib/gameTypes";
import type { MapVersion } from "./config";

interface ObjectLayerProps {
  mapData: MapData;
  mapVersion: MapVersion;
  viewportBounds?: { left: number; top: number; right: number; bottom: number } | null;
}

const OBJECT_LAYER_HINTS = ["layer 3", "layer 4", "object", "furniture", "wall", "block"];

const hasCollidesProperty = (layer: MapData["layers"][number]) =>
  Array.isArray(layer.properties) &&
  layer.properties.some((property) => property.name.toLowerCase() === "collides" && Boolean(property.value));

export const ObjectLayer: React.FC<ObjectLayerProps> = ({
  mapData,
  mapVersion,
  viewportBounds = null,
}) => {
  const objectLayers = useMemo(() => {
    const byProperty = mapData.layers.filter((layer) => hasCollidesProperty(layer));
    if (byProperty.length > 0) return byProperty;
    const byName = mapData.layers.filter((layer) => {
      const normalized = layer.name.toLowerCase();
      return OBJECT_LAYER_HINTS.some((hint) => normalized.includes(hint));
    });
    if (byName.length > 0) return byName;
    return mapData.layers.filter((layer) => (layer.order ?? 0) >= 2);
  }, [mapData.layers]);

  return (
    <Container>
      {objectLayers.map((layer, layerIdx) =>
        layer.data.map((tileId, index) => {
          if (tileId === 0) return null;
          const x = (index % mapData.width) * WORLD_CONFIG.TILE_SIZE_VIRTUAL;
          const y = Math.floor(index / mapData.width) * WORLD_CONFIG.TILE_SIZE_VIRTUAL;
          if (
            viewportBounds &&
            (x > viewportBounds.right ||
              y > viewportBounds.bottom ||
              x + WORLD_CONFIG.TILE_SIZE_VIRTUAL < viewportBounds.left ||
              y + WORLD_CONFIG.TILE_SIZE_VIRTUAL < viewportBounds.top)
          ) {
            return null;
          }
          const tileData =
            getTileDataForGidFromTilesets(tileId, mapData.tilesets) ||
            getTileDataForGid(tileId, mapVersion);
          if (!tileData) return null;
          const { texture, flipX, flipY } = tileData;
          const scale = WORLD_CONFIG.TILE_SCALE;
          const footX = x + WORLD_CONFIG.TILE_SIZE_VIRTUAL / 2;
          const footY = y + WORLD_CONFIG.TILE_SIZE_VIRTUAL;
          return (
            <Sprite
              key={`${layer.name}-${layerIdx}-${index}`}
              texture={texture}
              x={footX}
              y={footY}
              anchor={{ x: 0.5, y: 1 }}
              zIndex={footY}
              scale={{ x: flipX ? -scale : scale, y: flipY ? -scale : scale }}
            />
          );
        }),
      )}
    </Container>
  );
};
