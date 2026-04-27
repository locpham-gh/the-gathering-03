import React, { useState } from "react";
import { useTick } from "@pixi/react";
import { AnimatedPlayerSprite } from "./AnimatedPlayerSprite";
import { getNewDirection } from "../lib/tileUtils";
import type { DirString } from "../lib/gameTypes";
import type { RemotePlayer } from "../../../hooks/useMultiplayer";

interface OtherPlayerProps {
  player: RemotePlayer;
}

export const OtherPlayer: React.FC<OtherPlayerProps> = ({ player }) => {
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
      setDirection((prevDir) => getNewDirection(dx, dy, prevDir));
    } else {
      if (isMoving) setIsMoving(false);
      // If sitting, use the explicit direction provided by the server
      if (player.isSitting && player.direction) {
        setDirection(player.direction as DirString);
      }
    }

    setX((prev) => prev + dx * 0.1 * delta);
    setY((prev) => prev + dy * 0.1 * delta);
  });

  return (
    <AnimatedPlayerSprite
      x={x}
      y={y}
      direction={direction}
      isMoving={isMoving}
      isSitting={player.isSitting}
      character={player.character || "Adam"}
      emote={player.emote}
    />
  );
};
