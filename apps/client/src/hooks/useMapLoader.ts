import { useState, useEffect } from "react";
import type { MapData } from "../types/game";

export function useMapLoader(mapType: string) {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const normalizeMap = (mt: string) => {
      if (!mt) return "office";
      const lower = mt.toLowerCase().replace(/[\s_]/g, "");
      if (lower.includes("office2") || lower.includes("merged") || lower.includes("officecombined")) return "office_combined";
      if (lower.includes("school") || lower.includes("classroom")) return "classroom";
      if (lower.includes("cafe") || lower.includes("lounge")) return "cafe";
      return "office";
    };

    const mapName = normalizeMap(mapType);
    const mapFile = `/maps/${mapName}_map.json`;
    
    // Wrap state resets in a micro-task to avoid cascading render warning
    Promise.resolve().then(() => {
      setLoading(true);
      setMapData(null);
    });

    fetch(mapFile)
      .then((res) => {
        if (!res.ok) throw new Error("Map not found");
        return res.json();
      })
      .then((data) => {
        setMapData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load map:", err);
        // Fallback to office if café fails (e.g. file not found)
        if (mapName !== "office") {
          fetch("/maps/office_map.json")
            .then(r => r.json())
            .then(d => {
              setMapData(d);
              setLoading(false);
            });
        } else {
          setError(err.message);
          setLoading(false);
        }
      });
  }, [mapType]);

  return { mapData, loading, error };
}
