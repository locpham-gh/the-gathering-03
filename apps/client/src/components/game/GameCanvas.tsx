import React, { useEffect, useState, useRef } from "react";
import { Stage, Container, Sprite } from "@pixi/react";
import * as PIXI from "pixi.js";

// Internal modules
import type { MapVersion } from "./config";
import { MapRender } from "./MapRender";
import { ObjectLayer } from "./ObjectLayer";
import { Player } from "./Player";
import { OtherPlayer } from "./OtherPlayer";
import { getZones } from "./zones";

// Types
import type { Zone } from "./zones";
import type { RemotePlayer } from "../../hooks/useMultiplayer";

// Pixi Settings
const pixiSettings = PIXI.settings as unknown as { 
  RENDER_OPTIONS: { hello: boolean }; 
  ROUND_PIXELS: boolean;
};
const FIXED_MAP_ZOOM = 1;

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

interface MapData {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  layers: { name: string; data: number[]; order?: number; properties?: RawLayerProperty[] }[];
  tilesets?: {
    firstgid: number;
    image?: string;
    columns?: number;
    tilecount?: number;
    tilewidth?: number;
    tileheight?: number;
  }[];
}

interface RawLayer {
  name: string;
  type?: string;
  data?: number[];
  layers?: RawLayer[];
  properties?: RawLayerProperty[];
}

interface RawLayerProperty {
  name: string;
  value: unknown;
}

const flattenTileLayers = (
  layers: RawLayer[],
): { name: string; data: number[]; order: number; properties?: RawLayerProperty[] }[] => {
  const result: { name: string; data: number[]; order: number; properties?: RawLayerProperty[] }[] = [];
  let order = 0;
  const walk = (list: RawLayer[], prefix = "") => {
    for (const layer of list) {
      const nextName = prefix ? `${prefix}/${layer.name}` : layer.name;
      if (layer.type === "tilelayer" && Array.isArray(layer.data)) {
        result.push({ name: nextName, data: layer.data, order: order++, properties: layer.properties });
        continue;
      }
      if (layer.type === "group" && Array.isArray(layer.layers)) {
        walk(layer.layers, nextName);
      }
    }
  };
  walk(layers);
  return result;
};

