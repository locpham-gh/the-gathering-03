import React, { useState, useRef, useEffect, useCallback } from "react";
import { Sprite, useTick, Container, Text as PixiText, Graphics } from "@pixi/react";
import * as PIXI from "pixi.js";
import { DIR_COL_OFFSET, getCharacterTexture } from "../lib/tileUtils";
import type { DirString } from "../lib/gameTypes";

interface AnimatedPlayerSpriteProps {
  x: number;
  y: number;
  direction: DirString;
  isMoving: boolean;
  isSitting?: boolean;
  isPhoneOut?: boolean;
  character?: string;
  tint?: number;
  emote?: { id: string; timestamp: number } | null;
  displayName?: string;
  chatBubble?: string | null;
}

export const AnimatedPlayerSprite: React.FC<AnimatedPlayerSpriteProps> = ({
  x,
  y,
  direction,
  isMoving,
  isSitting = false,
  isPhoneOut = false,
  character = "Adam",
  tint = 0xffffff,
  emote = null,
  displayName,
  chatBubble = null,
}) => {
  const [frame, setFrame] = useState(0);
  const timeAcc = useRef(0);
  const [emoteState, setEmoteState] = useState<{ id: string; yOffset: number; alpha: number } | null>(null);
  const [bubbleState, setBubbleState] = useState<{ text: string; alpha: number } | null>(null);

  useEffect(() => {
    if (emote) {
      setEmoteState({ id: emote.id, yOffset: -80, alpha: 1 });
    }
  }, [emote]);

  useEffect(() => {
    if (chatBubble) {
      setBubbleState({ text: chatBubble.length > 28 ? chatBubble.slice(0, 28) + "…" : chatBubble, alpha: 1 });
    }
  }, [chatBubble]);

  useEffect(() => {
    // Reset frame when phone state changes to start from "pull out" animation
    setFrame(0);
    timeAcc.current = 0;
  }, [isPhoneOut]);

  // Animation logic loop
  useTick((delta) => {
    timeAcc.current += delta;
    const tickSpeed = isMoving ? 5 : 8;

    if (timeAcc.current > tickSpeed) {
      timeAcc.current = 0;
      setFrame((prev) => {
        if (isPhoneOut) {
          // Phone animation has 8 frames (0-7)
          // 0-3: Pulling out (once)
          // 4-7: Using/Looping
          if (prev < 4) return prev + 1; // Pull out sequence
          return prev >= 7 ? 4 : prev + 1; // Loop usage sequence (4-7)
        }
        return prev >= 5 ? 0 : prev + 1; // Default 6-frame loop
      });
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

    if (bubbleState) {
      setBubbleState((prev) => {
        if (!prev) return null;
        const newAlpha = prev.alpha - 0.005 * delta;
        if (newAlpha <= 0) return null;
        return { ...prev, alpha: newAlpha };
      });
    }
  });

  let baseCol = DIR_COL_OFFSET[direction];
  // Row 1 (index 1) = Idle, Row 2 (index 2) = Walking
  let row = isMoving ? 2 : 1;
  let yOffset = 0;

  if (isSitting) {
    if (direction === "left" || direction === "right") {
      row = 5;
      baseCol = direction === "left" ? 6 : 0;
    } else {
      // "Fake" sitting for up/down by using Idle row and shifting down
      row = 1;
      baseCol = DIR_COL_OFFSET[direction];
      yOffset = 20; // Shift down to look like sitting
    }
  } else if (isPhoneOut) {
    row = 6;
    // The phone animation in the screenshot seems to be mostly front-facing
    // We'll force it to face DOWN (col 18 range) or use current if it has more directions
    // Actually, row 7 columns 0-11 in the screenshot are front-facing phone usage.
    // Let's use column 0-11 for row 7.
    baseCol = 0; 
  }

  const col = baseCol + frame;
  const texture = getCharacterTexture(row, col, character);

  // Chat bubble background draw callback
  const drawBubbleBg = useCallback((g: PIXI.Graphics) => {
    g.clear();
    if (!bubbleState) return;
    const textLen = bubbleState.text.length;
    const boxW = Math.min(textLen * 7.5 + 16, 240);
    const boxH = 22;
    // Bubble body
    g.beginFill(0x1e293b, 0.88);
    g.drawRoundedRect(-boxW / 2, -boxH - 4, boxW, boxH, 8);
    g.endFill();
    // Small triangle pointer
    g.beginFill(0x1e293b, 0.88);
    g.moveTo(-5, -4);
    g.lineTo(5, -4);
    g.lineTo(0, 3);
    g.closePath();
    g.endFill();
  }, [bubbleState]);

  return (
    <Container x={Math.round(x)} y={Math.round(y - 64)} zIndex={Math.round(y)}>
      <Sprite
        texture={texture}
        width={64}
        height={128}
        x={0}
        y={yOffset}
        anchor={0}
        tint={tint}
      />

      {/* Display Name Label */}
      {displayName && (
        <PixiText
          text={displayName}
          x={32}
          y={132}
          anchor={0.5}
          style={
            new PIXI.TextStyle({
              fontSize: 11,
              fontFamily: "Arial, sans-serif",
              fill: "#ffffff",
              stroke: "#000000",
              strokeThickness: 3,
              fontWeight: "600",
              align: "center",
            })
          }
        />
      )}

      {/* Chat Bubble */}
      {bubbleState && (
        <Container x={32} y={-8} alpha={bubbleState.alpha}>
          <Graphics draw={drawBubbleBg} />
          <PixiText
            text={bubbleState.text}
            x={0}
            y={-15}
            anchor={0.5}
            style={
              new PIXI.TextStyle({
                fontSize: 11,
                fill: "#f1f5f9",
                fontFamily: "Arial, sans-serif",
                fontWeight: "500",
                align: "center",
              })
            }
          />
        </Container>
      )}

      {/* Emote */}
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
