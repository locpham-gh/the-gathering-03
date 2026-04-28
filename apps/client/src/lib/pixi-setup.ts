import * as PIXI from "pixi.js";

export const setupPixi = () => {
  // Pixi Settings
  const pixiSettings = PIXI.settings as unknown as { 
    RENDER_OPTIONS: { hello: boolean }; 
    ROUND_PIXELS: boolean;
  };

  if (pixiSettings.RENDER_OPTIONS) {
    pixiSettings.RENDER_OPTIONS.hello = false;
  }

  // ✅ Anti-glitch: Enable rounding and disable mipmaps
  pixiSettings.ROUND_PIXELS = true;
  PIXI.BaseTexture.defaultOptions.scaleMode = PIXI.SCALE_MODES.NEAREST;
  PIXI.BaseTexture.defaultOptions.mipmap = PIXI.MIPMAP_MODES.OFF;
  
  // High precision for fragment shaders to prevent pixel drift
  PIXI.settings.PRECISION_FRAGMENT = PIXI.PRECISION.HIGH;

  // Silence common but harmless/unfixable console warnings
  const originalWarn = console.warn;
  const originalError = console.error;

  console.warn = (...args: unknown[]) => {
    const msg = typeof args[0] === "string" ? args[0] : "";
    if (msg.includes("renderer.plugins.interaction has been deprecated")) return;
    if (msg.includes("Item with key lk-user-choices does not exist")) return;
    if (msg.includes("Cross-Origin-Opener-Policy")) return;
    originalWarn(...args);
  };

  console.error = (...args: unknown[]) => {
    const msg = typeof args[0] === "string" ? args[0] : "";
    if (msg.includes("NotFoundError") || msg.includes("Requested device not found")) return;
    if (msg.includes("error waiting for media permissons")) return;
    originalError(...args);
  };
};
