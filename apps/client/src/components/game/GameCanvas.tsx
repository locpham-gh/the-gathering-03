import React, { useEffect, useState, useMemo, useRef } from "react";
import { Stage, Sprite, Container, useTick } from "@pixi/react";
import * as PIXI from "pixi.js";
import { ZONES, checkZoneCollision } from "./zones";
import type { Zone } from "./zones";
import { useMultiplayer } from "../../hooks/useMultiplayer";
import type { RemotePlayer } from "../../hooks/useMultiplayer";

PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

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
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  onZoneChange,
  onInteract,
  activeZone,
  onNearbyPlayer,
}) => {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const { players, updatePosition } = useMultiplayer();

  useEffect(() => {
    fetch("/maps/office.json")
      .then((res) => res.json())
      .then((data) => setMapData(data));
  }, []);

  if (!mapData)
    return (
      <div className="text-white animate-pulse">Entering The Metaverse...</div>
    );

  return (
    <Stage
      width={mapData.width * 64}
      height={mapData.height * 64}
      options={{ backgroundColor: 0x0f172a, antialias: false }}
    >
      <MapRender mapData={mapData} />
      <Player
        mapData={mapData}
        onZoneChange={onZoneChange}
        isPaused={activeZone !== null}
        onInteract={onInteract}
        updatePosition={updatePosition}
        players={players}
        onNearbyPlayer={onNearbyPlayer}
      />
      {Object.values(players).map((player) => (
        <OtherPlayer key={player.id} player={player} />
      ))}
      <ZoneDebugRenderer zones={ZONES} />
    </Stage>
  );
};

const MapRender: React.FC<{ mapData: MapData }> = ({ mapData }) => {
  return (
    <Container>
      {mapData.layers.map((layer, layerIdx) => (
        <Container key={layer.name}>
          {layer.data.map((tileId, index) => {
            if (tileId === 0) return null;

            const x = (index % mapData.width) * 64;
            const y = Math.floor(index / mapData.width) * 64;

            const isWall = tileId === 2;
            const textureName = "/maps/Room_Builder_free_32x32.png";
            const tint = isWall ? 0x222222 : 0xffffff;

            return (
              <Sprite
                key={`${layerIdx}-${index}`}
                image={textureName}
                x={x}
                y={y}
                width={64}
                height={64}
                tint={tint}
              />
            );
          })}
        </Container>
      ))}
    </Container>
  );
};

const ZoneDebugRenderer: React.FC<{ zones: Zone[] }> = ({ zones }) => {
  return (
    <Container>
      {zones.map((zone) => (
        <Sprite
          key={zone.id}
          image="/maps/Room_Builder_free_32x32.png"
          x={zone.x}
          y={zone.y}
          width={zone.width}
          height={zone.height}
          alpha={0.3}
          tint={0x44ff44}
        />
      ))}
    </Container>
  );
};

const Player: React.FC<{
  mapData: MapData;
  onZoneChange: ((zone: Zone | null) => void) | undefined;
  isPaused: boolean;
  onInteract: (() => void) | undefined;
  updatePosition: (x: number, y: number) => void;
  players: Record<string, RemotePlayer>;
  onNearbyPlayer: ((playerId: string | null) => void) | undefined;
}> = ({
  mapData,
  onZoneChange,
  isPaused,
  onInteract,
  updatePosition,
  players,
  onNearbyPlayer,
}) => {
  const [x, setX] = useState(128);
  const [y, setY] = useState(128);
  const [currentZone, setCurrentZone] = useState<Zone | null>(null);
  const [nearbyPlayerId, setNearbyPlayerId] = useState<string | null>(null);
  const lastNearbyTrigger = useRef<number>(0);

  const speed = 4;
  const keys = useMemo(() => new Set<string>(), []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keys.add(e.key.toLowerCase());
      if (e.key.toLowerCase() === "e" && currentZone && !isPaused) {
        onInteract?.();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [keys, currentZone, isPaused, onInteract]);

  useTick((delta) => {
    if (isPaused) return;

    let nextX = x;
    let nextY = y;

    if (keys.has("w")) nextY -= speed * delta;
    if (keys.has("s")) nextY += speed * delta;
    if (keys.has("a")) nextX -= speed * delta;
    if (keys.has("d")) nextX += speed * delta;

    const wallLayer = mapData.layers.find((l) => l.name === "Walls");
    if (wallLayer && (nextX !== x || nextY !== y)) {
      const tileWidth = 64;

      const pRect = {
        left: nextX + 16,
        right: nextX + 48,
        top: nextY + 32,
        bottom: nextY + 64,
      };

      let collision = false;
      for (let i = 0; i < wallLayer.data.length; i++) {
        if (wallLayer.data[i] !== 0) {
          const tx = (i % mapData.width) * tileWidth;
          const ty = Math.floor(i / mapData.width) * tileWidth;

          if (
            pRect.right > tx &&
            pRect.left < tx + tileWidth &&
            pRect.bottom > ty &&
            pRect.top < ty + tileWidth
          ) {
            collision = true;
            break;
          }
        }
      }

      if (!collision) {
        setX(nextX);
        setY(nextY);
      }
    } else {
      setX(nextX);
      setY(nextY);
    }

    const zone = checkZoneCollision(nextX, nextY, ZONES);
    if (zone !== currentZone) {
      setCurrentZone(zone);
      onZoneChange?.(zone);
    }

    // Sync position to backend
    if (nextX !== x || nextY !== y) {
      updatePosition(nextX, nextY);
    }

    // Proximity check for Video Calls
    const now = Date.now();
    if (now - lastNearbyTrigger.current > 500) { // Check every 500ms for responsiveness
      let foundPlayerId: string | null = null;
      for (const [id, remoteUser] of Object.entries(players)) {
        const dist = Math.sqrt(Math.pow(nextX - remoteUser.x, 2) + Math.pow(nextY - remoteUser.y, 2));
        if (dist < 120) {
          foundPlayerId = id;
          break;
        }
      }

      if (foundPlayerId !== nearbyPlayerId) {
        setNearbyPlayerId(foundPlayerId);
        onNearbyPlayer?.(foundPlayerId);
      }
      lastNearbyTrigger.current = now;
    }
  });

  return (
    <Sprite
      image="/sprites/Adam_16x16.png"
      x={x}
      y={y}
      width={64}
      height={64}
      anchor={0}
      zIndex={y}
    />
  );
};

const OtherPlayer: React.FC<{ player: RemotePlayer }> = ({ player }) => {
  const [x, setX] = useState(player.x);
  const [y, setY] = useState(player.y);

  // Lerp smoothing
  useTick((delta) => {
    setX((prev) => prev + (player.x - prev) * 0.1 * delta);
    setY((prev) => prev + (player.y - prev) * 0.1 * delta);
  });

  return (
    <Container x={x} y={y}>
      <Sprite
        image="/sprites/Adam_16x16.png"
        width={64}
        height={64}
        anchor={0}
        zIndex={y}
        tint={0x88ff88}
      />
    </Container>
  );
};
