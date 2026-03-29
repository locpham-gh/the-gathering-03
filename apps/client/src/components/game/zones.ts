export type ZoneType = "reception" | "library" | "forum";

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
    id: "reception",
    label: "Reception",
    x: 64,
    y: 64,
    width: 128,
    height: 128,
    description: "Welcome desk and check-in area",
  },
  {
    id: "library",
    label: "Library",
    x: 192,
    y: 192,
    width: 128,
    height: 128,
    description: "Knowledge resources and documentation",
  },
  {
    id: "forum",
    label: "Forum",
    x: 640,
    y: 192,
    width: 128,
    height: 128,
    description: "Discussion and community board",
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
