// ------------------------------------
// MAP CONFIGURATION
// ------------------------------------
export const MAP_CONFIG = {
  version: "v3" as "v2" | "v3" | "v4",
};

export type MapVersion = "v2" | "v3" | "v4";

export const MAP_OPTIONS: Array<{
  value: MapVersion;
  label: string;
  description: string;
}> = [
  { value: "v3", label: "School (v3)", description: "Classroom / School layout" },
  { value: "v2", label: "Office 1 (v2)", description: "Main office layout" },
  { value: "v4", label: "Office 2 (v4)", description: "Alternative office layout" },
];
