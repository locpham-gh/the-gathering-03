import React, { useEffect, useState, useRef } from "react";
import { useTick } from "@pixi/react";
import * as PIXI from "pixi.js";

// Libs & Types
import { WORLD_CONFIG } from "./lib/constants";
import { getNewDirection } from "./lib/tileUtils";
import type { Zone } from "./zones";
import type { RemotePlayer } from "../../hooks/useMultiplayer";
import type { DirString, MapData } from "./lib/gameTypes";

// Hooks
import { usePlayerInput } from "./hooks/usePlayerInput";
import { useCollision } from "./hooks/useCollision";
import { useCamera } from "./hooks/useCamera";

// Components
import { AnimatedPlayerSprite } from "./AnimatedPlayerSprite";
import { ZONES, checkZoneCollision } from "./zones";

interface PlayerProps {
  mapData: MapData;
  onZoneChange?: (zone: Zone | null) => void;
  isPaused: boolean;
  onInteract?: () => void;
  updatePosition: (x: number, y: number, isSitting?: boolean) => number | null;
  players: Record<string, RemotePlayer>;
  selfPlayerId?: string | null;
  onNearbyPlayer?: (playerId: string | null) => void;
  worldRef: React.RefObject<PIXI.Container>;
  screenW: number;
  screenH: number;
  zoom: number;
  panOffset: { x: number; y: number };
  onViewportChange?: (next: { x: number; y: number; scale: number }) => void;
  onLocalPlayerRenderPosition?: (next: { x: number; y: number }) => void;
  character2d?: string;
  authoritativePosition?: RemotePlayer | null;
  cameraFocusTarget?: { x: number; y: number; id: number } | null;
  showCameraBadge?: boolean;
}

