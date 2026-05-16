import * as PIXI from "pixi.js";

export type DirString = "right" | "up" | "left" | "down";

export interface RemotePlayer {
  id: string; // Socket ID
  userId?: string; // Database User ID
  x: number;
  y: number;
  direction?: string;
  lastUpdate: number;
  isSitting?: boolean;
  character?: string;
  displayName?: string;
  avatarUrl?: string;
  emote?: { id: string; timestamp: number };
  chatBubble?: { text: string; timestamp: number };
  isPhoneOut?: boolean;
  isBusy?: boolean;
}

export interface Zone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type?: string;
  label?: string;
  description?: string;
}

export interface MapLayer {
  name: string;
  data?: number[];
  layers?: MapLayer[];
  objects?: Array<{ x: number; y: number; width: number; height: number; name?: string; type?: string }>;
  opacity: number;
  visible: boolean;
}

export interface MapTileset {
  firstgid: number;
  name?: string;
  image?: string;
  source?: string;
  imagewidth?: number;
  imageheight?: number;
  tilewidth?: number;
  tileheight?: number;
  columns?: number;
}

export interface MapData {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  layers: MapLayer[];
  tilesets: MapTileset[];
  backgroundImage?: string;
}

export interface TileData {
  texture: PIXI.Texture;
  flipX: boolean;
  flipY: boolean;
  tilesetName?: string;
}

export interface LocalPosition {
  x: number;
  y: number;
}
