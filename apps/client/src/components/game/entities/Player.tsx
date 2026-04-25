import React, { useState, useRef } from "react";
import { useTick } from "@pixi/react";
import * as PIXI from "pixi.js";

// Libs & Types
import { WORLD_CONFIG } from "../lib/constants";
import { getNewDirection } from "../lib/tileUtils";
import { ZONES, checkZoneCollision } from "../core/zones";
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
  onZoneChange?: (zone: Zone | null) => void;
  isPaused: boolean;
  onInteract?: () => void;
  updatePosition: (x: number, y: number, isSitting?: boolean, character?: string, customName?: string) => void;
  players: Record<string, RemotePlayer>;
  onNearbyPlayer?: (playerId: string | null) => void;
  worldRef: React.RefObject<PIXI.Container>;
  screenW: number;
  screenH: number;
  selectedCharacter: string;
  customDisplayName?: string;
}

export const Player: React.FC<PlayerProps> = ({
  mapData,
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
}) => {
  // 1. Local State
  // Default to office_2 spawn (approx middle-bottom)
  const initialX = mapData.width === 31 ? 512 : WORLD_CONFIG.PLAYER_SPAWN_X;
  const initialY = mapData.width === 31 ? 1000 : WORLD_CONFIG.PLAYER_SPAWN_Y;
  
  const [x, setX] = useState(initialX);
  const [y, setY] = useState(initialY);
  const [direction, setDirection] = useState<DirString>("down");
  const [isMoving, setIsMoving] = useState(false);
  const [isSitting, setIsSitting] = useState(false);
  const [currentZone, setCurrentZone] = useState<Zone | null>(null);
  const [nearbyPlayerId, setNearbyPlayerId] = useState<string | null>(null);

  // 2. Refs for physics/sync
  const sitOrigin = useRef<{ x: number; y: number } | null>(null);
  const lastNearbyTrigger = useRef<number>(0);
  const lastSyncSit = useRef(isSitting);

  // 3. Custom Logic Hooks
  const { checkCollision } = useCollision(mapData);
  const { updateCamera } = useCamera(
    worldRef, 
    screenW, 
    screenH, 
    mapData.width * WORLD_CONFIG.TILE_SIZE_VIRTUAL, 
    mapData.height * WORLD_CONFIG.TILE_SIZE_VIRTUAL
  );

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

    const layer4 = mapData.layers.find(
      (l) =>
        l.name === "Tile Layer 4" ||
        l.name === "Furniture" ||
        l.name === "object",
    );

    let foundChair = false;
    if (layer4 && focusCol >= 0 && focusRow >= 0) {
      const tileIndex = focusRow * mapData.width + focusCol;
      const rawGid = layer4.data[tileIndex] & 0x1fffffff;

      // Chair logic (LocalID 542 context)
      if (rawGid >= 392 && rawGid - 392 === 542) {
        setIsSitting(true);
        sitOrigin.current = { x, y };
        setX(focusCol * WORLD_CONFIG.TILE_SIZE_VIRTUAL);
        setY(focusRow * WORLD_CONFIG.TILE_SIZE_VIRTUAL);
        foundChair = true;
      }
    }

    if (!foundChair && currentZone) {
      onInteract?.();
    }
  };

  const keys = usePlayerInput(handleInteraction);

  // 4. Game Loop
  useTick((delta) => {
    if (isPaused) {
      if (isMoving) setIsMoving(false);
      return;
    }

    // Auto-stand logic
    if (isSitting) {
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
    let nextX = x;
    let nextY = y;
    const speed = WORLD_CONFIG.MOVEMENT_SPEED;

    if (keys.has("w") || keys.has("arrowup")) nextY -= speed * delta;
    if (keys.has("s") || keys.has("arrowdown")) nextY += speed * delta;
    if (keys.has("a") || keys.has("arrowleft")) nextX -= speed * delta;
    if (keys.has("d") || keys.has("arrowright")) nextX += speed * delta;

    const dx = nextX - x;
    const dy = nextY - y;

    if (dx !== 0 || dy !== 0) {
      setIsMoving(true);
      setDirection((prevDir) => getNewDirection(dx, dy, prevDir));

      // Apply collision
      if (!checkCollision(nextX, nextY)) {
        setX(nextX);
        setY(nextY);
      }
    } else {
      setIsMoving(false);
    }

    // Camera & Sync
    updateCamera(x, y, delta);

    if (nextX !== x || nextY !== y || isSitting !== lastSyncSit.current) {
      updatePosition(nextX, nextY, isSitting, selectedCharacter, customDisplayName || undefined);
      lastSyncSit.current = isSitting;
    }

    // Zone & Proximity Check
    const zone = checkZoneCollision(nextX, nextY, ZONES);
    if (zone !== currentZone) {
      setCurrentZone(zone);
      onZoneChange?.(zone);
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
        const px = nextX + 32;
        const py = nextY + 32;

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
          Math.pow(nextX - remoteUser.x, 2) + Math.pow(nextY - remoteUser.y, 2),
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
      character={selectedCharacter}
    />
  );
};
