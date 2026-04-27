import * as PIXI from "pixi.js";
import { WORLD_CONFIG, TILESET_CONFIG } from "./constants";
import type { DirString, TileData, MapData } from "./gameTypes";

export const baseTextures: Record<string, PIXI.BaseTexture> = {};
// Keyed by "sourceImage-localId" to avoid GID collisions between maps
export const textureCache: Record<string, PIXI.Texture> = {};
export const adamTextureCache: Record<string, PIXI.Texture> = {};

export const DIR_COL_OFFSET: Record<DirString, number> = {
  right: 0,
  up: 6,
  left: 12,
  down: 18,
};

/**
 * Maps a Tiled GID to a PIXI Texture and flip flags.
 */
export function getTileDataForGid(rawGid: number, mapData: MapData): TileData | null {
  if (rawGid === 0) return null;

  const flipX = (rawGid & 0x80000000) !== 0;
  const flipY = (rawGid & 0x40000000) !== 0;

  const gid = rawGid & 0x1fffffff;
  if (gid === 0) return null;

  let sourceImage: string = "";
  let columns: number = 0;
  let localId: number = 0;

  // 1. Find the tileset definition for this GID
  let tileset = null;
  for (let i = mapData.tilesets.length - 1; i >= 0; i--) {
    if (gid >= mapData.tilesets[i].firstgid) {
      tileset = mapData.tilesets[i];
      break;
    }
  }

  if (!tileset) return null;

  // 2. Determine image and column count
  if (tileset.image) {
    // Modern maps with embedded tileset info
    sourceImage = tileset.image;
    if (sourceImage.startsWith("tilesets/")) {
      sourceImage = "/" + sourceImage;
    } else if (sourceImage.includes("../tilesets/")) {
      sourceImage = sourceImage.substring(sourceImage.indexOf("/tilesets/"));
    }
    columns = tileset.columns || 1;
    localId = gid - tileset.firstgid;
  } else {
    // Legacy maps with external .tsx tilesets
    const {
      ROOM_BUILDER_COLS,
      SERENE_VILLAGE_COLS,
      INTERIORS_COLS,
    } = TILESET_CONFIG;

    const sourceLower = tileset.source?.toLowerCase() || "";
    
    if (sourceLower.includes("interiors")) {
      sourceImage = "/tilesets/Interiors_free_32x32.png";
      columns = INTERIORS_COLS;
    } else if (sourceLower.includes("room_builder")) {
      sourceImage = "/tilesets/Room_Builder_v2_32x32.png";
      columns = ROOM_BUILDER_COLS;
    } else if (sourceLower.includes("outdor") || sourceLower.includes("serene")) {
      sourceImage = "/tilesets/Serene_Village_32x32.png";
      columns = SERENE_VILLAGE_COLS;
    } else {
      // Fallback fallback - try to guess by ranges if source name is missing/weird
      if (gid >= 1247) {
        sourceImage = "/tilesets/Interiors_free_32x32.png";
        columns = INTERIORS_COLS;
      } else if (gid >= 856 || (mapData.width === 50 && gid < 392)) {
        sourceImage = "/tilesets/Room_Builder_v2_32x32.png";
        columns = ROOM_BUILDER_COLS;
      } else {
        sourceImage = "/tilesets/Serene_Village_32x32.png";
        columns = SERENE_VILLAGE_COLS;
      }
    }
    
    localId = gid - tileset.firstgid;
  }

  if (!sourceImage) {
    console.warn(`[getTileDataForGid] No sourceImage for GID: ${gid}`);
    return null;
  }

  // Ensure BaseTexture is loaded
  if (!baseTextures[sourceImage]) {
    try {
      baseTextures[sourceImage] = PIXI.BaseTexture.from(sourceImage);
    } catch (err) {
      console.error(`[getTileDataForGid] Failed to load texture: ${sourceImage}`, err);
      return null;
    }
  }

  // Unique cache key to avoid collisions between different tilesets/maps
  const cacheKey = `${sourceImage}-${localId}`;
  let texture = textureCache[cacheKey];

  if (!texture) {
    const tx = (localId % columns) * WORLD_CONFIG.TILE_SIZE_RAW;
    const ty = Math.floor(localId / columns) * WORLD_CONFIG.TILE_SIZE_RAW;

    texture = new PIXI.Texture(
      baseTextures[sourceImage],
      new PIXI.Rectangle(
        tx,
        ty,
        WORLD_CONFIG.TILE_SIZE_RAW,
        WORLD_CONFIG.TILE_SIZE_RAW,
      ),
    );
    textureCache[cacheKey] = texture;
  }

  return { texture, flipX, flipY };
}

/**
 * Returns a texture slice for a character spritesheet.
 */
export function getCharacterTexture(
  row: number,
  col: number,
  characterName: string = "Adam",
): PIXI.Texture {
  const key = `${characterName}-${row}-${col}`;
  if (adamTextureCache[key]) return adamTextureCache[key];

  const source = `/sprites/${characterName}_16x16.png`;
  if (!baseTextures[source]) {
    baseTextures[source] = PIXI.BaseTexture.from(source);
  }

  const tx = col * 16;
  const ty = row * 32;
  const texture = new PIXI.Texture(
    baseTextures[source],
    new PIXI.Rectangle(tx, ty, 16, 32),
  );
  adamTextureCache[key] = texture;
  return texture;
}

/**
 * Determines the next facing direction based on movement delta.
 */
export function getNewDirection(
  dx: number,
  dy: number,
  currentDir: DirString,
): DirString {
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

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
    return dx > 0 ? "right" : "left";
  }

  if (absDx > absDy) {
    return dx > 0 ? "right" : "left";
  }
  return dy > 0 ? "down" : "up";
}
