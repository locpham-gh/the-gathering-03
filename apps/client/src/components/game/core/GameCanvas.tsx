import React, { useRef, useMemo } from "react";
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
import { setupPixi } from "../../../lib/pixi-setup";

// Hooks
import { useMapLoader } from "../../../hooks/useMapLoader";
import { useWindowDimensions } from "../../../hooks/useWindowDimensions";

// Types
import type { Zone } from "./zones";
import type { RemotePlayer, LocalPosition } from "../../../types/game";

// Initialize Pixi settings
setupPixi();

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
  localPosition: LocalPosition;
  initialServerPosition?: { x: number; y: number } | null;
  onPhoneToggle?: (isOpen: boolean) => void;
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
  onPhoneToggle,
}) => {
  const { mapData, loading: mapLoading } = useMapLoader(mapType);
  const { w: screenW, h: screenH } = useWindowDimensions();
  const zones = useMemo(() => getZonesForMap(mapType), [mapType]);
  const worldRef = useRef<PIXI.Container>(null);

  if (mapLoading || !mapData) {
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
        width={screenW}
        height={screenH}
        options={{
          backgroundColor: 0xf8fafc,
          antialias: false,
          hello: false,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
        }}
        style={{ imageRendering: "pixelated", outline: "none", border: "none" }}
      >
        <Container ref={worldRef}>
          <MapRender mapData={mapData} />
          
          <Player
            roomId={roomId}
            mapData={mapData}
            mapType={mapType}
            onZoneChange={onZoneChange}
            isPaused={activeZone !== null && activeZone.id !== "seat"}
            onInteract={onInteract}
            updatePosition={updatePosition}
            players={players}
            onNearbyPlayer={onNearbyPlayer}
            worldRef={worldRef}
            screenW={screenW}
            screenH={screenH}
            selectedCharacter={selectedCharacter}
            customDisplayName={customDisplayName}
            localEmote={localEmote}
            localChatBubble={localChatBubble}
            initialServerPosition={initialServerPosition}
            onPhoneToggle={onPhoneToggle}
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
