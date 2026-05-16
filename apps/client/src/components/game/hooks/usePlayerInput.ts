import { useEffect, useMemo } from "react";

/**
 * Custom hook to handle keyboard input and interaction triggers.
 */
export function usePlayerInput(onInteract?: () => void, onPhoneToggle?: () => void) {
  const keys = useMemo(() => new Set<string>(), []);
  
  useEffect(() => {
    const debugEnabled = Boolean(import.meta.env.DEV);
    const debugClear = (reason: string) => {
      if (!debugEnabled) return;
      const pressed = Array.from(keys.values());
      if (pressed.length === 0) return;
      console.debug("[usePlayerInput] clear keys", {
        reason,
        pressed,
        at: new Date().toISOString(),
      });
    };

    const clearMovementKeys = () => {
      debugClear("movement-clear");
      keys.delete("w");
      keys.delete("a");
      keys.delete("s");
      keys.delete("d");
      keys.delete("arrowup");
      keys.delete("arrowdown");
      keys.delete("arrowleft");
      keys.delete("arrowright");
    };

    const isTypingTarget = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName?.toLowerCase();
      return (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        el.isContentEditable
      );
    };

    const getNormalizedKey = (e: KeyboardEvent): string => {
      // Use e.code for physical key mapping to avoid IME/keyboard layout issues (e.g. Vietnamese Telex)
      // which can change e.key during composition and cause mismatched keydown/keyup events.
      if (e.code) {
        if (e.code === "KeyW") return "w";
        if (e.code === "KeyA") return "a";
        if (e.code === "KeyS") return "s";
        if (e.code === "KeyD") return "d";
        if (e.code === "KeyE") return "e";
        if (e.code === "KeyQ") return "q";
        if (e.code === "ArrowUp") return "arrowup";
        if (e.code === "ArrowDown") return "arrowdown";
        if (e.code === "ArrowLeft") return "arrowleft";
        if (e.code === "ArrowRight") return "arrowright";
      }
      // Fallback for programmatically dispatched events (like VirtualJoystick)
      return e.key ? e.key.toLowerCase() : "";
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const key = getNormalizedKey(e);
      if (!key) return;

      // Do not control player while typing in chat/forms.
      if (isTypingTarget(e.target)) {
        // Defensive clear: if focus changed and keyup was missed, prevent drift.
        debugClear("typing-target");
        clearMovementKeys();
        return;
      }

      const alreadyPressed = keys.has(key);
      keys.add(key);

      // Only trigger one-shot actions on first keydown (ignore key repeat).
      if (!alreadyPressed && !e.repeat && key === "e") {
        onInteract?.();
      }
      if (!alreadyPressed && !e.repeat && key === "q") {
        onPhoneToggle?.();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const key = getNormalizedKey(e);
      if (key) keys.delete(key);

      // Defensively clear movement keys when a modifier is released.
      // MacOS often swallows keyup events for regular keys if a modifier was held.
      if (e.key === "Meta" || e.key === "Alt" || e.key === "Control") {
        debugClear("modifier-released");
        clearMovementKeys();
      }
    };
    const onBlur = () => {
      debugClear("window-blur");
      keys.clear();
    };
    const onVisibilityChange = () => {
      if (document.hidden) {
        debugClear("document-hidden");
        keys.clear();
      }
    };
    const onWindowFocus = () => {
      // Reset stale pressed keys after returning to the tab/window.
      debugClear("window-focus");
      keys.clear();
    };
    const onPageHide = () => {
      debugClear("pagehide");
      keys.clear();
    };
    const onContextMenu = () => {
      debugClear("contextmenu");
      keys.clear();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onWindowFocus);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onWindowFocus);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [keys, onInteract, onPhoneToggle]);

  return keys;
}
