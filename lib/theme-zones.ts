import type { StoreThemeTokens } from "@/lib/store-presets"

export type ZoneSurface = {
  custom?: boolean
  background?: string
  foreground?: string
  muted?: string
  border?: string
  primary?: string
  hoverImageSwap?: boolean
}

export type PromoZone = {
  custom?: boolean
  gradientFrom?: string
  gradientVia?: string
  gradientTo?: string
}

export type BadgeZone = {
  custom?: boolean
  sale?: string
  success?: string
  warning?: string
}

export type ThemeZoneOverrides = {
  header?: ZoneSurface
  footer?: ZoneSurface
  navigation?: ZoneSurface
  checkout?: ZoneSurface
  productCard?: ZoneSurface
  promo?: PromoZone
  badge?: BadgeZone
}

const EMPTY: ThemeZoneOverrides = {}

export function parseThemeZoneOverrides(raw: string | null | undefined): ThemeZoneOverrides {
  if (!raw?.trim()) return EMPTY
  try {
    const parsed = JSON.parse(raw) as ThemeZoneOverrides
    return parsed && typeof parsed === "object" ? parsed : EMPTY
  } catch {
    return EMPTY
  }
}

export function serializeThemeZoneOverrides(zones: ThemeZoneOverrides): string | null {
  const hasCustom = Object.values(zones).some(
    (z) => z && typeof z === "object" && "custom" in z && z.custom
  )
  const hasHoverSwap = zones.productCard?.hoverImageSwap === true
  if (!hasCustom && !hasHoverSwap) return null
  return JSON.stringify(zones)
}

function darken(hex: string, amount = 0.35): string {
  const m = hex.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i)
  if (!m) return hex
  const f = (i: number) =>
    Math.max(0, Math.min(255, Math.round(parseInt(m[i], 16) * (1 - amount))))
  return `#${f(1).toString(16).padStart(2, "0")}${f(2).toString(16).padStart(2, "0")}${f(3).toString(16).padStart(2, "0")}`
}

/** Resolve cores efectivas de uma zona para preview no backoffice */
export function resolveZonePreview(
  tokens: StoreThemeTokens,
  overrides: ThemeZoneOverrides,
  zone: keyof Omit<ThemeZoneOverrides, "promo" | "badge">,
): ZoneSurface & { background: string; foreground: string; muted: string; border: string; primary: string } {
  const editorial = tokens.layoutMode === "editorial"
  const defaults: Record<string, ZoneSurface> = {
    header: {
      background: editorial ? tokens.colorPaper : tokens.colorSurface,
      foreground: editorial ? tokens.colorInk : tokens.colorForeground,
      muted: tokens.colorMuted,
      border: tokens.colorBorder,
      primary: tokens.colorPrimary,
    },
    footer: {
      background: editorial ? tokens.colorPaper : tokens.colorSurface,
      foreground: editorial ? tokens.colorInk : tokens.colorForeground,
      muted: tokens.colorMuted,
      border: tokens.colorBorder,
      primary: tokens.colorPrimary,
    },
    navigation: {
      background: tokens.colorSurface,
      foreground: tokens.colorForeground,
      muted: tokens.colorMuted,
      border: tokens.colorBorder,
      primary: tokens.colorPrimary,
    },
    checkout: {
      background: tokens.colorBackground,
      foreground: tokens.colorForeground,
      muted: tokens.colorMuted,
      border: tokens.colorBorder,
      primary: tokens.colorPrimary,
    },
    productCard: {
      background: tokens.colorSurface,
      foreground: tokens.colorForeground,
      muted: tokens.colorMuted,
      border: tokens.colorBorder,
      primary: tokens.colorPrimary,
    },
  }
  const base = defaults[zone] ?? defaults.header
  const o = overrides[zone]
  if (!o?.custom) return { ...base, background: base.background!, foreground: base.foreground!, muted: base.muted!, border: base.border!, primary: base.primary! }
  return {
    background: o.background ?? base.background!,
    foreground: o.foreground ?? base.foreground!,
    muted: o.muted ?? base.muted!,
    border: o.border ?? base.border!,
    primary: o.primary ?? base.primary!,
  }
}

export function resolvePromoPreview(tokens: StoreThemeTokens, overrides: ThemeZoneOverrides) {
  const defaults = {
    gradientFrom: darken(tokens.colorPrimary, 0.55),
    gradientVia: darken(tokens.colorPrimary, 0.25),
    gradientTo: tokens.colorPrimary,
  }
  if (!overrides.promo?.custom) return defaults
  return {
    gradientFrom: overrides.promo.gradientFrom ?? defaults.gradientFrom,
    gradientVia: overrides.promo.gradientVia ?? defaults.gradientVia,
    gradientTo: overrides.promo.gradientTo ?? defaults.gradientTo,
  }
}
