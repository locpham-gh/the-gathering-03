export type ZoneType = "library" | "whiteboard" | "conference" | "presentation" | "seat" | "chill" | "whiteboard_leader";

export interface Zone {
  id: ZoneType;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  description: string;
}

const CLASSROOM_ZONES: Zone[] = [
  {
    id: "library",
    label: "Library",
    x: 1984,
    y: 1408,
    width: 512,
    height: 832,
    description: "Knowledge resources and documentation",
  },
  {
    id: "whiteboard",
    label: "Whiteboard Area",
    x: 500,
    y: 500,
    width: 300,
    height: 300,
    description: "Collaborative drawing and brainstorming",
  },
];

const OFFICE_ZONES: Zone[] = [
  {
    id: "library",
    label: "Library",
    x: 64,
    y: 64,
    width: 448,
    height: 448,
    description: "Knowledge resources and documentation",
  },
  {
    id: "whiteboard_leader",
    label: "Whiteboard",
    x: 1696,
    y: 128,
    width: 192,
    height: 128,
    description: "Stand here to present to the meeting room",
  },
  {
    id: "conference",
    label: "Meeting Room",
    x: 1536,
    y: 448,
    width: 384,
    height: 448,
    description: "Sit here to join the meeting and view the whiteboard",
  },
  {
    id: "whiteboard",
    label: "Whiteboard Area",
    x: 2600,
    y: 1400,
    width: 500,
    height: 500,
    description: "Collaborative drawing and brainstorming",
  },
  {
    id: "chill",
    label: "Chill Zone 🌿",
    x: 1280,
    y: 1088,
    width: 448,
    height: 256,
    description: "Relax, mic & cam off, chill music on",
  },
];

const CAFE_ZONES: Zone[] = [
  {
    id: "library",
    label: "Café Books",
    x: 896,
    y: 256,
    width: 64,
    height: 128,
    description: "Relaxed reading corner",
  },
  {
    id: "whiteboard",
    label: "Whiteboard",
    x: 640,
    y: 64,
    width: 256,
    height: 128,
    description: "Collaborative drawing",
  },
  {
    id: "presentation",
    label: "Main Stage",
    x: 320,
    y: 64,
    width: 320,
    height: 192,
    description: "Area for screen sharing and presentations",
  },
];



export const MAP_ZONES: Record<string, Zone[]> = {
  classroom: CLASSROOM_ZONES,
  office: OFFICE_ZONES,
  office_combined: OFFICE_ZONES,
  cafe: CAFE_ZONES,
};

export function getZonesForMap(mapType: string = "office"): Zone[] {
  if (!mapType) return MAP_ZONES.office;
  const normalized = mapType.toLowerCase().replace(/[\s_]/g, "");
  
  if (normalized.includes("office2") || normalized.includes("merged") || normalized.includes("officecombined")) {
    return MAP_ZONES.office_combined;
  }
  if (normalized.includes("school") || normalized.includes("classroom")) {
    return MAP_ZONES.classroom;
  }
  if (normalized.includes("cafe") || normalized.includes("lounge")) {
    return MAP_ZONES.cafe;
  }

  return MAP_ZONES.office;
}

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
