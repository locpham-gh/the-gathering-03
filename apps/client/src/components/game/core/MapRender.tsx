import React from "react";
import { Container, Sprite } from "@pixi/react";
import { getTileDataForGid } from "../lib/tileUtils";
import { WORLD_CONFIG } from "../lib/constants";
import type { MapData } from "../lib/gameTypes";

interface MapRenderProps {
  mapData: MapData;
}

const MapRenderComponent: React.FC<MapRenderProps> = ({ mapData }) => {
  const renderLayer = (layer: any, layerIdx: number) => {
    if (!layer.visible || layer.opacity === 0) return null;

    if (layer.layers) {
      return (
        <Container key={layer.name}>
          {layer.layers.map((subLayer: any, subIdx: number) => 
            renderLayer(subLayer, layerIdx * 100 + subIdx)
          )}
        </Container>
      );
    }

    if (!layer.data) return null;

    return (
      <Container key={layer.name}>
        {layer.data.map((tileId: number, index: number) => {
          if (tileId === 0) return null;

          const x = (index % mapData.width) * WORLD_CONFIG.TILE_SIZE_VIRTUAL;
          const y = Math.floor(index / mapData.width) * WORLD_CONFIG.TILE_SIZE_VIRTUAL;
          const tileData = getTileDataForGid(tileId, mapData);

          if (!tileData) return null;
          const { texture, flipX, flipY } = tileData;

          const scale = WORLD_CONFIG.TILE_SCALE;

          return (
            <Sprite
              key={`${layerIdx}-${index}`}
              texture={texture}
              x={x}
              y={y}
              scale={{ x: flipX ? -scale : scale, y: flipY ? -scale : scale }}
              anchor={{ x: flipX ? 1 : 0, y: flipY ? 1 : 0 }}
            />
          );
        })}
      </Container>
    );
  };

  return (
    <Container>
      {mapData.layers.map((layer, layerIdx) => renderLayer(layer, layerIdx))}
    </Container>
  );
};

// ✅ Memoize MapRender to prevent thousands of sprites from re-rendering
// unless the mapData itself changes.
export const MapRender = React.memo(MapRenderComponent);
