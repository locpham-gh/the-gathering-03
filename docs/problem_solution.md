# Problem & Solution Log

This document tracks identified technical challenges and their implemented resolutions to prevent regression.

## 1. Sub-pixel Tearing (Gap between tiles)
- **Problem**: In PixiJS, floating-point coordinates at certain zoom levels (110%, 150%) cause 1px hairline gaps to appear between tiles.
- **Failed Attempt**: Rounding all sprite coordinates to integers (Math.round) caused jittering and didn't solve zoom-based gaps.
- **Solution**: 
  - Apply `image-rendering: pixelated` to the canvas style.
  - Set `scale` of all tiles to `2.01` (x and y). This creates a 0.01 fractional overlap that is invisible to the eye but fills the sub-pixel gaps entirely.

## 2. Shifting Walls on Zoom
- **Problem**: When changing browser zoom, the boundary between "floor" and "wall" sprites appeared to shift by 1-2 pixels.
- **Cause**: The camera container (`worldRef`) was being snapped to CSS pixels (`Math.round`), but at 150% zoom, a CSS pixel represents 1.5 physical pixels, causing rounding errors.
- **Solution**: **DPI-Aware Physical Pixel Snapping**.
  - Logic: `worldRef.current.x = Math.round(exactPos * dpr) / dpr;`
  - This ensures the camera is always locked to a physical pixel grid regardless of the browser zoom level.

## 3. Directional Glitch (Diagonal movement)
- **Problem**: Moving diagonally caused the character sprite to rapidly flip between left/right and up/down faces.
- **Solution**: **Weighted Direction Logic** in `getNewDirection`. 
  - The function calculates the difference between `dx` and `dy`.
  - If the absolute difference is less than 0.1, it prioritizes keeping the **previous** direction to avoid flickering.

## 4. Map Loading Performance
- **Problem**: Rendering a 50x50 map (2,500 tiles per layer) caused frame drops when updating UI modals.
- **Solution**: 
  - Wrap `MapRender` in `React.memo`.
  - Use `textureCache` and `baseTexture` optimization in `tileUtils.ts` to ensure only one PIXI.Texture instance exists per GID.
