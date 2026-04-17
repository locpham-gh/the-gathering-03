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
    x: 192,
    y: 192,
    width: 128,
    height: 128,
    description: "Knowledge resources and documentation",
  },
];

export function checkZoneCollision(
  playerX: number,
  playerY: number,
  zones: Zone[]
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
