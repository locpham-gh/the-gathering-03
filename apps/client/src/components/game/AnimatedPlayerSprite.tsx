import React, { useState, useRef } from "react";
import { Sprite, useTick } from "@pixi/react";
import { DIR_COL_OFFSET, getCharacterTexture } from "./lib/tileUtils";
import type { DirString } from "./lib/gameTypes";

interface AnimatedPlayerSpriteProps {
  x: number;
  y: number;
  direction: DirString;
  isMoving: boolean;
  isSitting?: boolean;
  tint?: number;
  character2d?: string;
}

export const AnimatedPlayerSprite: React.FC<AnimatedPlayerSpriteProps> = ({
  x,
  y,
  direction,
  isMoving,
  isSitting = false,
  tint = 0xffffff,
  character2d,
}) => {
  const [frame, setFrame] = useState(0);
  const timeAcc = useRef(0);

  // Animation logic loop
  useTick((delta) => {
    timeAcc.current += delta;
    const tickSpeed = isMoving ? 5 : 8;

    if (timeAcc.current > tickSpeed) {
      timeAcc.current = 0;
      setFrame((prev) => (prev >= 5 ? 0 : prev + 1));
    }
  });

  let baseCol = DIR_COL_OFFSET[direction];
  // Row 1 (index 1) = Idle, Row 2 (index 2) = Walking
  let row = isMoving ? 2 : 1;

  if (isSitting) {
    row = 5;
    if (direction === "left") {
      baseCol = 6;
    } else {
      baseCol = 0;
    }
  }

  const col = baseCol + frame;
  const texture = getCharacterTexture(character2d, row, col);

  return (
    <Sprite
      texture={texture}
      x={Math.round(x)}
      y={Math.round(y - 64)}
      width={64}
      height={128}
      anchor={0}
      zIndex={Math.round(y)}
      tint={tint}
    />
  );
};
