import { z } from "zod"

export const trustBadgeIconSchema = z.enum(["truck", "shield", "store", "card", "support"])
export type TrustBadgeIcon = z.infer<typeof trustBadgeIconSchema>

export const productPageTrustBadgeSchema = z.object({
  enabled: z.boolean(),
  icon: trustBadgeIconSchema,
  title: z.string().max(80),
  subtitle: z.string().max(80).optional(),
})

export const productPageTrustBadgesSchema = z.object({
  delivery: productPageTrustBadgeSchema,
  warranty: productPageTrustBadgeSchema,
})

export type ProductPageTrustBadge = z.infer<typeof productPageTrustBadgeSchema>
export type ProductPageTrustBadges = z.infer<typeof productPageTrustBadgesSchema>

export const DEFAULT_PRODUCT_PAGE_TRUST_BADGES: ProductPageTrustBadges = {
  delivery: {
    enabled: true,
    icon: "truck",
    title: "Entrega em 14 dias Maximo",
    subtitle: "",
  },
  warranty: {
    enabled: true,
    icon: "shield",
    title: "1 Ano garantia",
    subtitle: "Garantia completa",
  },
}

export function parseProductPageTrustBadges(
  raw: string | null | undefined,
): ProductPageTrustBadges {
  if (!raw?.trim()) return DEFAULT_PRODUCT_PAGE_TRUST_BADGES
  try {
    const parsed = JSON.parse(raw) as unknown
    const result = productPageTrustBadgesSchema.safeParse(parsed)
    if (result.success) return result.data
  } catch {
    /* fall through */
  }
  return DEFAULT_PRODUCT_PAGE_TRUST_BADGES
}

export function serializeProductPageTrustBadges(badges: ProductPageTrustBadges): string {
  return JSON.stringify(badges)
}

export const TRUST_BADGE_ICON_OPTIONS: Array<{ value: TrustBadgeIcon; label: string }> = [
  { value: "truck", label: "Caminhão (entrega)" },
  { value: "shield", label: "Escudo (garantia)" },
  { value: "store", label: "Loja física" },
  { value: "card", label: "Cartão (pagamento)" },
  { value: "support", label: "Auriculares (apoio)" },
]
