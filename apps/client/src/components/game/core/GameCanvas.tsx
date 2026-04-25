import React, { useEffect, useState, useRef } from "react";
import { Stage, Container, Sprite } from "@pixi/react";
import * as PIXI from "pixi.js";

// Internal modules
import { MapRender } from "./MapRender";
import { Player } from "../entities/Player";
import { OtherPlayer } from "../entities/OtherPlayer";
import { ZONES } from "./zones";

// Types
import type { Zone } from "./zones";
import type { RemotePlayer } from "../../../hooks/useMultiplayer";
import type { MapData } from "../lib/gameTypes";

// Pixi Settings
const pixiSettings = PIXI.settings as unknown as { 
  RENDER_OPTIONS: { hello: boolean }; 
  ROUND_PIXELS: boolean;
};

if (pixiSettings.RENDER_OPTIONS) {
  pixiSettings.RENDER_OPTIONS.hello = false;
}

// ✅ Anti-glitch: Disable rounding and mipmaps to prevent edge bleeding on zoomed maps
pixiSettings.ROUND_PIXELS = false;
PIXI.BaseTexture.defaultOptions.scaleMode = PIXI.SCALE_MODES.NEAREST;
PIXI.BaseTexture.defaultOptions.mipmap = PIXI.MIPMAP_MODES.OFF;

// Silence `@pixi/react` known deprecation warning about interaction plugin
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  if (typeof args[0] === "string" && args[0].includes("renderer.plugins.interaction has been deprecated")) return;
  originalWarn(...args);
};

// MapData is now imported from gameTypes.ts

interface GameCanvasProps {
  onZoneChange?: (zone: Zone | null) => void;
  onInteract?: () => void;
  activeZone: Zone | null;
  onNearbyPlayer?: (playerId: string | null) => void;
  players: Record<string, RemotePlayer>;
  updatePosition: (x: number, y: number, isSitting?: boolean, character?: string) => void;
  selectedCharacter: string;
  mapType?: string;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  onZoneChange,
  onInteract,
  activeZone,
  onNearbyPlayer,
  players,
  updatePosition,
  selectedCharacter,
  mapType = "office",
}) => {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [dimensions, setDimensions] = useState({
    w: window.innerWidth,
    h: window.innerHeight,
  });
  const worldRef = useRef<PIXI.Container>(null);

  useEffect(() => {
    const onResize = () => setDimensions({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const mapFile = `/maps/${mapType}_map.json`;

    fetch(mapFile)
      .then((res) => res.json())
      .then((data) => setMapData(data))
      .catch((err) => console.error("Failed to load map:", err));
  }, [mapType]);

  if (!mapData) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-slate-900 border-none">
         <div className="text-white animate-pulse font-medium">Entering The Metaverse...</div>
      </div>
    );
  }

  return (
    <Stage
      width={dimensions.w}
      height={dimensions.h}
      options={{
        backgroundColor: 0xf8fafc,
        antialias: false,
        hello: false,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      }}
      style={{ imageRendering: "pixelated" }}
    >
      <Container ref={worldRef}>
        <MapRender mapData={mapData} />
        
        <Player
          mapData={mapData}
          onZoneChange={onZoneChange}
          isPaused={activeZone !== null}
          onInteract={onInteract}
          updatePosition={updatePosition}
          players={players}
          onNearbyPlayer={onNearbyPlayer}
          worldRef={worldRef}
          screenW={dimensions.w}
          screenH={dimensions.h}
          selectedCharacter={selectedCharacter}
        />

        {Object.values(players).map((player) => (
          <OtherPlayer key={player.id} player={player} />
        ))}

        <ZoneDebugRenderer zones={ZONES} />
      </Container>
    </Stage>
  );
};

/**
 * Renders subtle invisible triggers for zones (Library, etc.)
 */
const ZoneDebugRenderer: React.FC<{ zones: Zone[] }> = ({ zones }) => {
  return (
    <Container>
      {zones.map((zone) => (
        <Sprite
          key={zone.id}
          texture={PIXI.Texture.WHITE}
          x={zone.x}
          y={zone.y}
          width={zone.width}
          height={zone.height}
          alpha={0} // Keep invisible per user request
          tint={0x0ea5e9}
        />
      ))}
    </Container>
  );
};
