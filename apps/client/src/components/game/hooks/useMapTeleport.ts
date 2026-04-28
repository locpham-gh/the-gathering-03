import { WORLD_CONFIG } from "../lib/constants";
import type { MapData } from "../../../types/game";

export function useMapTeleport(mapData: MapData, setX: (x: number) => void, setY: (y: number) => void) {
  const checkTeleport = (x: number, y: number) => {
    const floorLayer = mapData.layers.find(l => l.name === "floorLayer");
    if (!floorLayer || !floorLayer.objects) return false;

    const scale = WORLD_CONFIG.TILE_SIZE_VIRTUAL / 32; 
    const px = x + 32;
    const py = y + 32;

    for (const obj of floorLayer.objects) {
      const ox = obj.x * scale;
      const oy = obj.y * scale;
      const ow = obj.width * scale;
      const oh = obj.height * scale;

      if (px >= ox && px <= ox + ow && py >= oy && py <= oy + oh) {
        if (obj.name === "to-conference") {
          setX(640 * scale);
          setY(3328 * scale);
          return true;
        } else if (obj.name === "to-office") {
          setX(128 * scale);
          setY(544 * scale);
          return true;
        }
      }
    }
    return false;
  };

  return { checkTeleport };
}
