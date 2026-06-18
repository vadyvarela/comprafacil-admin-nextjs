export type StoreBrandSummary = {
  siteName: string
  logoUrl: string | null
  faviconUrl: string | null
}

export const DEFAULT_STORE_BRAND: StoreBrandSummary = {
  siteName: "Admin",
  logoUrl: null,
  faviconUrl: null,
}

export function adminTitle(siteName: string): string {
  return `${siteName} Admin`
}

export function normalizeStoreBrand(row: {
  siteName?: string | null
  logoUrl?: string | null
  faviconUrl?: string | null
} | null | undefined): StoreBrandSummary {
  const siteName = row?.siteName?.trim()
  if (!siteName) return DEFAULT_STORE_BRAND

  return {
    siteName,
    logoUrl: row?.logoUrl?.trim() || null,
    faviconUrl: row?.faviconUrl?.trim() || null,
  }
}
