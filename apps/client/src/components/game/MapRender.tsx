import React from "react";
import { Container, Sprite } from "@pixi/react";
import { getTileDataForGid } from "./lib/tileUtils";
import { WORLD_CONFIG } from "./lib/constants";
import type { MapData } from "./lib/gameTypes";

interface MapRenderProps {
  mapData: MapData;
}

const MapRenderComponent: React.FC<MapRenderProps> = ({ mapData }) => {
  return (
    <Container>
      {mapData.layers.map((layer, layerIdx) => {
        if (!layer.data) return null;

        return (
          <Container key={layer.name}>
            {layer.data.map((tileId, index) => {
              if (tileId === 0) return null;

              const x = (index % mapData.width) * 64;
              const y = Math.floor(index / mapData.width) * 64;
              const tileData = getTileDataForGid(tileId);

              if (!tileData) return null;
              const { texture, flipX, flipY } = tileData;

              return (
                <Sprite
                  key={`${layerIdx}-${index}`}
                  texture={texture}
                  x={x}
                  y={y}
                  // ✅ Fine-tuned scale of 2.01 to hide sub-pixel gaps 
                  scale={{ x: flipX ? -2.01 : 2.01, y: flipY ? -2.01 : 2.01 }}
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
