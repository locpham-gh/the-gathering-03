import React, { useMemo } from "react";
import { Graphics } from "@pixi/react";
import * as PIXI from "pixi.js";

interface DayNightOverlayProps {
  width: number;
  height: number;
}

export const DayNightOverlay: React.FC<DayNightOverlayProps> = ({ width, height }) => {
  const overlayData = useMemo(() => {
    const hour = new Date().getHours();
    
    // Day (6 AM - 5 PM)
    if (hour >= 6 && hour < 17) {
      return { color: 0x000000, alpha: 0 };
    }
    
    // Sunset (5 PM - 8 PM)
    if (hour >= 17 && hour < 20) {
      return { color: 0xff6600, alpha: 0.15 };
    }
    
    // Night (8 PM - 5 AM)
    if (hour >= 20 || hour < 5) {
      return { color: 0x000033, alpha: 0.4 };
    }
    
    // Sunrise (5 AM - 6 AM)
    return { color: 0xffcc33, alpha: 0.1 };
  }, []);

  const draw = (g: PIXI.Graphics) => {
    g.clear();
    if (overlayData.alpha === 0) return;
    
    g.beginFill(overlayData.color, overlayData.alpha);
    g.drawRect(0, 0, width, height);
    g.endFill();
  };

  return <Graphics draw={draw} eventMode="none" />;
};
