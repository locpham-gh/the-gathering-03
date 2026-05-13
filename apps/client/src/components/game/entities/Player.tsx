import React, { useState, useRef, useMemo } from "react";
import { useTick } from "@pixi/react";
import * as PIXI from "pixi.js";

// Libs & Types
import { WORLD_CONFIG } from "../lib/constants";
import { getNewDirection, getTileDataForGid, getTileAt, getMapSpawnPoint } from "../lib/tileUtils";
import { getZonesForMap, checkZoneCollision } from "../core/zones";
import type { Zone } from "../core/zones";
import type { RemotePlayer, MapData, DirString } from "../../../types/game";

// Hooks
import { usePlayerInput } from "../hooks/usePlayerInput";
import { useCollision } from "../hooks/useCollision";
import { useCamera } from "../hooks/useCamera";
import { usePlayerState } from "../hooks/usePlayerState";
import { useNearbySystem } from "../hooks/useNearbySystem";
import { useMapTeleport } from "../hooks/useMapTeleport";
import { useFacePresence } from "../../../hooks/useFacePresence";

// Components
import { AnimatedPlayerSprite } from "./AnimatedPlayerSprite";

interface PlayerProps {
  mapData: MapData;
  mapType: string;
  onZoneChange?: (zone: Zone | null) => void;
  isPaused: boolean;
  onInteract?: () => void;
  onPhoneToggle?: (isOpen: boolean) => void;
  updatePosition: (x: number, y: number, direction: string, isSitting?: boolean, character?: string, customName?: string, isPhoneOut?: boolean, isBusy?: boolean) => void;
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
  onCameraTransform?: (x: number, y: number) => void;
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
  onCameraTransform,
}) => {
  const zones = useMemo(() => getZonesForMap(mapType), [mapType]);
  const spawnPoint = useMemo(() => getMapSpawnPoint(mapData), [mapData]);

  const {
    x, setX, y, setY, direction, setDirection, isMoving, setIsMoving,
    isSitting, setIsSitting, isPhoneOut, setIsPhoneOut, sitOrigin: sitOriginRef
  } = usePlayerState(customDisplayName, roomId, mapData.width, initialServerPosition, spawnPoint);

  const { nearbyChair, setNearbyChair, checkNearbyPlayers } = useNearbySystem();
  const { checkTeleport } = useMapTeleport(mapData, setX, setY);
  const { presence: facePresence } = useFacePresence();
  const [currentZone, setCurrentZone] = useState<Zone | null>(null);
  const isBusy = facePresence === "absent";

  const { checkCollision } = useCollision(mapData);
  const { updateCamera } = useCamera(worldRef, screenW, screenH, 
    mapData.width * WORLD_CONFIG.TILE_SIZE_VIRTUAL, 
    mapData.height * WORLD_CONFIG.TILE_SIZE_VIRTUAL
  );

  const lastSyncSit = useRef(isSitting);
  const lastSyncPhone = useRef(isPhoneOut);
  const lastSyncBusy = useRef(isBusy);
  const seatedPhoneOpenRef = useRef(false);

  React.useEffect(() => {
    const handleSummon = (e: CustomEvent) => {
      const { x: targetX, y: targetY } = e.detail;
      setX(targetX);
      setY(targetY + 40); // slightly offset so they don't land exactly on the host
      setIsSitting(false);
      onZoneChange?.(null);
      setCurrentZone(null);
    };
    window.addEventListener("host-summon-all", handleSummon as EventListener);
    return () => window.removeEventListener("host-summon-all", handleSummon as EventListener);
  }, [setX, setY, setIsSitting, onZoneChange]);

  const handleInteraction = () => {
    if (isPaused) return;
    
    // If sitting and in an interactive zone (e.g. library), allow opening it without standing up
    if (isSitting && currentZone && currentZone.id !== "seat") {
      onInteract?.();
      return;
    }

    if (isSitting) {
      setIsSitting(false);
      if (sitOriginRef.current) {
        setX(sitOriginRef.current.x);
        setY(sitOriginRef.current.y);
        sitOriginRef.current = null;
      }
      return;
    }

    const centerX = x + 32;
    const centerY = y + 52; // Use actual collision center (bottom half) instead of y+32
    let focusX = centerX, focusY = centerY;
    const interactRange = WORLD_CONFIG.INTERACTION_RANGE;
    if (direction === "up") focusY -= interactRange;
    else if (direction === "down") focusY += interactRange;
    else if (direction === "left") focusX -= interactRange;
    else if (direction === "right") focusX += interactRange;

    const focusCol = Math.floor(focusX / WORLD_CONFIG.TILE_SIZE_VIRTUAL);
    const focusRow = Math.floor(focusY / WORLD_CONFIG.TILE_SIZE_VIRTUAL);
    const tileInfo = getTileAt(mapData.layers, focusCol, focusRow, mapData.width);

    const playerCol = Math.floor(centerX / WORLD_CONFIG.TILE_SIZE_VIRTUAL);
    const playerRow = Math.floor(centerY / WORLD_CONFIG.TILE_SIZE_VIRTUAL);
    const playerTileInfo = getTileAt(mapData.layers, playerCol, playerRow, mapData.width);

    const isSeatTile = (info: any) => {
      if (!info) return false;
      const td = getTileDataForGid(info.gid, mapData);
      const name = td?.tilesetName?.toLowerCase() || "";
      return name.includes("seat") || name.includes("chair") || (info.gid >= 1375 && info.gid <= 1557);
    };

    let targetCol = -1;
    let targetRow = -1;
    let foundSeat = false;

    // Prioritize the tile the player is currently standing on
    if (isSeatTile(playerTileInfo)) {
      targetCol = playerCol;
      targetRow = playerRow;
      foundSeat = true;
    } else if (isSeatTile(tileInfo)) {
      // Fallback to the tile the player is facing
      targetCol = focusCol;
      targetRow = focusRow;
      foundSeat = true;
    }

    if (foundSeat) {
      if (isPhoneOut) {
        setIsPhoneOut(false);
      }
      onPhoneToggle?.(false);
      seatedPhoneOpenRef.current = false;
      setIsSitting(true);
      sitOriginRef.current = { x, y };
      setX(targetCol * WORLD_CONFIG.TILE_SIZE_VIRTUAL);
      setY(targetRow * WORLD_CONFIG.TILE_SIZE_VIRTUAL + 8);
      setNearbyChair(false);

      // Clear zone overlay so "Press E to sit" popup disappears
      setCurrentZone(null);
      onZoneChange?.(null);

      // --- SMART AUTO-FACE LOGIC ---
      const getAllDataLayers = (layers: any[]): any[] => {
        let result: any[] = [];
        for (const l of layers) {
          if (l.layers) result = result.concat(getAllDataLayers(l.layers));
          else if (l.data) result.push(l);
        }
        return result;
      };
      
      const allLayers = getAllDataLayers(mapData.layers);
      const solidLayers = allLayers.filter((l: any) => {
        const n = l.name?.toLowerCase() || "";
        return n.includes("collision") || (!n.includes("floor") && !n.includes("ground") && !n.includes("above") && n !== "tile layer 1" && n !== "start");
      });

      const isSolidAt = (col: number, row: number): boolean => {
        for (const layer of solidLayers) {
          if (!layer.data) continue;
          const idx = row * mapData.width + col;
          if (idx >= 0 && idx < layer.data.length) {
            const gid = layer.data[idx] & 0x1fffffff;
            if (gid !== 0) {
              const td = getTileDataForGid(gid, mapData);
              const tsn = td?.tilesetName?.toLowerCase() || "";
              const isChair = tsn.includes("seat") || tsn.includes("chair") || tsn.includes("sofa") || tsn.includes("couch") || (gid >= 1375 && gid <= 1557);
              if (!isChair) return true;
            }
          }
        }
        return false;
      };

      // Determine if the seat is a sofa/couch (they face empty space instead of solid tables)
      let isSofa = false;
      const seatInfo = playerTileInfo || tileInfo;
      if (seatInfo) {
        const td = getTileDataForGid(seatInfo.gid, mapData);
        const tsn = td?.tilesetName?.toLowerCase() || "";
        if (tsn.includes("sofa") || tsn.includes("couch")) isSofa = true;
      }

      const dirs: { dir: string; col: number; row: number }[] = [
        { dir: "up", col: targetCol, row: targetRow - 1 },
        { dir: "down", col: targetCol, row: targetRow + 1 },
        { dir: "left", col: targetCol - 1, row: targetRow },
        { dir: "right", col: targetCol + 1, row: targetRow },
      ];

      const solidDirs = dirs.filter(d => isSolidAt(d.col, d.row));
      const emptyDirs = dirs.filter(d => !isSolidAt(d.col, d.row));

      if (isSofa) {
        // Sofas face the open room (empty space)
        if (emptyDirs.some(d => d.dir === direction)) {
          // Keep current direction if it points to empty space
        } else if (emptyDirs.length > 0) {
          // Prefer down/right for couches usually, or just the first empty
          const pref = emptyDirs.find(d => d.dir === "down") || emptyDirs[0];
          setDirection(pref.dir as any);
        }
      } else {
        // Desk chairs face the desk (solid space)
        if (solidDirs.some(d => d.dir === direction)) {
          // Keep current direction if it points to a desk
        } else if (solidDirs.length === 1) {
          // Only one solid neighbor, must be the desk
          setDirection(solidDirs[0].dir as any);
        } else if (solidDirs.length > 1) {
          // Multiple solids (corner). Prefer up/left for tables usually.
          const pref = solidDirs.find(d => d.dir === "up") || solidDirs[0];
          setDirection(pref.dir as any);
        }
      }

      return;
    }
    if (currentZone) onInteract?.();
  };

  const handlePhoneToggle = () => {
    if (isPaused) return;
    // While sitting, open/close Nearby Chat UI only, but keep avatar pose stable.
    if (isSitting) {
      seatedPhoneOpenRef.current = !seatedPhoneOpenRef.current;
      onPhoneToggle?.(seatedPhoneOpenRef.current);
      return;
    }
    setIsPhoneOut((prev) => {
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

    // Always update camera and detect zones/proximity, even when sitting
    updateCamera(x, y, delta);
    const cx = worldRef.current?.x || 0;
    const cy = worldRef.current?.y || 0;
    onCameraTransform?.(cx, cy);
    document.documentElement.style.setProperty('--cam-x', `${cx}px`);
    document.documentElement.style.setProperty('--cam-y', `${cy}px`);
    document.documentElement.style.setProperty('--local-x', `${x}px`);
    document.documentElement.style.setProperty('--local-y', `${y}px`);
    const zone = checkZoneCollision(x, y, zones);
    checkNearbyPlayers(x, y, players, onNearbyPlayer);
    
    // Teleportation Check
    if (!isSitting && checkTeleport(x, y)) return;

    // Chair proximity detection — check tile player is on OR facing
    const centerX = x + 32;
    const centerY = y + 52;
    const interactRange = WORLD_CONFIG.INTERACTION_RANGE;
    let chairFocusX = centerX, chairFocusY = centerY;
    if (direction === "up") chairFocusY -= interactRange;
    else if (direction === "down") chairFocusY += interactRange;
    else if (direction === "left") chairFocusX -= interactRange;
    else if (direction === "right") chairFocusX += interactRange;
    
    const fCol = Math.floor(chairFocusX / WORLD_CONFIG.TILE_SIZE_VIRTUAL);
    const fRow = Math.floor(chairFocusY / WORLD_CONFIG.TILE_SIZE_VIRTUAL);
    const facingTile = getTileAt(mapData.layers, fCol, fRow, mapData.width);

    const pCol = Math.floor(centerX / WORLD_CONFIG.TILE_SIZE_VIRTUAL);
    const pRow = Math.floor(centerY / WORLD_CONFIG.TILE_SIZE_VIRTUAL);
    const playerTile = getTileAt(mapData.layers, pCol, pRow, mapData.width);

    let chairDetected = false;
    
    if (playerTile) {
      const td = getTileDataForGid(playerTile.gid, mapData);
      const tsName = td?.tilesetName?.toLowerCase() || "";
      chairDetected = tsName.includes("seat") || tsName.includes("chair") || (playerTile.gid >= 1375 && playerTile.gid <= 1557);
    }
    if (!chairDetected && facingTile) {
      const td = getTileDataForGid(facingTile.gid, mapData);
      const tsName = td?.tilesetName?.toLowerCase() || "";
      chairDetected = tsName.includes("seat") || tsName.includes("chair") || (facingTile.gid >= 1375 && facingTile.gid <= 1557);
    }
    if (chairDetected !== nearbyChair) setNearbyChair(chairDetected);

    let effectiveZone = zone;
    if (nearbyChair && !isSitting) {
      effectiveZone = { id: "seat", label: "Chair", x: 0, y: 0, width: 0, height: 0, description: "Interactive furniture" };
    }
    if (effectiveZone?.id !== currentZone?.id) {
      setCurrentZone(effectiveZone);
      onZoneChange?.(effectiveZone);
    }

    if (isSitting) {
      if (
        isSitting !== lastSyncSit.current ||
        isPhoneOut !== lastSyncPhone.current ||
        isBusy !== lastSyncBusy.current
      ) {
        updatePosition(
          x,
          y,
          direction,
          isSitting,
          selectedCharacter,
          customDisplayName || undefined,
          isPhoneOut,
          isBusy,
        );
        lastSyncSit.current = isSitting;
        lastSyncPhone.current = isPhoneOut;
        lastSyncBusy.current = isBusy;
      }
      const isPressingMove = keys.has("w") || keys.has("a") || keys.has("s") || keys.has("d") || keys.has("arrowup") || keys.has("arrowdown") || keys.has("arrowleft") || keys.has("arrowright");
      if (isPressingMove) {
        setIsSitting(false);
        seatedPhoneOpenRef.current = false;
        onPhoneToggle?.(false);
      }
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

    if (
      finalX !== x ||
      finalY !== y ||
      isSitting !== lastSyncSit.current ||
      isPhoneOut !== lastSyncPhone.current ||
      isBusy !== lastSyncBusy.current
    ) {
      updatePosition(
        finalX,
        finalY,
        direction,
        isSitting,
        selectedCharacter,
        customDisplayName || undefined,
        isPhoneOut,
        isBusy,
      );
      lastSyncSit.current = isSitting;
      lastSyncPhone.current = isPhoneOut;
      lastSyncBusy.current = isBusy;
    }
  });

  return (
    <AnimatedPlayerSprite
      x={x} y={y} direction={direction} isMoving={isMoving}
      isSitting={isSitting} isPhoneOut={isPhoneOut} character={selectedCharacter}
      emote={localEmote}
      displayName={customDisplayName}
      chatBubble={localChatBubble || null}
      isBusy={isBusy}
    />
  );
};

// Internal types and old code below have been removed as they are now in hooks or tileUtils.
