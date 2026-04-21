import * as PIXI from "pixi.js";

export type DirString = "right" | "up" | "left" | "down";

export interface MapLayerProperty {
  name: string;
  value: unknown;
}

export interface MapLayer {
  name: string;
  data: number[];
  order?: number;
  properties?: MapLayerProperty[];
}

export interface MapTileset {
  firstgid: number;
  image?: string;
  columns?: number;
  tilecount?: number;
  tilewidth?: number;
  tileheight?: number;
}

export interface MapData {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  layers: MapLayer[];
  tilesets?: MapTileset[];
}

export interface TileData {
  texture: PIXI.Texture;
  flipX: boolean;
  flipY: boolean;
}

export interface PlayerState {
  x: number;
  y: number;
  direction: DirString;
  isMoving: boolean;
  isSitting: boolean;
}
