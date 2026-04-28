import { useState, useEffect } from "react";

export function useWindowDimensions() {
  const [dimensions, setDimensions] = useState({
    w: Math.floor(window.innerWidth),
    h: Math.floor(window.innerHeight),
  });

  useEffect(() => {
    const onResize = () => {
      setDimensions({
        w: Math.floor(window.innerWidth),
        h: Math.floor(window.innerHeight),
      });
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return dimensions;
}
