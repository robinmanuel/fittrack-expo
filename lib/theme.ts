export const DARK = {
  bg:       "#0d0d0d",
  bg2:      "#1a1a1a",
  surface:  "#1f1f1f",
  surface2: "#2a2a2a",
  border:   "#000000",
  text:     "#f0f0f0",
  text2:    "#888888",
  accent:   "#ff5c00",
  accent2:  "#ffbe00",
  accent3:  "#00e5ff",
  danger:   "#ff3b3b",
  success:  "#00e676",
  card:     "#1f1f1f",
} as const;

export const LIGHT = {
  bg:       "#f5f0e8",
  bg2:      "#ede8dc",
  surface:  "#ffffff",
  surface2: "#e8e3d8",
  border:   "#000000",
  text:     "#0d0d0d",
  text2:    "#666666",
  accent:   "#ff5c00",
  accent2:  "#ffbe00",
  accent3:  "#0055cc",
  danger:   "#cc0000",
  success:  "#007700",
  card:     "#ffffff",
} as const;

export type ColorScheme = typeof DARK;

// Shared shadow style for neo-brutalism
export const shadow = {
  shadowColor: "#000",
  shadowOffset: { width: 4, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 6,
};

export const shadowSm = {
  shadowColor: "#000",
  shadowOffset: { width: 2, height: 2 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 3,
};
