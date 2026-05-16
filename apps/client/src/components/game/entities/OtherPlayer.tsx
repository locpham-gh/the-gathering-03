import React, { useState } from "react";
import { useTick } from "@pixi/react";
import { AnimatedPlayerSprite } from "./AnimatedPlayerSprite";
import { getNewDirection } from "../lib/tileUtils";
import type { DirString } from "../../../types/game";
import type { RemotePlayer } from "../../../hooks/useMultiplayer";

interface OtherPlayerProps {
  player: RemotePlayer;
  worldRef?: React.RefObject<any>;
}

export const OtherPlayer: React.FC<OtherPlayerProps> = ({ player, worldRef }) => {
  const [x, setX] = useState(player.x);
  const [y, setY] = useState(player.y);

  const [direction, setDirection] = useState<DirString>("down");
  const [isMoving, setIsMoving] = useState(false);

  // Lerp smoothing
  useTick((delta) => {
    const dx = player.x - x;
    const dy = player.y - y;

    if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
      if (!isMoving) setIsMoving(true);
      setDirection((prevDir: DirString) => getNewDirection(dx, dy, prevDir));
    } else {
      if (isMoving) setIsMoving(false);
      // If sitting, use the explicit direction provided by the server
      if (player.isSitting && player.direction) {
        setDirection(player.direction as DirString);
      }
    }

    const newX = x + dx * 0.1 * delta;
    const newY = y + dy * 0.1 * delta;
    setX(newX);
    setY(newY);

    if (worldRef?.current) {
      const container = worldRef.current as any;
      if (!container.playerPositions) container.playerPositions = {};
      container.playerPositions[player.userId || player.id] = { x: newX, y: newY };
    }
  });

  return (
    <AnimatedPlayerSprite
      x={x}
      y={y}
      direction={direction}
      isMoving={isMoving}
      isSitting={player.isSitting}
      isPhoneOut={player.isPhoneOut}
      character={player.character || "Adam"}
      emote={player.emote}
      displayName={player.displayName}
      chatBubble={player.chatBubble?.text || null}
      status={player.status || (player.isBusy ? "busy" : "active")}
    />
  );
};
