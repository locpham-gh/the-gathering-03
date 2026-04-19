# Map Creation & Integration Guide

The Gathering uses Tiled JSON maps. Follow these standards to ensure compatibility with our custom PixiJS engine.

## 📏 Standards & Scale
- **Grid Size**: 32x32 pixels in Tiled.
- **Game Scale**: The engine scales tiles by approx **2.01x** (output size = 64x64px per tile). 
- **Coordinates**: To find a game coordinate, multiply Tiled index by 64. 
  - *Example*: (25, 25) in Tiled = (1600, 1600) in-game.

## 🗺 Tileset Configuration (GID Offsets)
The engine handles three primary tilesets. If you add a new one, you **must** update the `getTileDataForGid` function in `lib/tileUtils.ts` with the new First GID (Global ID) offset.

Current Offsets (Map v2):
| Tileset | Source File | First GID | Columns |
| :--- | :--- | :--- | :--- |
| Room Builder | `Room_Builder_v2_32x32.png` | 1 | 17 |
| Serene Village | `Serene_Village_32x32.png` | 392 | 19 |
| Interiors | `Interiors_free_32x32.png` | 1247 | 16 |

## 🏗 Layer Structure
The engine filters layers by name to determine collision physics:

### 1. Flooring (Non-Solid)
- `floor`, `floor 2`, `Floor`, `Tile Layer 1`.
- **Logic**: No collision checks are performed on these layers.

### 2. Solid Layers (Collisions)
- `object`, `furniture`, `walls`, `Tile Layer 2`, `Tile Layer 4`.
- **Logic**: The `Player.tsx` physics engine treats any non-empty tile in these layers as a solid wall.

### 3. Object Groups (Metadata)
- Tiled **Object Selection** layers are ignored by the tile renderer. Use them only for metadata (like spawning points) if you update the JSON parser.

##  Sitz (Sitting Mechanic)
To make a chair interactive:
1. Place a chair sprite in a Solid Layer (e.g., `Furniture`).
2. Ensure the GID corresponds to a known seat ID in the `Player.tsx` sit logic (currently GIDs based on `Serene Village` offset + `542` local ID).

## 🚀 Export Settings
- **Format**: JSON.
- **Encoding**: CSV (Base64 is NOT supported).
- **Embed Tilesets**: Ensure tilesets are embedded in the JSON for the simpler parsing logic.
