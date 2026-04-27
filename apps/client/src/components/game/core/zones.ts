import { MAP_CONFIG } from "./config";

export type ZoneType = "library" | "whiteboard" | "conference";

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
      ? { x: 1984, y: 1408, width: 512, height: 832 } // Classroom layout
      : { x: 2000, y: 350, width: 600, height: 600 }), // Office layout
    description: "Knowledge resources and documentation",
  },
  {
    id: "conference",
    label: "Conference Room",
    x: 64,
    y: 6592,
    width: 440,
    height: 640,
    description: "Virtual meeting space",
  },
  {
    id: "whiteboard",
    label: "Whiteboard Area",
    ...(MAP_CONFIG.type === "classroom"
      ? { x: 500, y: 500, width: 300, height: 300 } // Dummy classroom whiteboard location
      : { x: 2600, y: 1400, width: 500, height: 500 }), // Office whiteboard location
    description: "Collaborative drawing and brainstorming",
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
