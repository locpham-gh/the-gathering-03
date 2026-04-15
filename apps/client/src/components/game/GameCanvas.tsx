import React, { useEffect, useState, useMemo, useRef } from "react";
import { Stage, Sprite, Container, useTick } from "@pixi/react";
import * as PIXI from "pixi.js";
import { ZONES, checkZoneCollision } from "./zones";
import type { Zone } from "./zones";
import { useMultiplayer } from "../../hooks/useMultiplayer";
import type { RemotePlayer } from "../../hooks/useMultiplayer";

PIXI.BaseTexture.defaultOptions.scaleMode = PIXI.SCALE_MODES.NEAREST;

// Modern PixiJS 7+ settings to silence warnings
if ((PIXI as any).settings?.RENDER_OPTIONS) {
  (PIXI as any).settings.RENDER_OPTIONS.hello = false;
}

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
  roomId?: string;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  onZoneChange,
  onInteract,
  activeZone,
  onNearbyPlayer,
  roomId,
}) => {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const { players, updatePosition } = useMultiplayer(roomId);

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
      options={{
        backgroundColor: 0x0f172a,
        antialias: false,
        hello: false,
      }}
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

const baseTextures: Record<string, PIXI.BaseTexture> = {};
const textureCache: Record<number, PIXI.Texture> = {};

function getTileDataForGid(rawGid: number) {
  if (rawGid === 0) return null;

  const flipX = (rawGid & 0x80000000) !== 0;
  const flipY = (rawGid & 0x40000000) !== 0;

  const gid = rawGid & 0x1fffffff;
  if (gid === 0) return null;

  let sourceImage = "";
  let columns = 0;
  let localId = 0;

  // Handles second tileset (Interiors)
  if (gid >= 392) {
    sourceImage = "/maps/Interiors_free_32x32.png";
    columns = 16;
    localId = gid - 392;
  } else {
    // Handles first tileset (Room Builder)
    sourceImage = "/maps/Room_Builder_v2_32x32.png";
    columns = 17;
    localId = gid - 1;
  }

  if (!baseTextures[sourceImage]) {
    baseTextures[sourceImage] = PIXI.BaseTexture.from(sourceImage);
  }

  const tx = (localId % columns) * 32;
  const ty = Math.floor(localId / columns) * 32;

  let texture = textureCache[gid];
  if (!texture) {
    texture = new PIXI.Texture(
      baseTextures[sourceImage],
      new PIXI.Rectangle(tx, ty, 32, 32),
    );
    textureCache[gid] = texture;
  }

  return { texture, flipX, flipY };
}

const MapRender: React.FC<{ mapData: MapData }> = ({ mapData }) => {
  return (
    <Container>
      {mapData.layers.map((layer, layerIdx) => (
        <Container key={layer.name}>
          {layer.data.map((tileId, index) => {
            if (tileId === 0) return null;

            const x = (index % mapData.width) * 64;
            const y = Math.floor(index / mapData.width) * 64;
            const tileData = getTileDataForGid(tileId);

            if (!tileData) return null;
            const { texture, flipX, flipY } = tileData;

            return (
              <Sprite
                key={`${layerIdx}-${index}`}
                texture={texture}
                x={x}
                y={y}
                scale={{ x: flipX ? -2 : 2, y: flipY ? -2 : 2 }}
                anchor={{ x: flipX ? 1 : 0, y: flipY ? 1 : 0 }}
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

export type DirString = "right" | "up" | "left" | "down";
const DIR_COL_OFFSET: Record<DirString, number> = {
  right: 0,
  up: 6,
  left: 12,
  down: 18,
};

const adamTextureCache: Record<string, PIXI.Texture> = {};

function getAdamTexture(row: number, col: number): PIXI.Texture {
  const key = `${row}-${col}`;
  if (adamTextureCache[key]) return adamTextureCache[key];

  if (!baseTextures["/sprites/Adam_16x16aa.png"]) {
    baseTextures["/sprites/Adam_16x16aa.png"] = PIXI.BaseTexture.from(
      "/sprites/Adam_16x16aa.png",
    );
  }

  const tx = col * 16;
  const ty = row * 32; // Mỗi khung hình của nhân vật này cao 32 pixel
  const texture = new PIXI.Texture(
    baseTextures["/sprites/Adam_16x16aa.png"],
    new PIXI.Rectangle(tx, ty, 16, 32),
  );
  adamTextureCache[key] = texture;
  return texture;
}

function getNewDirection(
  dx: number,
  dy: number,
  currentDir: DirString,
): DirString {
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  // Nếu di chuyển chéo (độ chênh lệch dx và dy rất nhỏ), ưu tiên giữ nguyên hướng cũ
  if (Math.abs(absDx - absDy) < 0.1) {
    if (
      (currentDir === "right" && dx > 0) ||
      (currentDir === "left" && dx < 0)
    ) {
      return currentDir;
    }
    if ((currentDir === "up" && dy < 0) || (currentDir === "down" && dy > 0)) {
      return currentDir;
    }
    return dx > 0 ? "right" : "left"; // Mặc định xoay ngang nếu không khớp
  }

  if (absDx > absDy) {
    return dx > 0 ? "right" : "left";
  }
  return dy > 0 ? "down" : "up";
}

const AnimatedPlayerSprite: React.FC<{
  x: number;
  y: number;
  direction: DirString;
  isMoving: boolean;
  isSitting?: boolean;
  tint?: number;
}> = ({ x, y, direction, isMoving, isSitting = false, tint = 0xffffff }) => {
  const [frame, setFrame] = useState(0);
  const timeAcc = useRef(0);

  // Vòng lặp đếm frame hoạt cảnh
  useTick((delta) => {
    timeAcc.current += delta;
    // Đi bộ thì đếm nhanh hơn (5), đứng yên thì thở chậm (8)
    const tickSpeed = isMoving ? 5 : 8;

    if (timeAcc.current > tickSpeed) {
      timeAcc.current = 0;
      setFrame((prev) => (prev >= 5 ? 0 : prev + 1));
    }
  });

  let baseCol = DIR_COL_OFFSET[direction];
  // Hàng 2 (Row index 1) là đứng thở Idle, Hàng 3 (Row 2) là đi bộ (Walk)
  let row = isMoving ? 2 : 1;

  if (isSitting) {
    row = 5;
    // Theo cấu trúc ảnh: 6 ô đầu (0-5) là nhìn Phải, 6 ô tiếp theo (6-11) là nhìn Trái.
    if (direction === "left") {
      baseCol = 6;
    } else {
      // Các hướng còn lại (Right, Up, Down) ép về hình ngồi nhìn Phải (0) để tránh bị trống ảnh
      baseCol = 0;
    }
  }

  const col = baseCol + frame;
  const texture = getAdamTexture(row, col);

  return (
    <Sprite
      texture={texture}
      x={x}
      y={y - 64} // Dịch lên trên 64px để 2 chân của nhân vật vẫn chạm đúng mặt đất (khớp collision cũ)
      width={64}
      height={128} // Vì tỷ lệ gốc là 16x32, render ra x4 lần
      anchor={0}
      zIndex={y}
      tint={tint}
    />
  );
};

const Player: React.FC<{
  mapData: MapData;
  onZoneChange: ((zone: Zone | null) => void) | undefined;
  isPaused: boolean;
  onInteract: (() => void) | undefined;
  updatePosition: (x: number, y: number, isSitting?: boolean) => void;
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

  const [direction, setDirection] = useState<DirString>("down");
  const [isMoving, setIsMoving] = useState(false);
  const [isSitting, setIsSitting] = useState(false);
  const sitOrigin = useRef<{ x: number; y: number } | null>(null);

  const speed = 4;
  const keys = useMemo(() => new Set<string>(), []);

  // Refs để đồng bộ dữ liệu vào event listener
  const xRef = useRef(x);
  xRef.current = x;
  const yRef = useRef(y);
  yRef.current = y;
  const dirRef = useRef(direction);
  dirRef.current = direction;
  const currentZoneRef = useRef(currentZone);
  currentZoneRef.current = currentZone;
  const isSittingRef = useRef(isSitting);
  isSittingRef.current = isSitting;
  const lastSyncSit = useRef(isSitting);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keys.add(e.key.toLowerCase());
      if (e.key.toLowerCase() === "e" && !isPaused) {
        // Nhấn E khi ĐANG NGỒI -> Thoát ghế
        if (isSittingRef.current) {
          setIsSitting(false);
          if (sitOrigin.current) {
            setX(sitOrigin.current.x);
            setY(sitOrigin.current.y);
            sitOrigin.current = null;
          }
          return;
        }

        // Tính toán ô vuông ngay trước mặt nhân vật
        let focusX = xRef.current;
        let focusY = yRef.current;
        const dir = dirRef.current;
        const interactRange = 64;

        if (dir === "up") focusY -= interactRange;
        if (dir === "down") focusY += interactRange;
        if (dir === "left") focusX -= interactRange;
        if (dir === "right") focusX += interactRange;

        // Quy đổi ra lưới Grid của TiledMap
        const focusCol = Math.floor((focusX + 32) / 64);
        const focusRow = Math.floor((focusY + 32) / 64);

        const layer4 = mapData.layers.find(
          (l) => l.name === "Tile Layer 4" || l.name === "Furniture",
        );
        let foundChair = false;

        if (layer4 && focusCol >= 0 && focusRow >= 0) {
          const tileIndex = focusRow * mapData.width + focusCol;
          const rawGid = layer4.data[tileIndex] & 0x1fffffff;

          let isChair = false;

          if (rawGid >= 392) {
            const localId = rawGid - 392;
            // 542: Phần đệm ngồi của ghế (chỉ cho phép ngồi lên đệm ghế)
            if (localId === 542) {
              isChair = true;
            }
          }

          if (isChair) {
            setIsSitting(true);
            // Lưu tọa độ đứng hiện tại lấy đường thoái lui
            sitOrigin.current = { x: xRef.current, y: yRef.current };
            // Dịch lên đệm ghế
            setX(focusCol * 64);
            setY(focusRow * 64);
            foundChair = true;
          }
        }

        // Nếu không có ghế mà có Zone ẩn thì kích hoạt Zone Interaction
        if (!foundChair && currentZoneRef.current) {
          onInteract?.();
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [keys, isPaused, onInteract, mapData]);

  useTick((delta) => {
    if (isPaused) {
      if (isMoving) setIsMoving(false);
      return;
    }

    if (isSitting) {
      // Thoát ghế tự động nếu người dùng kéo mũi tên / WASD
      const isPressingMove =
        keys.has("w") ||
        keys.has("a") ||
        keys.has("s") ||
        keys.has("d") ||
        keys.has("arrowup") ||
        keys.has("arrowdown") ||
        keys.has("arrowleft") ||
        keys.has("arrowright");
      if (isPressingMove) {
        setIsSitting(false);
        if (sitOrigin.current) {
          setX(sitOrigin.current.x);
          setY(sitOrigin.current.y);
          sitOrigin.current = null;
        }
      }
      return; // Bỏ qua việc tính toán di chuyển/va chạm khi nhân vật đã ngồi trên ghế
    }

    let nextX = x;
    let nextY = y;

    if (keys.has("w") || keys.has("arrowup")) nextY -= speed * delta;
    if (keys.has("s") || keys.has("arrowdown")) nextY += speed * delta;
    if (keys.has("a") || keys.has("arrowleft")) nextX -= speed * delta;
    if (keys.has("d") || keys.has("arrowright")) nextX += speed * delta;

    const dx = nextX - x;
    const dy = nextY - y;

    if (dx !== 0 || dy !== 0) {
      setIsMoving(true);
      setDirection((prevDir) => getNewDirection(dx, dy, prevDir));
    } else {
      setIsMoving(false);
    }

    const solidLayers = mapData.layers.filter(
      (l) => l.name !== "Tile Layer 1" && l.name !== "Floor",
    );
    if (solidLayers.length > 0 && (nextX !== x || nextY !== y)) {
      const tileWidth = 64;

      const pRect = {
        left: nextX + 16,
        right: nextX + 48,
        top: nextY + 32,
        bottom: nextY + 64,
      };

      let collision = false;
      for (const layer of solidLayers) {
        if (collision) break;
        for (let i = 0; i < layer.data.length; i++) {
          if (layer.data[i] !== 0) {
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
    if (nextX !== x || nextY !== y || isSittingRef.current !== lastSyncSit.current) {
      updatePosition(nextX, nextY, isSittingRef.current);
      lastSyncSit.current = isSittingRef.current;
    }

    // Proximity check for Video Calls
    const now = Date.now();
    if (now - lastNearbyTrigger.current > 500) {
      // Check every 500ms for responsiveness
      let foundPlayerId: string | null = null;
      for (const [id, remoteUser] of Object.entries(players)) {
        const dist = Math.sqrt(
          Math.pow(nextX - remoteUser.x, 2) + Math.pow(nextY - remoteUser.y, 2),
        );
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
    <AnimatedPlayerSprite
      x={x}
      y={y}
      direction={direction}
      isMoving={isMoving}
      isSitting={isSitting}
    />
  );
};

const OtherPlayer: React.FC<{ player: RemotePlayer }> = ({ player }) => {
  const [x, setX] = useState(player.x);
  const [y, setY] = useState(player.y);

  const [direction, setDirection] = useState<DirString>("down");
  const [isMoving, setIsMoving] = useState(false);

  // Lerp smoothing
  useTick((delta) => {
    const dx = player.x - x;
    const dy = player.y - y;

    if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
      if (!isMoving) setIsMoving(true);
      setDirection((prevDir) => getNewDirection(dx, dy, prevDir));
    } else {
      if (isMoving) setIsMoving(false);
    }

    setX((prev) => prev + dx * 0.1 * delta);
    setY((prev) => prev + dy * 0.1 * delta);
  });

  return (
    <AnimatedPlayerSprite
      x={x}
      y={y}
      direction={direction}
      isMoving={isMoving}
      isSitting={player.isSitting}
      tint={0x88ff88}
    />
  );
};
