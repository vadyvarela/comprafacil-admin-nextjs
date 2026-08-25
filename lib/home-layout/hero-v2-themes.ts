/** Temas de fundo do Hero v2 — techarena + backoffice (manter alinhados). */

export const HERO_V2_THEME_IDS = [
  "darkOrange",
  "midnightBlue",
  "emeraldNight",
  "violetDusk",
  "slateSteel",
  "oceanTeal",
  "roseNight",
] as const

export type HeroV2ThemeId = (typeof HERO_V2_THEME_IDS)[number]

export type HeroV2Theme = {
  id: HeroV2ThemeId
  label: string
  accent: string
  base: string
  glows: readonly string[]
}

export const HERO_V2_THEMES: Record<HeroV2ThemeId, HeroV2Theme> = {
  darkOrange: {
    id: "darkOrange",
    label: "Escuro · laranja",
    accent: "#f97316",
    base: "#0c0c0e",
    glows: [
      "radial-gradient(ellipse 70% 55% at 72% 35%, color-mix(in srgb, #f97316 28%, transparent) 0%, transparent 58%)",
      "radial-gradient(ellipse 50% 40% at 15% 80%, rgba(255,255,255,0.06) 0%, transparent 55%)",
      "radial-gradient(ellipse 40% 30% at 90% 90%, color-mix(in srgb, #f97316 12%, transparent) 0%, transparent 50%)",
    ],
  },
  midnightBlue: {
    id: "midnightBlue",
    label: "Meia-noite · azul",
    accent: "#3b82f6",
    base: "#070b16",
    glows: [
      "radial-gradient(ellipse 75% 60% at 78% 32%, color-mix(in srgb, #2563eb 34%, transparent) 0%, transparent 58%)",
      "radial-gradient(ellipse 55% 45% at 12% 78%, color-mix(in srgb, #1d4ed8 18%, transparent) 0%, transparent 55%)",
      "radial-gradient(ellipse 40% 35% at 55% 100%, color-mix(in srgb, #60a5fa 14%, transparent) 0%, transparent 50%)",
    ],
  },
  emeraldNight: {
    id: "emeraldNight",
    label: "Noite · esmeralda",
    accent: "#10b981",
    base: "#06110e",
    glows: [
      "radial-gradient(ellipse 70% 55% at 74% 30%, color-mix(in srgb, #10b981 30%, transparent) 0%, transparent 58%)",
      "radial-gradient(ellipse 50% 40% at 10% 75%, color-mix(in srgb, #059669 16%, transparent) 0%, transparent 55%)",
      "radial-gradient(ellipse 45% 30% at 92% 88%, color-mix(in srgb, #34d399 12%, transparent) 0%, transparent 50%)",
    ],
  },
  violetDusk: {
    id: "violetDusk",
    label: "Crepúsculo · violeta",
    accent: "#a855f7",
    base: "#0c0814",
    glows: [
      "radial-gradient(ellipse 72% 58% at 76% 34%, color-mix(in srgb, #8b5cf6 32%, transparent) 0%, transparent 58%)",
      "radial-gradient(ellipse 48% 42% at 14% 80%, color-mix(in srgb, #6d28d9 16%, transparent) 0%, transparent 55%)",
      "radial-gradient(ellipse 40% 28% at 88% 92%, color-mix(in srgb, #c084fc 12%, transparent) 0%, transparent 50%)",
    ],
  },
  slateSteel: {
    id: "slateSteel",
    label: "Aço · ardósia",
    accent: "#94a3b8",
    base: "#0f1218",
    glows: [
      "radial-gradient(ellipse 70% 55% at 70% 30%, color-mix(in srgb, #64748b 26%, transparent) 0%, transparent 58%)",
      "radial-gradient(ellipse 50% 40% at 18% 78%, rgba(255,255,255,0.07) 0%, transparent 55%)",
      "radial-gradient(ellipse 42% 32% at 90% 90%, color-mix(in srgb, #94a3b8 14%, transparent) 0%, transparent 50%)",
    ],
  },
  oceanTeal: {
    id: "oceanTeal",
    label: "Oceano · teal",
    accent: "#14b8a6",
    base: "#061316",
    glows: [
      "radial-gradient(ellipse 72% 56% at 75% 32%, color-mix(in srgb, #0d9488 32%, transparent) 0%, transparent 58%)",
      "radial-gradient(ellipse 50% 42% at 12% 76%, color-mix(in srgb, #0891b2 18%, transparent) 0%, transparent 55%)",
      "radial-gradient(ellipse 40% 30% at 90% 88%, color-mix(in srgb, #2dd4bf 12%, transparent) 0%, transparent 50%)",
    ],
  },
  roseNight: {
    id: "roseNight",
    label: "Noite · rosa",
    accent: "#f43f5e",
    base: "#12080c",
    glows: [
      "radial-gradient(ellipse 70% 55% at 74% 34%, color-mix(in srgb, #e11d48 30%, transparent) 0%, transparent 58%)",
      "radial-gradient(ellipse 48% 40% at 14% 78%, color-mix(in srgb, #be123c 14%, transparent) 0%, transparent 55%)",
      "radial-gradient(ellipse 40% 28% at 88% 90%, color-mix(in srgb, #fb7185 12%, transparent) 0%, transparent 50%)",
    ],
  },
}

export const HERO_V2_THEME_OPTIONS = HERO_V2_THEME_IDS.map((id) => ({
  value: id,
  label: HERO_V2_THEMES[id].label,
}))

export function resolveHeroV2Theme(id: string | null | undefined): HeroV2Theme {
  if (id && id in HERO_V2_THEMES) return HERO_V2_THEMES[id as HeroV2ThemeId]
  return HERO_V2_THEMES.darkOrange
}
