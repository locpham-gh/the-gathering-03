import React from "react";
import { Container, Sprite } from "@pixi/react";
import { getTileDataForGid, getTileDataForGidFromTilesets } from "./lib/tileUtils";
import { WORLD_CONFIG } from "./lib/constants";
import type { MapData } from "./lib/gameTypes";
import type { MapVersion } from "./config";

interface MapRenderProps {
  mapData: MapData;
  mapVersion: MapVersion;
  renderMode?: "all" | "bottom" | "top";
  viewportBounds?: { left: number; top: number; right: number; bottom: number } | null;
  excludeLayerNames?: Set<string>;
}

const TOP_LAYER_KEYWORDS = [
  "top",
  "upper",
  "above",
  "overlay",
  "roof",
  "ceiling",
  "foreground",
  "tile layer 4",
  "tile layer 5",
];

const hasTruthyProperty = (layer: MapData["layers"][number], key: string) =>
  Array.isArray(layer.properties) &&
  layer.properties.some(
    (property) => property.name.toLowerCase() === key && Boolean(property.value),
  );

const isTopLayer = (layer: MapData["layers"][number]) => {
  if (hasTruthyProperty(layer, "renderaboveplayers")) return true;
  const name = layer.name.toLowerCase();
  return TOP_LAYER_KEYWORDS.some((keyword) => name.includes(keyword));
};

const MapRenderComponent: React.FC<MapRenderProps> = ({
  mapData,
  mapVersion,
  renderMode = "all",
  viewportBounds = null,
  excludeLayerNames,
}) => {
  const layersToRender = mapData.layers.filter((layer) => {
    if (excludeLayerNames?.has(layer.name)) return false;
    if (renderMode === "all") return true;
    const topLayer = isTopLayer(layer);
    return renderMode === "top" ? topLayer : !topLayer;
  });

  return (
    <Container>
      {layersToRender.map((layer, layerIdx) => {
        if (!layer.data) return null;

        return (
          <Container key={layer.name}>
            {layer.data.map((tileId, index) => {
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

              return (
                <Sprite
                  key={`${layerIdx}-${index}`}
                  texture={texture}
                  x={x}
                  y={y}
                  // ✅ Fine-tuned scale to hide sub-pixel gaps 
                  scale={{ x: flipX ? -scale : scale, y: flipY ? -scale : scale }}
                  anchor={{ x: flipX ? 1 : 0, y: flipY ? 1 : 0 }}
                />
              );
            })}
          </Container>
        );
      })}
    </Container>
  );
};

// ✅ Memoize MapRender to prevent thousands of sprites from re-rendering
// unless the mapData itself changes.
export const MapRender = React.memo(MapRenderComponent);
