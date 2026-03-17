// ── Still — minimalist, calm, warm ───────────────────────
export const DARK = {
  bg:       "#16181a",   // deep blue-grey
  bg2:      "#1e2124",
  surface:  "#23272b",   // card surface
  surface2: "#2c3035",   // input bg
  border:   "#2c3035",   // same as surface2 - invisible borders
  text:     "#e8e4df",   // warm white
  text2:    "#7a8490",   // cool grey
  accent:   "#8fa68e",   // muted sage
  accent2:  "#b89e82",   // warm sand
  accent3:  "#7a9eb0",   // muted slate blue
  danger:   "#b08080",   // muted rose
  success:  "#8fa68e",
  card:     "#23272b",
} as const;

export const LIGHT = {
  bg:       "#f7f5f2",   // warm cream
  bg2:      "#f0ece7",
  surface:  "#ffffff",
  surface2: "#f0ece7",
  border:   "#e8e3dc",
  text:     "#2a2825",   // warm near-black
  text2:    "#9a9088",   // warm grey
  accent:   "#5e7d5c",   // deep sage
  accent2:  "#8c6d4a",   // warm brown
  accent3:  "#4a6d82",   // muted teal
  danger:   "#8c4a4a",   // muted brick
  success:  "#5e7d5c",
  card:     "#ffffff",
} as const;

export type ColorScheme = typeof DARK;

// Soft elevation — no hard offset, gentle blur
export const shadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12,
  shadowRadius: 8,
  elevation: 3,
};

export const shadowSm = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.08,
  shadowRadius: 4,
  elevation: 2,
};

// Shared radius scale
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;
