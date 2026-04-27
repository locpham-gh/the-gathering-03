export type ZoneType = "library" | "whiteboard" | "conference" | "presentation";

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
    x: 2000,
    y: 350,
    width: 600,
    height: 600,
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
    x: 2600,
    y: 1400,
    width: 500,
    height: 500,
    description: "Collaborative drawing and brainstorming",
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

const GARDEN_ZONES: Zone[] = [
  {
    id: "presentation",
    label: "Fountain Area",
    x: 576, // (20-2)*32
    y: 576,
    width: 160, // 5*32
    height: 160,
    description: "Social gathering spot near the fountain",
  },
  {
    id: "library",
    label: "Zen Corner",
    x: 64,
    y: 64,
    width: 256,
    height: 256,
    description: "Quiet place for deep work",
  },
];

const CONFERENCE_ZONES: Zone[] = [
  {
    id: "presentation",
    label: "Main Stage",
    x: 32,
    y: 32,
    width: 1056, // (35-2)*32
    height: 192, // 6*32
    description: "Main presentation area",
  },
  {
    id: "conference",
    label: "Audience Section",
    x: 128,
    y: 288,
    width: 864,
    height: 480,
    description: "Main seating for attendees",
  },
];

export const MAP_ZONES: Record<string, Zone[]> = {
  classroom: CLASSROOM_ZONES,
  office: OFFICE_ZONES,
  office_combined: OFFICE_ZONES,
  cafe: CAFE_ZONES,
  garden: GARDEN_ZONES,
  conference: CONFERENCE_ZONES,
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
  if (normalized.includes("garden") || normalized.includes("outdoor") || normalized.includes("park")) {
    return MAP_ZONES.garden;
  }
  if (normalized.includes("conference") || normalized.includes("hall") || normalized.includes("auditorium")) {
    return MAP_ZONES.conference;
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
