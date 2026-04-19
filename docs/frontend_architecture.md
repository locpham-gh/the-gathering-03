# Frontend Architecture - The Gathering

This document outlines the React + PixiJS integration for the Metaverse client.

## 🏗 Component Tree (Modular Refactor)

The game engine was refactored in April 2026 to solve "God Component" complexity. The logic is now decoupled:

### 1. `GameCanvas.tsx`
- **Role**: Orchestrator & Pixi Stage Initializer.
- **Responsibilities**: 
  - Handles window resize to maintain full-screen stage.
  - Fetches the Tiled JSON map data.
  - Manages the `worldRef` (the main moving camera container).
  - Renders the child modules.

### 2. `MapRender.tsx`
- **Role**: World Renderer.
- **Optimization**: Uses `React.memo` to prevent re-rendering 2500+ tiles unless the map JSON changes.
- **Logic**: Iterates through Tiled layers and produces `<Sprite />` components with a `2.01` scale fix for sub-pixel gaps.

### 3. `Player.tsx`
- **Role**: Local Physics & Input.
- **Responsibilities**:
  - Keyboard input (`W/A/S/D`, `E`).
  - Collision detection against solid layers.
  - **Camera Logic**: Calculates camera displacement and applies **physical pixel snapping** to the `worldRef` for visual stability.
  - Emits `updatePosition` events to the multiplayer hook.

### 4. `OtherPlayer.tsx`
- **Role**: Remote Interpolation.
- **Logic**: Uses a Linear Interpolation (Lerp) logic within `useTick` to smooth out the movement of players broadcasted via WebSockets.

### 5. `AnimatedPlayerSprite.tsx`
- **Role**: Presentation Layer.
- **Logic**: Purely visual component managing spritesheet row/column offsets based on `direction`, `isMoving`, and `isSitting`.

## 🎮 Game Loop & State Management

- **Rendering**: Handled by `@pixi/react`'s `<Stage />` and `<Container />`.
- **Game Logic**: Executed via the `useTick` hook (60fps cycle).
- **Multiplayer State**: Managed by the `useMultiplayer` hook, which uses a standard WebSocket ref to keep the connection alive outside the render cycle.
- **Anti-Glitch System**:
  - `image-rendering: pixelated` on the canvas.
  - `Math.round(val * dpr) / dpr` for camera position to avoid "shifting" walls on high-res displays.

## 🛠 Libraries Used
- `pixi.js`: 2D WebGL renderer.
- `@pixi/react`: React bindings for Pixi.
- `tailwindcss`: Premium UI overlays and glassmorphism.
