import React, { useState, useRef, useMemo } from "react";
import { useTick } from "@pixi/react";
import * as PIXI from "pixi.js";

// Libs & Types
import { WORLD_CONFIG } from "../lib/constants";
import { getNewDirection, getTileDataForGid } from "../lib/tileUtils";
import { getZonesForMap, checkZoneCollision } from "../core/zones";
import type { Zone } from "../core/zones";
import type { RemotePlayer } from "../../../hooks/useMultiplayer";
import type { DirString, MapData } from "../lib/gameTypes";

// Hooks
import { usePlayerInput } from "../hooks/usePlayerInput";
import { useCollision } from "../hooks/useCollision";
import { useCamera } from "../hooks/useCamera";

// Components
import { AnimatedPlayerSprite } from "./AnimatedPlayerSprite";

interface PlayerProps {
  mapData: MapData;
  mapType: string;
  onZoneChange?: (zone: Zone | null) => void;
  isPaused: boolean;
  onInteract?: () => void;
  onPhoneToggle?: (isOpen: boolean) => void;
  updatePosition: (x: number, y: number, direction: string, isSitting?: boolean, character?: string, customName?: string, isPhoneOut?: boolean) => void;
  players: Record<string, RemotePlayer>;
  onNearbyPlayer?: (playerId: string | null) => void;
  worldRef: React.RefObject<PIXI.Container>;
  screenW: number;
  screenH: number;
  selectedCharacter: string;
  customDisplayName?: string;
  localEmote?: { id: string; timestamp: number } | null;
  localChatBubble?: string | null;
  roomId?: string;
  initialServerPosition?: { x: number; y: number } | null;
}

