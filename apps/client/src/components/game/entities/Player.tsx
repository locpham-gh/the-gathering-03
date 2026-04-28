import React, { useState, useRef, useMemo } from "react";
import { useTick } from "@pixi/react";
import * as PIXI from "pixi.js";

// Libs & Types
import { WORLD_CONFIG } from "../lib/constants";
import { getNewDirection, getTileDataForGid, getTileAt, getMapSpawnPoint } from "../lib/tileUtils";
import { getZonesForMap, checkZoneCollision } from "../core/zones";
import type { Zone } from "../core/zones";
import type { RemotePlayer, MapData } from "../../../types/game";

// Hooks
import { usePlayerInput } from "../hooks/usePlayerInput";
import { useCollision } from "../hooks/useCollision";
import { useCamera } from "../hooks/useCamera";
import { usePlayerState } from "../hooks/usePlayerState";
import { useNearbySystem } from "../hooks/useNearbySystem";
import { useMapTeleport } from "../hooks/useMapTeleport";

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
  const spawnPoint = useMemo(() => getMapSpawnPoint(mapData), [mapData]);

  const {
    x, setX, y, setY, direction, setDirection, isMoving, setIsMoving,
    isSitting, setIsSitting, isPhoneOut, setIsPhoneOut, sitOrigin: sitOriginRef
  } = usePlayerState(customDisplayName, roomId, mapData.width, initialServerPosition, spawnPoint);

  const { nearbyChair, setNearbyChair, checkNearbyPlayers } = useNearbySystem();
  const { checkTeleport } = useMapTeleport(mapData, setX, setY);
  const [currentZone, setCurrentZone] = useState<Zone | null>(null);

  const { checkCollision } = useCollision(mapData);
  const { updateCamera } = useCamera(worldRef, screenW, screenH, 
    mapData.width * WORLD_CONFIG.TILE_SIZE_VIRTUAL, 
    mapData.height * WORLD_CONFIG.TILE_SIZE_VIRTUAL
  );

  const lastSyncSit = useRef(isSitting);
  const lastSyncPhone = useRef(isPhoneOut);

  const handleInteraction = () => {
    if (isPaused) return;
    if (isSitting) {
      setIsSitting(false);
      if (sitOriginRef.current) {
        setX(sitOriginRef.current.x);
        setY(sitOriginRef.current.y);
        sitOriginRef.current = null;
      }
      return;
    }

    let focusX = x, focusY = y;
    const interactRange = WORLD_CONFIG.INTERACTION_RANGE;
    if (direction === "up") focusY -= interactRange;
    else if (direction === "down") focusY += interactRange;
    else if (direction === "left") focusX -= interactRange;
    else if (direction === "right") focusX += interactRange;

    const focusCol = Math.floor((focusX + 32) / WORLD_CONFIG.TILE_SIZE_VIRTUAL);
    const focusRow = Math.floor((focusY + 32) / WORLD_CONFIG.TILE_SIZE_VIRTUAL);
    const tileInfo = getTileAt(mapData.layers, focusCol, focusRow, mapData.width);

    if (tileInfo) {
      const tileData = getTileDataForGid(tileInfo.gid, mapData);
      const tilesetName = tileData?.tilesetName?.toLowerCase() || "";
      const isSeat = tilesetName.includes("seat") || tilesetName.includes("chair") || (tileInfo.gid >= 1375 && tileInfo.gid <= 1557);

      if (isSeat) {
        setIsSitting(true);
        sitOriginRef.current = { x, y };
        setX(focusCol * WORLD_CONFIG.TILE_SIZE_VIRTUAL);
        setY(focusRow * WORLD_CONFIG.TILE_SIZE_VIRTUAL + 8);
        setNearbyChair(false);
        return;
      }
    }
    if (currentZone) onInteract?.();
  };

  const handlePhoneToggle = () => {
    if (isPaused) return;
    setIsPhoneOut(prev => {
      const newState = !prev;
      onPhoneToggle?.(newState);
      return newState;
    });
  };

  const keys = usePlayerInput(handleInteraction, handlePhoneToggle);

  useTick((delta) => {
    if (isPaused) {
      if (isMoving) setIsMoving(false);
      return;
    }

    if (isSitting) {
      if (isSitting !== lastSyncSit.current || isPhoneOut !== lastSyncPhone.current) {
        updatePosition(x, y, direction, isSitting, selectedCharacter, customDisplayName || undefined, isPhoneOut);
        lastSyncSit.current = isSitting;
        lastSyncPhone.current = isPhoneOut;
      }
      const isPressingMove = keys.has("w") || keys.has("a") || keys.has("s") || keys.has("d") || keys.has("arrowup") || keys.has("arrowdown") || keys.has("arrowleft") || keys.has("arrowright");
      if (isPressingMove) setIsSitting(false);
      return;
    }

    let moveX = 0, moveY = 0;
    if (keys.has("w") || keys.has("arrowup")) moveY -= 1;
    if (keys.has("s") || keys.has("arrowdown")) moveY += 1;
    if (keys.has("a") || keys.has("arrowleft")) moveX -= 1;
    if (keys.has("d") || keys.has("arrowright")) moveX += 1;

    let finalX = x, finalY = y;
    if (moveX !== 0 || moveY !== 0) {
      setIsMoving(true);
      if (moveX !== 0 && moveY !== 0) {
        const length = Math.sqrt(moveX * moveX + moveY * moveY);
        moveX /= length; moveY /= length;
      }
      const dx = moveX * WORLD_CONFIG.MOVEMENT_SPEED * delta;
      const dy = moveY * WORLD_CONFIG.MOVEMENT_SPEED * delta;
      setDirection((prev: DirString) => getNewDirection(dx, dy, prev));
      if (!checkCollision(x + dx, y)) finalX = x + dx;
      if (!checkCollision(finalX, y + dy)) finalY = y + dy;
      setX(finalX); setY(finalY);
    } else {
      setIsMoving(false);
    }

    updateCamera(finalX, finalY, delta);
    if (finalX !== x || finalY !== y || isSitting !== lastSyncSit.current || isPhoneOut !== lastSyncPhone.current) {
      updatePosition(finalX, finalY, direction, isSitting, selectedCharacter, customDisplayName || undefined, isPhoneOut);
      lastSyncSit.current = isSitting; lastSyncPhone.current = isPhoneOut;
    }

    const zone = checkZoneCollision(finalX, finalY, zones);
    checkNearbyPlayers(finalX, finalY, players, onNearbyPlayer);
    
    // Teleportation Check
    if (checkTeleport(finalX, finalY)) return;

    let effectiveZone = zone;
    if (nearbyChair && !isSitting) {
      effectiveZone = { id: "seat", label: "Chair", x: 0, y: 0, width: 0, height: 0, description: "Interactive furniture" };
    }
    if (effectiveZone?.id !== currentZone?.id) {
      setCurrentZone(effectiveZone);
      onZoneChange?.(effectiveZone);
    }
  });

  return (
    <AnimatedPlayerSprite
      x={x} y={y} direction={direction} isMoving={isMoving}
      isSitting={isSitting} isPhoneOut={isPhoneOut} character={selectedCharacter}
      emote={localEmote} displayName={customDisplayName} chatBubble={localChatBubble || null}
    />
  );
};

// Internal types and old code below have been removed as they are now in hooks or tileUtils.
