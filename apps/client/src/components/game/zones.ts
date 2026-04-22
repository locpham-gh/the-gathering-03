import { MAP_CONFIG } from "./config";

export type ZoneType = "library";

export interface Zone {
  id: ZoneType;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  description: string;
}

export const ZONES: Zone[] = [
  {
    id: "library",
    label: "Library",
    ...(MAP_CONFIG.type === "classroom"
      ? { x: 1984, y: 1408, width: 512, height: 832 } // Classroom layout (Extended to 5 rows)
      : { x: 2000, y: 350, width: 600, height: 600 }), // Office layout
    description: "Knowledge resources and documentation",
  },
];

export function checkZoneCollision(
  playerX: number,
  playerY: number,
  zones: Zone[],
): Zone | null {
  const playerRect = {
    left: playerX + 16,
    right: playerX + 48,
    top: playerY + 32,
    bottom: playerY + 64,
  };

  for (const zone of zones) {
    if (
      playerRect.right > zone.x &&
      playerRect.left < zone.x + zone.width &&
      playerRect.bottom > zone.y &&
      playerRect.top < zone.y + zone.height
    ) {
      return zone;
    }
  }
  return null;
}
