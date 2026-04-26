import React, { useState, useRef, useEffect } from "react";
import { Sprite, useTick, Container, Text as PixiText } from "@pixi/react";
import * as PIXI from "pixi.js";
import { DIR_COL_OFFSET, getCharacterTexture } from "../lib/tileUtils";
import type { DirString } from "../lib/gameTypes";

interface AnimatedPlayerSpriteProps {
  x: number;
  y: number;
  direction: DirString;
  isMoving: boolean;
  isSitting?: boolean;
  character?: string;
  tint?: number;
  emote?: { id: string; timestamp: number } | null;
}

export const AnimatedPlayerSprite: React.FC<AnimatedPlayerSpriteProps> = ({
  x,
  y,
  direction,
  isMoving,
  isSitting = false,
  character = "Adam",
  tint = 0xffffff,
  emote = null,
}) => {
  const [frame, setFrame] = useState(0);
  const timeAcc = useRef(0);
  const [emoteState, setEmoteState] = useState<{ id: string; yOffset: number; alpha: number } | null>(null);

  useEffect(() => {
    if (emote) {
      setEmoteState({ id: emote.id, yOffset: -80, alpha: 1 });
    }
  }, [emote]);

  // Animation logic loop
  useTick((delta) => {
    timeAcc.current += delta;
    const tickSpeed = isMoving ? 5 : 8;

    if (timeAcc.current > tickSpeed) {
      timeAcc.current = 0;
      setFrame((prev) => (prev >= 5 ? 0 : prev + 1));
    }

    if (emoteState) {
      setEmoteState((prev) => {
        if (!prev) return null;
        const newY = prev.yOffset - 1 * delta;
        const newAlpha = prev.alpha - 0.02 * delta;
        if (newAlpha <= 0) return null;
        return { ...prev, yOffset: newY, alpha: newAlpha };
      });
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
  const texture = getCharacterTexture(row, col, character);

  return (
    <Container x={Math.round(x)} y={Math.round(y - 64)} zIndex={Math.round(y)}>
      <Sprite
        texture={texture}
        width={64}
        height={128}
        anchor={0}
        tint={tint}
      />
      {emoteState && (
        <PixiText
          text={emoteState.id}
          x={32}
          y={emoteState.yOffset}
          anchor={0.5}
          alpha={emoteState.alpha}
          style={
            new PIXI.TextStyle({
              fontSize: 32,
              fontFamily: "Arial",
            })
          }
        />
      )}
    </Container>
  );
};
