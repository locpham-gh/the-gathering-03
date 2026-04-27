import React, { useEffect, useState, useRef, useMemo } from "react";
import { Stage, Container, Sprite } from "@pixi/react";
import * as PIXI from "pixi.js";

// Internal modules
import { MapRender } from "./MapRender";
import { Player } from "../entities/Player";
import { OtherPlayer } from "../entities/OtherPlayer";
import { getZonesForMap } from "./zones";
import { DayNightOverlay } from "./DayNightOverlay";
import { MiniMap } from "../ui/MiniMap";
import { WORLD_CONFIG } from "../lib/constants";

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
pixiSettings.ROUND_PIXELS = true;
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
  updatePosition: (x: number, y: number, direction: string, isSitting?: boolean, character?: string, customName?: string) => void;
  selectedCharacter: string;
  customDisplayName?: string;
  mapType?: string;
  localEmote?: { id: string; timestamp: number } | null;
  localChatBubble?: string | null;
  roomId?: string;
  localPosition: { x: number; y: number };
  initialServerPosition?: { x: number; y: number } | null;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  onZoneChange,
  onInteract,
  activeZone,
  onNearbyPlayer,
  players,
  updatePosition,
  selectedCharacter,
  customDisplayName,
  mapType = "office",
  localEmote,
  localChatBubble,
  roomId,
  localPosition,
  initialServerPosition,
}) => {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const zones = useMemo(() => getZonesForMap(mapType), [mapType]);
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
    const normalizeMap = (mt: string) => {
      if (!mt) return "office";
      const lower = mt.toLowerCase().replace(/[\s_]/g, "");
      if (lower.includes("office2") || lower.includes("merged") || lower.includes("officecombined")) return "office_combined";
      if (lower.includes("school") || lower.includes("classroom")) return "classroom";
      if (lower.includes("cafe") || lower.includes("lounge")) return "cafe";
      if (lower.includes("garden") || lower.includes("outdoor") || lower.includes("park")) return "garden";
      if (lower.includes("conference") || lower.includes("hall") || lower.includes("auditorium")) return "conference";
      return "office";
    };
    const mapName = normalizeMap(mapType);
    const mapFile = `/maps/${mapName}_map.json`;

    setMapData(null); // Clear map while loading to trigger loading state

    fetch(mapFile)
      .then((res) => {
        if (!res.ok) throw new Error("Map not found");
        return res.json();
      })
      .then((data) => setMapData(data))
      .catch((err) => {
        console.error("Failed to load map:", err);
        // Fallback to office if café fails (e.g. file not found)
        if (mapName !== "office") {
           fetch("/maps/office_map.json").then(r => r.json()).then(d => setMapData(d));
        }
      });
  }, [mapType]);

  if (!mapData) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-slate-900 border-none">
         <div className="text-white animate-pulse font-medium">Entering The Metaverse...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <Stage
        key={`stage-${mapType}-${mapData.width}`} // Force clean remount when map changes
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
            roomId={roomId}
            mapData={mapData}
            mapType={mapType}
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
            customDisplayName={customDisplayName}
            localEmote={localEmote}
            localChatBubble={localChatBubble}
            initialServerPosition={initialServerPosition}
          />

          {Object.values(players).map((player) => (
            <OtherPlayer key={player.id} player={player} />
          ))}

          <DayNightOverlay 
            width={mapData.width * WORLD_CONFIG.TILE_SIZE_VIRTUAL} 
            height={mapData.height * WORLD_CONFIG.TILE_SIZE_VIRTUAL} 
          />

          <ZoneDebugRenderer zones={zones} />
        </Container>
      </Stage>

      {/* Mini-map overlay (DOM) */}
      <MiniMap
        mapWidthPx={mapData.width * WORLD_CONFIG.TILE_SIZE_VIRTUAL}
        mapHeightPx={mapData.height * WORLD_CONFIG.TILE_SIZE_VIRTUAL}
        localX={localPosition.x}
        localY={localPosition.y}
        players={players}
      />
    </div>
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
