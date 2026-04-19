# The Gathering - Project Context (Updated 2026-04-19)

## 🎯 Current Status
The project is in a stable, production-ready state with a modular architecture. We have successfully transitioned from a monolithic "God Component" to a clean, decoupled rendering engine. The core focus has shifted to the **Library** feature, with non-essential zones (Reception/Forum) removed to streamline the MVP.

## 🛠 Tech Stack
- **Monorepo**: Bun Workspaces.
- **Backend**: Bun + ElysiaJS + MongoDB (Mongoose).
- **Frontend**: React (Vite) + Tailwind CSS + PixiJS (@pixi/react).
- **Communication**: Native Bun WebSockets for real-time positional sync.
- **Media**: LiveKit (Integrated for future positional audio/video).

## ✅ Major Milestones Completed

### 1. Modular Rendering Engine
The `GameCanvas.tsx` has been refactored into atomic components:
- `MapRender`: Memoized world renderer for high-performance 50x50 map display.
- `Player`: Handles local physics, collisions, and DPI-aware camera logic.
- `OtherPlayer`: Handles remote player interpolation (Lerp).
- `AnimatedPlayerSprite`: Manages character states (Idle, Walk, Sit).
- `tileUtils`: Centralized logic for GID mapping and texture caching.

### 2. High-DPI & Zoom Stability
Resolved visual artifacts (tearing/shifting walls) caused by browser zoom levels (110%, 150%, etc.):
- **DPI-aware Camera**: Snaps container coordinates to physical pixels using `window.devicePixelRatio`.
- **Sub-pixel Fix**: Tiles are scaled to `2.01` (slight overlap) to eliminate rounding gaps.

### 3. Map System v2
- Integration of `office_map_new.json` (50x50 tiles).
- Support for multiple tilesets (`Room_Builder`, `Interiors`, `Serene_Village`) with custom GID offsets.
- Interaction zones mapped to the new coordinates (Library at top-right).

### 4. Core Features
- **Sitting Mechanic**: Pressing `E` near chairs (`GID 542`) triggers a sitting state that syncs across the network.
- **Library Resource Hub**: Integrated with `resourcesApi` to show documents and topics.

## ⚠️ Technical Requirements & Constraints
- **Coordinate System**: Uses a 64px virtual grid (32px assets scaled x2).
- **Multiplayer Protocol**: 
  - `move` (Client -> Server): Throttled to 20Hz (50ms) unless state (Sitting) changes.
  - `player_moved` (Server -> Client): Broadcasts position, direction, and sitting status.
- **Anti-Glitch**: Avoid using integer-only rounding for the `worldRef` container; use the physical pixel snapping logic in `Player.tsx`.

## 🚀 Roadmap
- **Proximity Audio**: Integrating LiveKit more deeply to enable spatial voice chat in the Library.
- **Enhanced Interactions**: Adding "shared whiteboard" or "collaborative document" triggers in specific zones.
- **Performance**: Investigating Tile-Chunking if the map expands beyond 100x100.

---
*Status: Architecture Refactor 100% Complete. Focus shifted to Feature Expansion.*
