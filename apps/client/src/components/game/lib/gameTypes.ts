import * as PIXI from "pixi.js";

export type DirString = "right" | "up" | "left" | "down";

export interface MapLayer {
  name: string;
  data: number[];
}

export interface MapData {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  layers: MapLayer[];
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
