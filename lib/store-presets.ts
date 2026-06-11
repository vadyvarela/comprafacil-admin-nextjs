export type StoreVertical = "tech" | "fashion" | "beauty" | "automotive" | "general"
export type LayoutMode = "editorial" | "classic"
export type FontFamily = "poppins" | "inter" | "playfair"

export type StoreThemeTokens = {
  colorBackground: string
  colorSurface: string
  colorPaper: string
  colorForeground: string
  colorMuted: string
  colorInk: string
  colorBorder: string
  colorBorderSubtle: string
  colorPrimary: string
  colorPrimaryDark: string
  colorPrimaryLight: string
  fontFamily: FontFamily
  layoutMode: LayoutMode
  storeVertical: StoreVertical
  tagline: string
}

export const STORE_VERTICAL_OPTIONS: { value: StoreVertical; label: string }[] = [
  { value: "tech", label: "Tecnologia" },
  { value: "fashion", label: "Moda / Sapatos" },
  { value: "beauty", label: "Beleza" },
  { value: "automotive", label: "Motas / Automóvel" },
  { value: "general", label: "Geral" },
]

export const LAYOUT_MODE_OPTIONS: { value: LayoutMode; label: string }[] = [
  { value: "editorial", label: "Editorial" },
  { value: "classic", label: "Clássico" },
]

export const FONT_FAMILY_OPTIONS: { value: FontFamily; label: string }[] = [
  { value: "poppins", label: "Poppins" },
  { value: "inter", label: "Inter" },
  { value: "playfair", label: "Playfair Display" },
]

export const STORE_THEME_PRESETS: Record<StoreVertical, StoreThemeTokens> = {
  tech: {
    colorBackground: "#ffffff",
    colorSurface: "#ffffff",
    colorPaper: "#f8fafc",
    colorForeground: "#171717",
    colorMuted: "#6b7280",
    colorInk: "#0f172a",
    colorBorder: "#e5e7eb",
    colorBorderSubtle: "#f3f4f6",
    colorPrimary: "#2563eb",
    colorPrimaryDark: "#1d4ed8",
    colorPrimaryLight: "#3b82f6",
    fontFamily: "poppins",
    layoutMode: "editorial",
    storeVertical: "tech",
    tagline: "Loja de Eletrônicos",
  },
  fashion: {
    colorBackground: "#ffffff",
    colorSurface: "#fafaf9",
    colorPaper: "#f5f5f4",
    colorForeground: "#1c1917",
    colorMuted: "#78716c",
    colorInk: "#1c1917",
    colorBorder: "#e7e5e4",
    colorBorderSubtle: "#f5f5f4",
    colorPrimary: "#b45309",
    colorPrimaryDark: "#92400e",
    colorPrimaryLight: "#d97706",
    fontFamily: "playfair",
    layoutMode: "editorial",
    storeVertical: "fashion",
    tagline: "Loja de Sapatos e Moda",
  },
  beauty: {
    colorBackground: "#fff1f2",
    colorSurface: "#ffffff",
    colorPaper: "#ffe4e6",
    colorForeground: "#881337",
    colorMuted: "#be123c",
    colorInk: "#881337",
    colorBorder: "#fecdd3",
    colorBorderSubtle: "#ffe4e6",
    colorPrimary: "#e11d48",
    colorPrimaryDark: "#be123c",
    colorPrimaryLight: "#fb7185",
    fontFamily: "poppins",
    layoutMode: "editorial",
    storeVertical: "beauty",
    tagline: "Produtos de Beleza",
  },
  automotive: {
    colorBackground: "#f8fafc",
    colorSurface: "#ffffff",
    colorPaper: "#f1f5f9",
    colorForeground: "#0f172a",
    colorMuted: "#64748b",
    colorInk: "#0f172a",
    colorBorder: "#cbd5e1",
    colorBorderSubtle: "#e2e8f0",
    colorPrimary: "#dc2626",
    colorPrimaryDark: "#b91c1c",
    colorPrimaryLight: "#ef4444",
    fontFamily: "inter",
    layoutMode: "classic",
    storeVertical: "automotive",
    tagline: "Motas e Acessórios",
  },
  general: {
    colorBackground: "#ffffff",
    colorSurface: "#ffffff",
    colorPaper: "#f9fafb",
    colorForeground: "#111827",
    colorMuted: "#6b7280",
    colorInk: "#111827",
    colorBorder: "#e5e7eb",
    colorBorderSubtle: "#f3f4f6",
    colorPrimary: "#4f46e5",
    colorPrimaryDark: "#4338ca",
    colorPrimaryLight: "#6366f1",
    fontFamily: "poppins",
    layoutMode: "editorial",
    storeVertical: "general",
    tagline: "Loja Online",
  },
}

export const DEFAULT_STORE_THEME = STORE_THEME_PRESETS.tech

export function themeTokensFromGql(
  row: Partial<{ [K in keyof StoreThemeTokens]: StoreThemeTokens[K] | null }> | null | undefined
): StoreThemeTokens {
  const preset = STORE_THEME_PRESETS[(row?.storeVertical as StoreVertical) ?? "tech"] ?? DEFAULT_STORE_THEME
  return {
    colorBackground: row?.colorBackground ?? preset.colorBackground,
    colorSurface: row?.colorSurface ?? preset.colorSurface,
    colorPaper: row?.colorPaper ?? preset.colorPaper,
    colorForeground: row?.colorForeground ?? preset.colorForeground,
    colorMuted: row?.colorMuted ?? preset.colorMuted,
    colorInk: row?.colorInk ?? preset.colorInk,
    colorBorder: row?.colorBorder ?? preset.colorBorder,
    colorBorderSubtle: row?.colorBorderSubtle ?? preset.colorBorderSubtle,
    colorPrimary: row?.colorPrimary ?? preset.colorPrimary,
    colorPrimaryDark: row?.colorPrimaryDark ?? preset.colorPrimaryDark,
    colorPrimaryLight: row?.colorPrimaryLight ?? preset.colorPrimaryLight,
    fontFamily: (row?.fontFamily as FontFamily) ?? preset.fontFamily,
    layoutMode: (row?.layoutMode as LayoutMode) ?? preset.layoutMode,
    storeVertical: (row?.storeVertical as StoreVertical) ?? preset.storeVertical,
    tagline: row?.tagline ?? preset.tagline,
  }
}
