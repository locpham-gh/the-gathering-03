import { useEffect } from "react";
import type { Zone } from "../types/game";

export function useGameEvents({
  onEscape,
  onInteract,
  onEmote,
  currentZone,
  activeZone
}: {
  onEscape: () => void;
  onInteract: () => void;
  onEmote: (emoteId: string) => void;
  currentZone: Zone | null;
  activeZone: Zone | null;
}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "Escape") {
        onEscape();
      } else if (e.key.toLowerCase() === "e" && currentZone && !activeZone) {
        onInteract();
      } else if (["1", "2", "3", "4", "5", "6"].includes(e.key)) {
        const emoteMap: Record<string, string> = {
          "1": "❤️",
          "2": "👍",
          "3": "❓",
          "4": "💡",
          "5": "😂",
          "6": "👋",
        };
        const emoteId = emoteMap[e.key];
        onEmote(emoteId);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onEscape, onInteract, onEmote, currentZone, activeZone]);
}
