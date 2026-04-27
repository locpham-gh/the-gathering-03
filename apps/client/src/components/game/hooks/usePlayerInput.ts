import { useEffect, useMemo } from "react";

/**
 * Custom hook to handle keyboard input and interaction triggers.
 */
export function usePlayerInput(onInteract?: () => void) {
  const keys = useMemo(() => new Set<string>(), []);
  
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keys.add(e.key.toLowerCase());
      if (e.key.toLowerCase() === "e") {
        onInteract?.();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    const onBlur = () => keys.clear();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [keys, onInteract]);

  return keys;
}