export const Player: React.FC<PlayerProps> = ({
  mapData,
  onZoneChange,
  isPaused,
  onInteract,
  updatePosition,
  players,
  selfPlayerId,
  onNearbyPlayer,
  worldRef,
  screenW,
  screenH,
  zoom,
  panOffset,
  onViewportChange,
  onLocalPlayerRenderPosition,
  character2d,
  authoritativePosition,
  cameraFocusTarget,
  showCameraBadge = false,
}) => {
  // 1. Local State
  const [x, setX] = useState(WORLD_CONFIG.PLAYER_SPAWN_X);
  const [y, setY] = useState(WORLD_CONFIG.PLAYER_SPAWN_Y);
  const [direction, setDirection] = useState<DirString>("down");
  const [isMoving, setIsMoving] = useState(false);
  const [isSitting, setIsSitting] = useState(false);
  const [currentZone, setCurrentZone] = useState<Zone | null>(null);
  const [nearbyPlayerId, setNearbyPlayerId] = useState<string | null>(null);

  // 2. Refs for physics/sync
  const sitOrigin = useRef<{ x: number; y: number } | null>(null);
  const lastNearbyTrigger = useRef<number>(0);
  const lastSyncSit = useRef(isSitting);
  const focusPointRef = useRef<{ x: number; y: number } | null>(null);
  const focusUntilRef = useRef(0);
  const hasSyncedAuthoritativeRef = useRef(false);
  const pendingPredictionsRef = useRef<
    Array<{ seq: number; x: number; y: number; isSitting?: boolean }>
  >([]);
  const lastAckSeqRef = useRef(0);

  // 3. Custom Logic Hooks
  const { checkCollision } = useCollision(mapData);
  const { updateCamera } = useCamera(
    worldRef,
    screenW,
    screenH,
    zoom,
    panOffset,
    {
      width: mapData.width * WORLD_CONFIG.TILE_SIZE_VIRTUAL,
      height: mapData.height * WORLD_CONFIG.TILE_SIZE_VIRTUAL,
    },
    onViewportChange,
  );

  useEffect(() => {
    if (!checkCollision(x, y)) return;

    // Try nearby tiles to avoid spawning inside blocked furniture/walls.
    const step = WORLD_CONFIG.TILE_SIZE_VIRTUAL;
    const maxRadius = 6;
    for (let radius = 1; radius <= maxRadius; radius += 1) {
      for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
        for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
          if (Math.abs(offsetX) !== radius && Math.abs(offsetY) !== radius) continue;
          const candidateX = x + offsetX * step;
          const candidateY = y + offsetY * step;
          if (!checkCollision(candidateX, candidateY)) {
            setX(candidateX);
            setY(candidateY);
            return;
          }
        }
      }
    }
  }, [x, y, checkCollision]);

  useEffect(() => {
    if (!cameraFocusTarget) return;
    focusPointRef.current = { x: cameraFocusTarget.x, y: cameraFocusTarget.y };
    focusUntilRef.current = Date.now() + 1500;
  }, [cameraFocusTarget?.id, cameraFocusTarget]);

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
    const isPressingMove =
      keys.has("w") ||
      keys.has("a") ||
      keys.has("s") ||
      keys.has("d") ||
      keys.has("arrowup") ||
      keys.has("arrowdown") ||
      keys.has("arrowleft") ||
      keys.has("arrowright");

    if (authoritativePosition) {
      const ackSeq = authoritativePosition.authoritativeSeq || 0;
      if (ackSeq > lastAckSeqRef.current) {
        lastAckSeqRef.current = ackSeq;
        pendingPredictionsRef.current = pendingPredictionsRef.current.filter(
          (item) => item.seq > ackSeq,
        );
      }

      const replayTarget =
        pendingPredictionsRef.current.length > 0
          ? pendingPredictionsRef.current[pendingPredictionsRef.current.length - 1]
          : authoritativePosition;
      const targetX = replayTarget.x;
      const targetY = replayTarget.y;

      // If authoritative target lands inside a blocked tile locally (furniture/wall),
      // trust local collision to avoid jittering against obstacles.
      const authoritativeBlocked = checkCollision(targetX, targetY);
      const safeTargetX = authoritativeBlocked ? x : targetX;
      const safeTargetY = authoritativeBlocked ? y : targetY;

      const correctedDriftX = safeTargetX - x;
      const correctedDriftY = safeTargetY - y;
      const driftDist = Math.sqrt(
        correctedDriftX * correctedDriftX + correctedDriftY * correctedDriftY,
      );
      if (!hasSyncedAuthoritativeRef.current || driftDist > 220) {
        hasSyncedAuthoritativeRef.current = true;
        setX(safeTargetX);
        setY(safeTargetY);
      } else if (driftDist > 6) {
        // While user is actively moving, avoid frequent tiny pull-backs that cause jitter.
        if (isPressingMove && driftDist < 90) {
          // keep predicted motion smooth
        } else {
        const correction = isPressingMove ? 0.12 : 0.22;
        setX((prev) => prev + correctedDriftX * correction);
        setY((prev) => prev + correctedDriftY * correction);
        }
      } else if (!isPressingMove && driftDist > 0) {
        // Prevent micro-drift when user has already released movement keys.
        setX(safeTargetX);
        setY(safeTargetY);
      }
    }

    if (isPaused) {
      if (isMoving) setIsMoving(false);
      return;
    }

    // Auto-stand logic
    if (isSitting) {
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

    // Camera & Sync (supports temporary map focus from mini-map clicks)
    const focusPoint = focusPointRef.current;
    if (focusPoint && Date.now() < focusUntilRef.current) {
      updateCamera(focusPoint.x, focusPoint.y, delta);
    } else {
      focusPointRef.current = null;
      updateCamera(x, y, delta);
    }

    const actualX = checkCollision(nextX, nextY) ? x : nextX;
    const actualY = checkCollision(nextX, nextY) ? y : nextY;
    if (actualX !== x || actualY !== y || isSitting !== lastSyncSit.current) {
      const sentSeq = updatePosition(actualX, actualY, isSitting);
      if (sentSeq) {
        pendingPredictionsRef.current.push({
          seq: sentSeq,
          x: actualX,
          y: actualY,
          isSitting,
        });
        if (pendingPredictionsRef.current.length > 60) {
          pendingPredictionsRef.current.splice(0, pendingPredictionsRef.current.length - 60);
        }
      }
      lastSyncSit.current = isSitting;
    }

    // Zone & Proximity Check
    const zone = checkZoneCollision(actualX, actualY, ZONES);
    if (zone !== currentZone) {
      setCurrentZone(zone);
      onZoneChange?.(zone);
    }

    const now = Date.now();
    if (now - lastNearbyTrigger.current > 500) {
      let foundPlayerId: string | null = null;
      for (const [id, remoteUser] of Object.entries(players)) {
        if (id === selfPlayerId) continue;
        if (!remoteUser.userId) continue;
        const dist = Math.sqrt(
          Math.pow(actualX - remoteUser.x, 2) + Math.pow(actualY - remoteUser.y, 2),
        );
        if (dist < WORLD_CONFIG.PROXIMITY_RANGE) {
          foundPlayerId = remoteUser.userId;
          break;
        }
      }
      if (foundPlayerId !== nearbyPlayerId) {
        setNearbyPlayerId(foundPlayerId);
        onNearbyPlayer?.(foundPlayerId);
      }
      lastNearbyTrigger.current = now;
    }

    onLocalPlayerRenderPosition?.({ x, y });
  });

  return (
    <AnimatedPlayerSprite
      x={x}
      y={y}
      direction={direction}
      isMoving={isMoving}
      isSitting={isSitting}
      character2d={character2d}
      showCameraBadge={showCameraBadge}
    />
  );
};
