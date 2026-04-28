import { useState, useEffect, useRef } from "react";
import type { DirString } from "../../../types/game";

export function usePlayerState(
  customDisplayName: string | undefined,
  roomId: string | undefined,
  mapWidth: number,
  initialServerPosition: { x: number; y: number } | null | undefined,
  spawnPoint: { x: number; y: number }
) {
  const posKey = `savedPos_${customDisplayName || "guest"}_${roomId || mapWidth}`;

  const getInitialPosition = () => {
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
    return spawnPoint;
  };

  const initialPos = getInitialPosition();
  const [x, setX] = useState(initialPos.x);
  const [y, setY] = useState(initialPos.y);
  const [direction, setDirection] = useState<DirString>("down");
  const [isMoving, setIsMoving] = useState(false);
  const [isSitting, setIsSitting] = useState(false);
  const [isPhoneOut, setIsPhoneOut] = useState(false);

  const sitOriginRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    localStorage.setItem(posKey, JSON.stringify({ x, y }));
  }, [x, y, posKey]);

  return {
    x, setX,
    y, setY,
    direction, setDirection,
    isMoving, setIsMoving,
    isSitting, setIsSitting,
    isPhoneOut, setIsPhoneOut,
    sitOrigin: sitOriginRef
  };
}
