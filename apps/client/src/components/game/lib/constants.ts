/**
 * World & Physics Constants
 */
export const WORLD_CONFIG = {
  TILE_SIZE_RAW: 32,
  TILE_SIZE_VIRTUAL: 64,
  TILE_SCALE: 2.01, // 0.01 extra to hide sub-pixel gaps

  // Keep close to authoritative server speed (8 units / 50ms tick ~= 160 px/s).
  // Match server authority: 8 units / 50ms tick ~= 160 px/s => ~2.67 px/frame at 60fps.
  MOVEMENT_SPEED: 2.7,
  INTERACTION_RANGE: 64,
  PROXIMITY_RANGE: 120,

  // Center-ish safe spawn to avoid furniture collision on join.
  PLAYER_SPAWN_X: 768,
  PLAYER_SPAWN_Y: 576,
};

/**
 * GID mapping constants (from Serene Village & Interiors)
 */
export const TILESET_CONFIG = {
  SERENE_VILLAGE_FIRST_GID: 392,
  INTERIORS_FIRST_GID: 1247,
  ROOM_BUILDER_COLS: 17,
  SERENE_VILLAGE_COLS: 19,
  INTERIORS_COLS: 16,
};
