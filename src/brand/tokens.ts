// ─────────────────────────────────────────────────────────────────────────────
// GAP PARTNERS — BRAND TOKENS (single source of truth for JS)
// Guido · Austin · PCL joint venture. LIGHT MODE.
//
// These values are mirrored into Tailwind utilities via the @theme block in
// index.css. Import from here anywhere JS needs a raw color/font (e.g. recharts,
// inline SVG). Do NOT hardcode brand hex values elsewhere.
// ─────────────────────────────────────────────────────────────────────────────

export const colors = {
  // Surfaces
  surface: "#FFFFFF",
  panel: "#F6F7F8",
  cardBorder: "#E3E5E8",

  // Chrome (header/footer bars — matches the GAP cover)
  chrome: "#111214",        // near-black bar background
  chromeMuted: "#9A9DA2",   // muted gray text on the dark bars

  // Text
  ink: "#1A1C1F",
  muted: "#6B6E73",

  // Accents
  teal: "#00B0A8",     // primary — headline number, active states
  magenta: "#EC008C",
  orange: "#F5821F",
  coral: "#F86464",
  purple: "#9643FC",
} as const;

// The GAP signature tricolor, in order (equal thirds).
export const tricolor = [colors.teal, colors.magenta, colors.orange] as const;

// Palette used to cycle chart series/bars. Teal leads (primary), then the rest.
export const chartPalette = [
  colors.teal,
  colors.magenta,
  colors.orange,
  colors.coral,
  colors.purple,
] as const;

export const fonts = {
  sans: '"Inter", "Barlow", system-ui, sans-serif',
  display: '"Barlow", "Inter", system-ui, sans-serif',
} as const;

export type BrandColor = keyof typeof colors;
