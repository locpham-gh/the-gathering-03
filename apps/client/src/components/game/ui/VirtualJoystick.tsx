import React, { useRef, useEffect, useState } from "react";

export const VirtualJoystick: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const activeKeys = useRef(new Set<string>());
  const [active, setActive] = useState(false);
  const centerRef = useRef({ x: 0, y: 0 });
  const maxDistance = 40;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.targetTouches[0];
      const rect = container.getBoundingClientRect();
      centerRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      setActive(true);
      updatePosition(touch.clientX, touch.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!active) return;
      const touch = e.targetTouches[0];
      updatePosition(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      setActive(false);
      if (knobRef.current) {
        knobRef.current.style.transform = `translate(0px, 0px)`;
      }
      // Release all keys
      activeKeys.current.forEach(key => {
        window.dispatchEvent(new KeyboardEvent("keyup", { key }));
      });
      activeKeys.current.clear();
    };

    const updatePosition = (clientX: number, clientY: number) => {
      const dx = clientX - centerRef.current.x;
      const dy = clientY - centerRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      let knobX = dx;
      let knobY = dy;
      
      if (distance > maxDistance) {
        knobX = (dx / distance) * maxDistance;
        knobY = (dy / distance) * maxDistance;
      }

      if (knobRef.current) {
        knobRef.current.style.transform = `translate(${knobX}px, ${knobY}px)`;
      }

      // Calculate normalized direction vector (-1 to 1)
      const dirX = distance > 0 ? dx / distance : 0;
      const dirY = distance > 0 ? dy / distance : 0;
      
      const threshold = 0.3;
      const newKeys = new Set<string>();
      
      if (dirY < -threshold) newKeys.add("w");
      if (dirY > threshold) newKeys.add("s");
      if (dirX < -threshold) newKeys.add("a");
      if (dirX > threshold) newKeys.add("d");

      // Release keys that are no longer pressed
      activeKeys.current.forEach(key => {
        if (!newKeys.has(key)) {
          window.dispatchEvent(new KeyboardEvent("keyup", { key }));
          activeKeys.current.delete(key);
        }
      });

      // Press new keys
      newKeys.forEach(key => {
        if (!activeKeys.current.has(key)) {
          window.dispatchEvent(new KeyboardEvent("keydown", { key }));
          activeKeys.current.add(key);
        }
      });
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: false });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd, { passive: false });
    container.addEventListener("touchcancel", handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [active]);

  return (
    <div 
      ref={containerRef}
      className="w-32 h-32 rounded-full bg-slate-900/40 border-2 border-white/20 backdrop-blur-md flex items-center justify-center relative touch-none shadow-2xl"
    >
      <div 
        ref={knobRef}
        className="w-14 h-14 rounded-full bg-white/50 backdrop-blur-lg border border-white/40 shadow-inner absolute transition-transform duration-75"
        style={{ transform: "translate(0px, 0px)" }}
      >
        <div className="absolute inset-2 rounded-full bg-white/30" />
      </div>
    </div>
  );
};
