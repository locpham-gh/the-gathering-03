import { useState, useRef } from "react";
import { WORLD_CONFIG } from "../lib/constants";
import type { RemotePlayer } from "../../../types/game";

export function useNearbySystem() {
  const [nearbyChair, setNearbyChair] = useState(false);
  const [nearbyPlayerId, setNearbyPlayerId] = useState<string | null>(null);
  const lastNearbyTrigger = useRef<number>(0);

  const checkNearbyPlayers = (x: number, y: number, players: Record<string, RemotePlayer>, onNearbyPlayer?: (id: string | null) => void) => {
    const now = Date.now();
    if (now - lastNearbyTrigger.current > 500) {
      let foundPlayerId: string | null = null;
      for (const [id, remoteUser] of Object.entries(players)) {
        const dist = Math.sqrt(
          Math.pow(x - remoteUser.x, 2) + Math.pow(y - remoteUser.y, 2),
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
  };

  return {
    nearbyChair,
    setNearbyChair,
    nearbyPlayerId,
    checkNearbyPlayers
  };
}
