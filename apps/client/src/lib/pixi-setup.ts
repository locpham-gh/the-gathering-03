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

  // ✅ Anti-glitch: Disable rounding and mipmaps to prevent edge bleeding on zoomed maps
  pixiSettings.ROUND_PIXELS = true;
  PIXI.BaseTexture.defaultOptions.scaleMode = PIXI.SCALE_MODES.NEAREST;
  PIXI.BaseTexture.defaultOptions.mipmap = PIXI.MIPMAP_MODES.OFF;

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