export const Player: React.FC<PlayerProps> = ({
  mapData,
  mapType,
  onZoneChange,
  isPaused,
  onInteract,
  updatePosition,
  players,
  onNearbyPlayer,
  worldRef,
  screenW,
  screenH,
  selectedCharacter,
  customDisplayName,
  localEmote,
  localChatBubble,
  roomId,
  initialServerPosition,
  onPhoneToggle,
}) => {
  const zones = useMemo(() => getZonesForMap(mapType), [mapType]);

  // --- Spawn point detection ---
  // Priority: 1) server-saved pos, 2) localStorage, 3) map's "start" layer, 4) center
  const getMapSpawnPoint = (): { x: number; y: number } => {
    const startLayer = mapData.layers?.find((l: any) => l.name === "start" && l.data);
    if (startLayer?.data) {
      for (let i = 0; i < startLayer.data.length; i++) {
        if (startLayer.data[i] !== 0) {
          const col = i % mapData.width;
          const row = Math.floor(i / mapData.width);
          return {
            x: col * WORLD_CONFIG.TILE_SIZE_VIRTUAL + WORLD_CONFIG.TILE_SIZE_VIRTUAL / 2,
            y: row * WORLD_CONFIG.TILE_SIZE_VIRTUAL + WORLD_CONFIG.TILE_SIZE_VIRTUAL / 2,
          };
        }
      }
    }
    // Fallback: center
    return {
      x: (mapData.width * WORLD_CONFIG.TILE_SIZE_VIRTUAL) / 2,
      y: (mapData.height * WORLD_CONFIG.TILE_SIZE_VIRTUAL) / 2,
    };
  };

  // Restore saved position from server or localStorage
  const posKey = `savedPos_${customDisplayName || "guest"}_${roomId || mapData.width}`;
  
  const getInitialPosition = () => {
    // Only use server position if it's NOT at the origin (0,0)
    if (initialServerPosition && (initialServerPosition.x !== 0 || initialServerPosition.y !== 0)) {
      return initialServerPosition;
    }
    try {
      const saved = localStorage.getItem(posKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to parse saved position", e);
    }
    return getMapSpawnPoint();
  };

  const initialPos = getInitialPosition();
  const [x, setX] = useState(initialPos.x);
  const [y, setY] = useState(initialPos.y);

  // Save position when it changes
  React.useEffect(() => {
    localStorage.setItem(posKey, JSON.stringify({ x, y }));
  }, [x, y, posKey]);

  const [direction, setDirection] = useState<DirString>("down");
  const [isMoving, setIsMoving] = useState(false);
  const [isSitting, setIsSitting] = useState(false);
  const [isPhoneOut, setIsPhoneOut] = useState(false);
  const [currentZone, setCurrentZone] = useState<Zone | null>(null);
  const [nearbyChair, setNearbyChair] = useState<boolean>(false);
  const [nearbyPlayerId, setNearbyPlayerId] = useState<string | null>(null);

  // 2. Refs for physics/sync
  const sitOrigin = useRef<{ x: number; y: number } | null>(null);
  const lastNearbyTrigger = useRef<number>(0);
  const lastSyncSit = useRef(isSitting);
  const lastSyncPhone = useRef(isPhoneOut);

  // 3. Custom Logic Hooks
  const { checkCollision } = useCollision(mapData);
  const { updateCamera } = useCamera(
    worldRef, 
    screenW, 
    screenH, 
    mapData.width * WORLD_CONFIG.TILE_SIZE_VIRTUAL, 
    mapData.height * WORLD_CONFIG.TILE_SIZE_VIRTUAL
  );

  // --- Map Utilities ---
  // Helper to find tile GID at (col, row) considering groups
  const getTileAt = (layers: any[], col: number, row: number): { gid: number; layerName: string } | null => {
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (!layer.visible || layer.opacity === 0) continue;
      
      // Recursive check for groups
      if (layer.layers) {
        const found = getTileAt(layer.layers, col, row);
        if (found) return found;
        continue;
      }

      if (layer.data && col >= 0 && row >= 0 && col < mapData.width && row < mapData.height) {
        const tileIndex = row * mapData.width + col;
        const gid = layer.data[tileIndex] & 0x1fffffff;
        if (gid !== 0) {
          // Skip floor/ground layers for seat detection
          const lowerName = layer.name?.toLowerCase() || "";
          if (lowerName.includes("floor") || lowerName.includes("ground") || lowerName.includes("tile layer 1")) continue;
          return { gid, layerName: layer.name };
        }
      }
    }
    return null;
  };

  const handleInteraction = () => {
    if (isPaused) return;

    // Toggle sitting if already sat
    if (isSitting) {
      setIsSitting(false);
      if (sitOrigin.current) {
        setX(sitOrigin.current.x);
        setY(sitOrigin.current.y);
        sitOrigin.current = null;
      }
      return;
    }

    // Interaction Check (Raycast forward)
    let focusX = x;
    let focusY = y;
    const interactRange = WORLD_CONFIG.INTERACTION_RANGE;

    if (direction === "up") focusY -= interactRange;
    if (direction === "down") focusY += interactRange;
    if (direction === "left") focusX -= interactRange;
    if (direction === "right") focusX += interactRange;

    const focusCol = Math.floor((focusX + 32) / WORLD_CONFIG.TILE_SIZE_VIRTUAL);
    const focusRow = Math.floor((focusY + 32) / WORLD_CONFIG.TILE_SIZE_VIRTUAL);
    let foundChair = false;


    const tileInfo = getTileAt(mapData.layers, focusCol, focusRow);

    if (tileInfo) {
      const { gid } = tileInfo;
      const tileData = getTileDataForGid(gid, mapData);
      
      // Seat detection: Check GID ranges OR tileset name
      const tilesetName = tileData?.tilesetName?.toLowerCase() || "";
      const isSeat = 
        tilesetName.includes("seat") || 
        tilesetName.includes("chair") ||
        (gid >= 1375 && gid <= 1557) || // WA_Seats range in combined map
        (gid >= 1400 && gid <= 1550) || // Legacy range
        (gid >= 1810 && gid <= 1850) || 
        (gid >= 1860 && gid <= 1890) || 
        gid === 2306 || gid === 2322;

      if (isSeat) {
        setIsSitting(true);
        sitOrigin.current = { x, y };

        // Infer chair direction from GID (simplified mapping for WA_Seats)
        // Row-based orientation in WA_Seats:
        // GIDs 1375-1387 (Row 0): Facing Down (Front)
        // GIDs 1388-1413 (Row 1-2): Facing Side (Left/Right)
        // GIDs 1414-1439 (Row 3-4): Facing Up (Back)
        
        let sitDir: DirString = direction; // Default to current
        if (gid >= 1375 && gid <= 1557) {
          const localId = gid - 1375;
          const row = Math.floor(localId / 13);
          
          // Refined WA_Seats mapping:
          // Row 0: Facing Down
          // Row 1: Facing Up
          // Row 2: Facing Left
          // Row 3: Facing Right
          // (Patterns often repeat every 4 rows for different chair styles)
          const dirPattern: DirString[] = ["down", "up", "left", "right"];
          sitDir = dirPattern[row % 4] || direction;
        }
        setDirection(sitDir);

        // Center the player on the tile and adjust Y for sitting depth
        setX(focusCol * WORLD_CONFIG.TILE_SIZE_VIRTUAL);
        setY(focusRow * WORLD_CONFIG.TILE_SIZE_VIRTUAL + 8); 
        foundChair = true;
      }
    }

    if (!foundChair && currentZone) {
      onInteract?.();
    }
  };

  const handlePhoneToggle = () => {
    if (isPaused) return;
    setIsPhoneOut(prev => {
      const newState = !prev;
      if (onPhoneToggle) onPhoneToggle(newState);
      return newState;
    });
  };

  const keys = usePlayerInput(handleInteraction, handlePhoneToggle);

  // 4. Game Loop
  useTick((delta) => {
    if (isPaused) {
      if (isMoving) setIsMoving(false);
      return;
    }

    // Auto-stand logic
    if (isSitting) {
      // Sync sitting/phone state if it hasn't been synced yet
      if (isSitting !== lastSyncSit.current || isPhoneOut !== lastSyncPhone.current) {
        updatePosition(x, y, direction, isSitting, selectedCharacter, customDisplayName || undefined, isPhoneOut);
        lastSyncSit.current = isSitting;
        lastSyncPhone.current = isPhoneOut;
      }

      const isPressingMove =
        keys.has("w") ||
        keys.has("a") ||
        keys.has("s") ||
        keys.has("d") ||
        keys.has("arrowup") ||
        keys.has("arrowdown") ||
        keys.has("arrowleft") ||
        keys.has("arrowright");
      if (isPressingMove) {
        setIsSitting(false);
        if (sitOrigin.current) {
          setX(sitOrigin.current.x);
          setY(sitOrigin.current.y);
          sitOrigin.current = null;
        }
      }
      return;
    }

    // Movement calculation
    let moveX = 0;
    let moveY = 0;
    const speed = WORLD_CONFIG.MOVEMENT_SPEED;

    if (keys.has("w") || keys.has("arrowup")) moveY -= 1;
    if (keys.has("s") || keys.has("arrowdown")) moveY += 1;
    if (keys.has("a") || keys.has("arrowleft")) moveX -= 1;
    if (keys.has("d") || keys.has("arrowright")) moveX += 1;

    let finalX = x;
    let finalY = y;

    if (moveX !== 0 || moveY !== 0) {
      setIsMoving(true);
      
      // Normalize diagonal movement
      if (moveX !== 0 && moveY !== 0) {
        const length = Math.sqrt(moveX * moveX + moveY * moveY);
        moveX /= length;
        moveY /= length;
      }

      const dx = moveX * speed * delta;
      const dy = moveY * speed * delta;
      
      setDirection((prevDir) => getNewDirection(dx, dy, prevDir));

      // Apply collision independently for sliding
      const intendedX = x + dx;
      const intendedY = y + dy;

      if (!checkCollision(intendedX, y)) {
        finalX = intendedX;
      }
      
      if (!checkCollision(finalX, intendedY)) {
        finalY = intendedY;
      }

      if (finalX !== x || finalY !== y) {
        setX(finalX);
        setY(finalY);
      }
    } else {
      setIsMoving(false);
    }

    // Camera & Sync
    updateCamera(finalX, finalY, delta);

    if (finalX !== x || finalY !== y || isSitting !== lastSyncSit.current || isPhoneOut !== lastSyncPhone.current) {
      updatePosition(finalX, finalY, direction, isSitting, selectedCharacter, customDisplayName || undefined, isPhoneOut);
      lastSyncSit.current = isSitting;
      lastSyncPhone.current = isPhoneOut;
    }

    // Zone & Proximity Check
    const zone = checkZoneCollision(finalX, finalY, zones);
    
    // Seat Proximity Check (Raycast forward to show popup)
    let checkX = finalX;
    let checkY = finalY;
    const checkRange = 40; // Detection range for popup

    if (direction === "up") checkY -= checkRange;
    else if (direction === "down") checkY += checkRange;
    else if (direction === "left") checkX -= checkRange;
    else if (direction === "right") checkX += checkRange;

    const cCol = Math.floor((checkX + 32) / WORLD_CONFIG.TILE_SIZE_VIRTUAL);
    const cRow = Math.floor((checkY + 32) / WORLD_CONFIG.TILE_SIZE_VIRTUAL);
    
    const tileNearby = getTileAt(mapData.layers, cCol, cRow);
    let isNearbyChair = false;
    if (tileNearby && !isSitting) {
      const tData = getTileDataForGid(tileNearby.gid, mapData);
      const tName = tData?.tilesetName?.toLowerCase() || "";
      isNearbyChair = tName.includes("seat") || tName.includes("chair") || (tileNearby.gid >= 1375 && tileNearby.gid <= 1557);
    }

    if (isNearbyChair !== nearbyChair) {
      setNearbyChair(isNearbyChair);
    }

    // Combine real zones with synthetic seat zone
    let effectiveZone = zone;
    if (isNearbyChair && !isSitting) {
      // Prioritize chair popup even if inside another zone
      effectiveZone = { 
        id: "seat", 
        label: "Chair", 
        x: 0, 
        y: 0, 
        width: 0, 
        height: 0,
        description: "Interactive furniture"
      };
    }

    if (effectiveZone?.id !== currentZone?.id) {
      setCurrentZone(effectiveZone);
      onZoneChange?.(effectiveZone);
    }

    // Teleportation logic for merged map
    const floorLayer = mapData.layers.find(l => l.name === "floorLayer") as any;
    if (floorLayer && floorLayer.objects) {
      const scale = WORLD_CONFIG.TILE_SIZE_VIRTUAL / 32; // Usually 2
      for (const obj of floorLayer.objects) {
        const ox = obj.x * scale;
        const oy = obj.y * scale;
        const ow = obj.width * scale;
        const oh = obj.height * scale;

        // Check if player center is within object
        const px = finalX + 32;
        const py = finalY + 32;

        if (px >= ox && px <= ox + ow && py >= oy && py <= oy + oh) {
          if (obj.name === "to-conference") {
            // Teleport to conference start (from-office in conference)
            // Original from-office was at x:640, y:128. In merged (offset 100): x:640, y:3200+128=3328
            setX(640 * scale);
            setY(3328 * scale);
            return; // Skip rest of tick to prevent immediate re-teleport
          } else if (obj.name === "to-office") {
            // Teleport back to office start (from-conference in office)
            // Original from-conference was at x:64, y:544
            setX(128 * scale);
            setY(544 * scale);
            return;
          }
        }
      }
    }

    const now = Date.now();
    if (now - lastNearbyTrigger.current > 500) {
      let foundPlayerId: string | null = null;
      for (const [id, remoteUser] of Object.entries(players)) {
        const dist = Math.sqrt(
          Math.pow(finalX - remoteUser.x, 2) + Math.pow(finalY - remoteUser.y, 2),
        );
        if (dist < WORLD_CONFIG.PROXIMITY_RANGE) {
          foundPlayerId = id;
          break;
        }
      }
      if (foundPlayerId !== nearbyPlayerId) {
        setNearbyPlayerId(foundPlayerId);
        onNearbyPlayer?.(foundPlayerId);
      }
      lastNearbyTrigger.current = now;
    }
  });

  return (
    <AnimatedPlayerSprite
      x={x}
      y={y}
      direction={direction}
      isMoving={isMoving}
      isSitting={isSitting}
      isPhoneOut={isPhoneOut}
      character={selectedCharacter}
      emote={localEmote}
      displayName={customDisplayName}
      chatBubble={localChatBubble || null}
    />
  );
};
