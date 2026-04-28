import { useState, useEffect } from "react";

export function useWindowDimensions() {
  const [dimensions, setDimensions] = useState({
    w: window.innerWidth,
    h: window.innerHeight,
  });

  useEffect(() => {
    const onResize = () => {
      setDimensions({
        w: window.innerWidth,
        h: window.innerHeight,
      });
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return dimensions;
}
