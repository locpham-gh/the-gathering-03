# Multiplayer Synchronization Guide

This document explains how The Gathering maintains a consistent state across multiple clients.

## 📡 The WebSocket Connection
- **Flow**: Direct WebSocket connection established on entering a room.
- **Hook**: `useMultiplayer.ts` orchestrates the connection.
- **Backend**: Bun's native `ws` handler in `apps/server/src/index.ts`.

## 🚄 Movement Sync (Throttling)
To save bandwidth, the player's position is not sent every frame.
- **Refresh Rate**: 20Hz (every 50ms).
- **Exceptions**: If the `isSitting` state changes, the package is sent **immediately** (bypassing the throttle) to ensure snappy visual feedback for others.

## 🎨 Smooth Visuals (Lerping)
When a remote player's position is received, the character doesn't "teleport" to the new x, y. instead:
- **Component**: `OtherPlayer.tsx`
- **Logic**: Uses Linear Interpolation (Lerp) inside `useTick`.
- **Smoothing Factor**: 0.1 delta. This creates a fluid motion even if the network has jitter.

## 🔄 Lifecycle: Join & Leave
1. **Join**: Server sends `initial_state` with all currently active players in the room.
2. **Move**: Client sends `move`. Server broadcasts `player_moved` to all other subscribers in the room.
3. **Leave**: WebSocket `close` event triggers a `player_left` broadcast to clean up the character sprite on other clients.

## 🪑 Specialized States
### Sitting (`isSitting`)
- **Activation**: Pressing `E` near a seat.
- **Sync**: The `isSitting` boolean is part of the move payload.
- **Rendering**: In `AnimatedPlayerSprite.tsx`, `row 5` is selected when `isSitting` is true, regardless of movement.

## ⚡ Performance Considerations
- **In-memory State**: The server keeps `activePlayers` in a Map. This is extremely fast but volatile (Lost on server restart). For MVP, this is intentional to prioritize low-latency movement.