interface GameCanvasProps {
  onZoneChange?: (zone: Zone | null) => void;
  onInteract?: () => void;
  activeZone: Zone | null;
  onNearbyPlayer?: (playerId: string | null) => void;
  players: Record<string, RemotePlayer>;
  selfPlayerId?: string | null;
  cameraFocusTarget?: { x: number; y: number; id: number } | null;
  cameraZoomTarget?: { x: number; y: number; id: number } | null;
  resetCameraSignal?: number;
  paused?: boolean;
  localCameraEnabled?: boolean;
  onViewportChange?: (next: { x: number; y: number; scale: number }) => void;
  onLocalPlayerRenderPosition?: (next: { x: number; y: number }) => void;
  updatePosition: (
    x: number,
    y: number,
    isSitting?: boolean,
    intent?: { dx: number; dy: number },
  ) => number | null;
  localCharacter2d?: string;
  authoritativeSelf?: RemotePlayer | null;
  mapVersion?: MapVersion;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  onZoneChange,
  onInteract,
  activeZone,
  onNearbyPlayer,
  players,
  selfPlayerId,
  cameraFocusTarget,
  cameraZoomTarget,
  resetCameraSignal = 0,
  paused = false,
  localCameraEnabled = false,
  onViewportChange,
  onLocalPlayerRenderPosition,
  updatePosition,
  localCharacter2d,
  authoritativeSelf,
  mapVersion = "v3",
}) => {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [dimensions, setDimensions] = useState({
    w: window.innerWidth,
    h: window.innerHeight,
  });
  const worldRef = useRef<PIXI.Container>(null);
  const [zoom, setZoom] = useState(FIXED_MAP_ZOOM);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragLastRef = useRef<{ x: number; y: number } | null>(null);
  const pinchDistanceRef = useRef<number | null>(null);
  const panVelocityRef = useRef({ x: 0, y: 0 });
  const inertiaFrameRef = useRef<number | null>(null);
  const lastMoveTsRef = useRef(0);

  const stopInertia = () => {
    if (inertiaFrameRef.current !== null) {
      cancelAnimationFrame(inertiaFrameRef.current);
      inertiaFrameRef.current = null;
    }
  };

  const startInertia = () => {
    stopInertia();
    const run = () => {
      panVelocityRef.current.x *= 0.92;
      panVelocityRef.current.y *= 0.92;
      const vx = panVelocityRef.current.x;
      const vy = panVelocityRef.current.y;
      if (Math.abs(vx) < 0.05 && Math.abs(vy) < 0.05) {
        inertiaFrameRef.current = null;
        return;
      }
      setPanOffset((prev) => ({ x: prev.x + vx, y: prev.y + vy }));
      inertiaFrameRef.current = requestAnimationFrame(run);
    };
    inertiaFrameRef.current = requestAnimationFrame(run);
  };

  useEffect(() => {
    const onResize = () => setDimensions({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    let mapFile = "/maps/classroom_map.json";
    if (mapVersion === "v2") mapFile = "/maps/office_map_new.json";
    else if (mapVersion === "v4") mapFile = "/maps/office.tmj";

    fetch(mapFile)
      .then((res) => res.json())
      .then((data) => {
        const normalized: MapData = {
          width: data.width,
          height: data.height,
          tilewidth: data.tilewidth,
          tileheight: data.tileheight,
          layers: flattenTileLayers(data.layers || []),
          tilesets: data.tilesets || [],
        };
        setMapData(normalized);
      });
  }, [mapVersion]);

  useEffect(() => {
    if (!cameraZoomTarget) return;
    setZoom(FIXED_MAP_ZOOM);
  }, [cameraZoomTarget?.id, cameraZoomTarget]);

  useEffect(() => {
    if (!resetCameraSignal) return;
    setPanOffset((prev) => ({ x: prev.x * 0.35, y: prev.y * 0.35 }));
    setZoom(FIXED_MAP_ZOOM);
    panVelocityRef.current = { x: 0, y: 0 };
    stopInertia();
  }, [resetCameraSignal]);

  useEffect(() => {
    return () => stopInertia();
  }, []);

  useEffect(() => {
    if (!worldRef.current) return;
    worldRef.current.sortableChildren = true;
  }, [worldRef]);

  if (!mapData) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-slate-900 border-none">
         <div className="text-white animate-pulse font-medium">Entering The Metaverse...</div>
      </div>
    );
  }

  const cameraCenterX = authoritativeSelf?.x ?? 0;
  const cameraCenterY = authoritativeSelf?.y ?? 0;
  const cullMargin = 256;
  const viewportBounds = {
    left: cameraCenterX - dimensions.w / 2 - cullMargin,
    top: cameraCenterY - dimensions.h / 2 - cullMargin,
    right: cameraCenterX + dimensions.w / 2 + cullMargin,
    bottom: cameraCenterY + dimensions.h / 2 + cullMargin,
  };
  const otherPlayers = Object.values(players).filter((player) => {
    if (player.id === selfPlayerId) return false;
    const dx = player.x - cameraCenterX;
    const dy = player.y - cameraCenterY;
    return dx * dx + dy * dy <= 2200 * 2200;
  });
  const objectLayerNames = new Set(
    mapData.layers
      .filter((layer) => {
        const normalized = layer.name.toLowerCase();
        const hasCollides =
          Array.isArray(layer.properties) &&
          layer.properties.some(
            (property) =>
              property.name.toLowerCase() === "collides" && Boolean(property.value),
          );
        return (
          hasCollides ||
          normalized.includes("layer 3") ||
          normalized.includes("layer 4") ||
          normalized.includes("object") ||
          normalized.includes("furniture") ||
          normalized.includes("wall") ||
          normalized.includes("block") ||
          (layer.order ?? 0) >= 2
        );
      })
      .map((layer) => layer.name),
  );

  return (
    <div
      className="w-full h-full"
      style={{ touchAction: "none" }}
      onWheel={(e) => {
        // Let global non-passive listeners handle browser zoom prevention.
        // Keep local wheel event inert to avoid passive-listener warnings.
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        if (e.button !== 0) return;
        stopInertia();
        isDraggingRef.current = true;
        dragLastRef.current = { x: e.clientX, y: e.clientY };
        lastMoveTsRef.current = performance.now();
        panVelocityRef.current = { x: 0, y: 0 };
      }}
      onMouseMove={(e) => {
        if (!isDraggingRef.current || !dragLastRef.current) return;
        const dx = e.clientX - dragLastRef.current.x;
        const dy = e.clientY - dragLastRef.current.y;
        const now = performance.now();
        const dt = Math.max(1, now - lastMoveTsRef.current);
        panVelocityRef.current = { x: dx / (dt / 16), y: dy / (dt / 16) };
        lastMoveTsRef.current = now;
        dragLastRef.current = { x: e.clientX, y: e.clientY };
        setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      }}
      onMouseUp={() => {
        if (isDraggingRef.current) startInertia();
        isDraggingRef.current = false;
        dragLastRef.current = null;
      }}
      onMouseLeave={() => {
        if (isDraggingRef.current) startInertia();
        isDraggingRef.current = false;
        dragLastRef.current = null;
      }}
      onTouchStart={(e) => {
        if (e.touches.length < 2) return;
        const [a, b] = [e.touches[0], e.touches[1]];
        const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        pinchDistanceRef.current = distance;
      }}
      onTouchMove={(e) => {
        if (e.touches.length < 2) return;
        e.preventDefault();
        pinchDistanceRef.current = null;
      }}
      onTouchEnd={() => {
        pinchDistanceRef.current = null;
      }}
    >
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
          <MapRender
            mapData={mapData}
            mapVersion={mapVersion}
            renderMode="bottom"
            viewportBounds={viewportBounds}
            excludeLayerNames={objectLayerNames}
          />
          <Container sortableChildren>
            <ObjectLayer
              mapData={mapData}
              mapVersion={mapVersion}
              viewportBounds={viewportBounds}
            />
          <Player
            mapData={mapData}
            onZoneChange={onZoneChange}
            isPaused={activeZone !== null || paused}
            onInteract={onInteract}
            updatePosition={updatePosition}
            players={players}
            selfPlayerId={selfPlayerId}
            onNearbyPlayer={onNearbyPlayer}
            worldRef={worldRef}
            screenW={dimensions.w}
            screenH={dimensions.h}
            zoom={zoom}
            panOffset={panOffset}
            onViewportChange={onViewportChange}
            onLocalPlayerRenderPosition={onLocalPlayerRenderPosition}
            character2d={localCharacter2d}
            authoritativePosition={authoritativeSelf}
            cameraFocusTarget={cameraFocusTarget}
            showCameraBadge={localCameraEnabled}
            zones={getZones(mapVersion)}
          />

          {otherPlayers.map((player) => (
            <OtherPlayer key={player.id} player={player} />
            ))}
          </Container>
          <MapRender
            mapData={mapData}
            mapVersion={mapVersion}
            renderMode="top"
            viewportBounds={viewportBounds}
            excludeLayerNames={objectLayerNames}
          />
          <ZoneDebugRenderer zones={getZones(mapVersion)} />
        </Container>
      </Stage>
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

