import React, { useEffect, useState, useRef } from "react";
import { Stage, Container, Sprite } from "@pixi/react";
import * as PIXI from "pixi.js";

// Internal modules
import { MAP_CONFIG } from "./config";
import { MapRender } from "./MapRender";
import { Player } from "./Player";
import { OtherPlayer } from "./OtherPlayer";
import { ZONES } from "./zones";

// Types
import type { Zone } from "./zones";
import type { RemotePlayer } from "../../hooks/useMultiplayer";

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

interface MapData {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  layers: { name: string; data: number[] }[];
}

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
  updatePosition: (x: number, y: number, isSitting?: boolean) => number | null;
  localCharacter2d?: string;
  authoritativeSelf?: RemotePlayer | null;
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
}) => {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [dimensions, setDimensions] = useState({
    w: window.innerWidth,
    h: window.innerHeight,
  });
  const worldRef = useRef<PIXI.Container>(null);
  const [zoom, setZoom] = useState(1);
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
    let mapFile = "/maps/office.json";
    if (MAP_CONFIG.version === "v2") mapFile = "/maps/office_map_new.json";
    else if (MAP_CONFIG.version === "v3") mapFile = "/maps/classroom_map.json";

    fetch(mapFile)
      .then((res) => res.json())
      .then((data) => setMapData(data));
  }, []);

  useEffect(() => {
    if (!cameraZoomTarget) return;
    setZoom((prev) => Math.max(1.05, Math.min(1.8, prev + 0.12)));
  }, [cameraZoomTarget?.id, cameraZoomTarget]);

  useEffect(() => {
    if (!resetCameraSignal) return;
    setPanOffset((prev) => ({ x: prev.x * 0.35, y: prev.y * 0.35 }));
    setZoom((prev) => prev + (1 - prev) * 0.4);
    panVelocityRef.current = { x: 0, y: 0 };
    stopInertia();
  }, [resetCameraSignal]);

  useEffect(() => {
    return () => stopInertia();
  }, []);

  if (!mapData) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-slate-900 border-none">
         <div className="text-white animate-pulse font-medium">Entering The Metaverse...</div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full"
      style={{ touchAction: "none" }}
      onWheel={(e) => {
        stopInertia();
        const delta = e.deltaY > 0 ? -0.03 : 0.03;
        setZoom((prev) => Math.max(0.75, Math.min(1.9, prev + delta)));
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
        const [a, b] = [e.touches[0], e.touches[1]];
        const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        if (!pinchDistanceRef.current) {
          pinchDistanceRef.current = distance;
          return;
        }
        const ratio = distance / pinchDistanceRef.current;
        setZoom((prev) => Math.max(0.75, Math.min(1.9, prev * ratio)));
        pinchDistanceRef.current = distance;
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
          <MapRender mapData={mapData} />
          
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
          />

          {Object.values(players)
            .filter((player) => player.id !== selfPlayerId)
            .map((player) => (
            <OtherPlayer key={player.id} player={player} />
            ))}

          <ZoneDebugRenderer zones={ZONES} />
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
