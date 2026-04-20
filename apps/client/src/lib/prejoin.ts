import type { Character2D } from "./profile";
import { sanitizeCharacter2D } from "./profile";

export interface PrejoinSettings {
  preferredMicId?: string;
  preferredCameraId?: string;
  micEnabled: boolean;
  cameraEnabled: boolean;
  lastDisplayName?: string;
  lastAvatarUrl?: string;
  lastCharacter2d?: Character2D;
}

const PREJOIN_STORAGE_KEY = "prejoin_settings_v1";

export const loadPrejoinSettings = (): PrejoinSettings => {
  const defaults: PrejoinSettings = {
    micEnabled: false,
    cameraEnabled: false,
  };

  const raw = localStorage.getItem(PREJOIN_STORAGE_KEY);
  if (!raw) return defaults;

  try {
    const parsed = JSON.parse(raw) as PrejoinSettings;
    return {
      ...defaults,
      ...parsed,
      lastCharacter2d: sanitizeCharacter2D(parsed.lastCharacter2d),
    };
  } catch {
    return defaults;
  }
};

export const savePrejoinSettings = (settings: PrejoinSettings): void => {
  const normalized: PrejoinSettings = {
    ...settings,
    lastCharacter2d: sanitizeCharacter2D(settings.lastCharacter2d),
  };
  localStorage.setItem(PREJOIN_STORAGE_KEY, JSON.stringify(normalized));
};
