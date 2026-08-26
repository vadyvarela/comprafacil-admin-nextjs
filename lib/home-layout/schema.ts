import { z } from "zod"
import { isAllowedInternalHref, isInternalPathHref } from "./internal-href"
import { migrateHomeLayoutDocumentRaw } from "./migrate-raw-layout"

/** Regra Fase 0 — manter alinhado com techarena/lib/home-layout/schema.ts */
export const HOME_LAYOUT_RULES = {
  maxBlocks: 30,
  railLimitMin: 1,
  railLimitMax: 24,
  titleMax: 120,
  subtitleMax: 200,
  slugPattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  maxCategorySlugs: 10,
  maxHeaderNavItems: 12,
  maxSectionsMin: 1,
  maxSectionsMax: 10,
} as const

const slugSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(HOME_LAYOUT_RULES.slugPattern, "slug inválido")

const internalHrefSchema = z
  .string()
  .min(1)
  .refine(isAllowedInternalHref, "seeAllHref deve ser um path interno permitido")

const looseInternalHrefSchema = z
  .string()
  .min(1)
  .max(2048)
  .refine(isInternalPathHref, "Destino deve ser um path interno (ex.: /produtos)")

/** Path interno (/…) ou URL http(s) — Oferta da semana. */
const anyHrefSchema = z
  .string()
  .min(1)
  .max(2048)
  .refine((v) => {
    const t = v.trim()
    if (/^https?:\/\//i.test(t)) {
      try {
        const u = new URL(t)
        return u.protocol === "http:" || u.protocol === "https:"
      } catch {
        return false
      }
    }
    return t.startsWith("/") && !t.startsWith("//")
  }, "ctaHref deve ser um path (/…) ou URL http(s)")

const weeklyDealGlowSchema = z.enum([
  "blue",
  "purple",
  "orange",
  "green",
  "slate",
  "rose",
  "cyan",
  "amber",
])

const railLimitSchema = z
  .number()
  .int()
  .min(HOME_LAYOUT_RULES.railLimitMin)
  .max(HOME_LAYOUT_RULES.railLimitMax)

const heroBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal("hero"),
  enabled: z.boolean().default(true),
  props: z.object({}).strict(),
})

const productRailPropsSchema = z
  .object({
    variant: z.enum(["newest", "featured", "bestsellers", "on_sale", "curated"]),
    /** tile = cartões verticais (scroll no mobile); row = cartão horizontal em grelha. */
    railCardStyle: z.enum(["tile", "row"]).default("tile"),
    title: z.string().min(1).max(HOME_LAYOUT_RULES.titleMax),
    subtitle: z.string().max(HOME_LAYOUT_RULES.subtitleMax).optional(),
    limit: railLimitSchema,
    seeAllHref: internalHrefSchema.optional(),
    productIds: z.array(z.string().uuid()).max(HOME_LAYOUT_RULES.railLimitMax).optional(),
  })
  .strict()
  .superRefine((p, ctx) => {
    if (p.variant === "curated") {
      if (!p.productIds?.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Variante «curated» exige pelo menos um UUID em productIds.",
          path: ["productIds"],
        })
      }
    } else if (p.productIds != null && p.productIds.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "productIds só pode ser usado com variante «curated».",
        path: ["productIds"],
      })
    }
  })

const productRailBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal("productRail"),
  enabled: z.boolean().default(true),
  props: productRailPropsSchema,
})

const categoryRailBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal("categoryRail"),
  enabled: z.boolean().default(true),
  props: z
    .object({
      /** UUID no GTW — preenchido ao escolher na lista no editor. */
      categoryId: z.string().uuid().optional(),
      categorySlug: slugSchema,
      title: z.string().min(1).max(HOME_LAYOUT_RULES.titleMax).optional(),
      subtitle: z.string().max(HOME_LAYOUT_RULES.subtitleMax).optional(),
      limit: railLimitSchema,
      seeAllHref: internalHrefSchema.optional(),
    })
    .strict(),
})

const multiCategoryRailsBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal("multiCategoryRails"),
  enabled: z.boolean().default(true),
  props: z
    .object({
      slugs: z.array(slugSchema).min(1).max(HOME_LAYOUT_RULES.maxCategorySlugs).optional(),
      maxSections: z
        .number()
        .int()
        .min(HOME_LAYOUT_RULES.maxSectionsMin)
        .max(HOME_LAYOUT_RULES.maxSectionsMax)
        .optional(),
    })
    .strict()
    .refine(
      (p) =>
        (p.slugs != null && p.slugs.length > 0) !== (p.maxSections != null),
      { message: "Indica `slugs` (lista) OU `maxSections`, não ambos nem nenhum" }
    ),
})

const newsletterVariantSchema = z.enum(["banner", "strip", "card"])

const newsletterBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal("newsletter"),
  enabled: z.boolean().default(true),
  props: z
    .object({
      variant: newsletterVariantSchema.optional(),
      title: z.string().min(1).max(HOME_LAYOUT_RULES.titleMax).optional(),
      subtitle: z.string().max(HOME_LAYOUT_RULES.subtitleMax).optional(),
    })
    .strict(),
})

const recentlyViewedBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal("recentlyViewed"),
  enabled: z.boolean().default(true),
  props: z
    .object({
      limit: railLimitSchema,
    })
    .strict(),
})


const sectionIntroBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal("sectionIntro"),
  enabled: z.boolean().default(true),
  props: z
    .object({
      title: z.string().min(1).max(HOME_LAYOUT_RULES.titleMax),
      subtitle: z.string().max(HOME_LAYOUT_RULES.subtitleMax).optional(),
    })
    .strict(),
})

const shopByCategoryItemSchema = z
  .object({
    categoryId: z.string().uuid().optional(),
    categorySlug: slugSchema,
    title: z.string().min(1).max(80).optional(),
    imageUrl: z.string().max(2048).optional(),
    href: internalHrefSchema.optional(),
    ctaLabel: z.string().min(1).max(40).optional(),
  })
  .strict()
  .superRefine((item, ctx) => {
    const raw = item.imageUrl?.trim()
    if (!raw) return
    if (!/^https?:\/\//i.test(raw) && !(raw.startsWith("/") && raw.length > 1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Imagem: URL https ou path a começar por /",
        path: ["imageUrl"],
      })
    }
  })

const shopByCategoryBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal("shopByCategory"),
  enabled: z.boolean().default(true),
  props: z
    .object({
      title: z.string().min(1).max(HOME_LAYOUT_RULES.titleMax),
      items: z.array(shopByCategoryItemSchema).min(2).max(8),
    })
    .strict(),
})

const weeklyDealBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal("weeklyDeal"),
  enabled: z.boolean().default(true),
  props: z
    .object({
      title: z.string().min(1).max(HOME_LAYOUT_RULES.titleMax),
      headline: z.string().max(HOME_LAYOUT_RULES.titleMax).optional(),
      endsAt: z.string().min(1).max(40),
      productId: z.string().uuid(),
      productSubtitle: z.string().max(80).optional(),
      ctaLabel: z.string().min(1).max(40),
      ctaHref: anyHrefSchema.optional(),
      badgeLabel: z.string().max(20).optional(),
      glow: weeklyDealGlowSchema.optional(),
      /** Imagem custom (opcional). Se vazio, usa a imagem do produto. */
      imageUrl: z.string().max(2048).optional(),
    })
    .strict()
    .superRefine((p, ctx) => {
      const ms = new Date(p.endsAt).getTime()
      if (!Number.isFinite(ms)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "endsAt deve ser uma data/hora ISO válida.",
          path: ["endsAt"],
        })
      }
      const img = p.imageUrl?.trim()
      if (img) {
        if (!/^https?:\/\//i.test(img) && !(img.startsWith("/") && img.length > 1)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "imageUrl: URL https ou path a começar por /",
            path: ["imageUrl"],
          })
        }
      }
    }),
})


const promoGradientSchema = z.enum(["blue", "purple", "orange", "green", "slate", "rose"])

const promoDuoCellSchema = z
  .object({
    title: z.string().min(1).max(100),
    subtitle: z.string().max(180).optional(),
    ctaLabel: z.string().min(1).max(40),
    href: internalHrefSchema,
    gradient: promoGradientSchema,
    imageUrl: z.string().max(2048).optional(),
  })
  .strict()
  .superRefine((cell, ctx) => {
    const raw = cell.imageUrl?.trim()
    if (!raw) return
    if (!/^https?:\/\//i.test(raw) && !(raw.startsWith("/") && raw.length > 1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Imagem: URL https ou path a começar por /",
        path: ["imageUrl"],
      })
    }
  })

const promoDuoBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal("promoDuo"),
  enabled: z.boolean().default(true),
  props: z
    .object({
      items: z.array(promoDuoCellSchema).min(2).max(4),
    })
    .strict(),
})

const splitDealLimitSchema = z.number().int().min(4).max(10)

const splitDealRailPropsSchema = z
  .object({
    panelEyebrow: z.string().max(48).optional(),
    panelTitle: z.string().min(1).max(HOME_LAYOUT_RULES.titleMax),
    panelDescription: z.string().max(400).optional(),
    panelCtaLabel: z.string().min(1).max(40),
    panelCtaHref: internalHrefSchema,
    panelGradient: promoGradientSchema,
    panelImageUrl: z.string().max(2048).optional(),
    variant: z.enum(["newest", "featured", "bestsellers", "on_sale", "curated"]),
    limit: splitDealLimitSchema,
    seeAllHref: internalHrefSchema.optional(),
    productIds: z.array(z.string().uuid()).max(10).optional(),
  })
  .strict()
  .superRefine((p, ctx) => {
    const img = p.panelImageUrl?.trim()
    if (img && !/^https?:\/\//i.test(img) && !(img.startsWith("/") && img.length > 1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Imagem do painel: URL https ou path a começar por /",
        path: ["panelImageUrl"],
      })
    }
    if (p.variant === "curated") {
      if (!p.productIds?.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Variante «curated» exige pelo menos um UUID em productIds.",
          path: ["productIds"],
        })
      }
    } else if (p.productIds != null && p.productIds.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "productIds só pode ser usado com variante «curated».",
        path: ["productIds"],
      })
    }
  })

const splitDealRailBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal("splitDealRail"),
  enabled: z.boolean().default(true),
  props: splitDealRailPropsSchema,
})

const mediaUrlSchema = z
  .string()
  .min(1)
  .max(2048)
  .superRefine((raw, ctx) => {
    if (!/^https?:\/\//i.test(raw) && !(raw.startsWith("/") && raw.length > 1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Imagem: URL https ou path a começar por /",
      })
    }
  })

const shoeStoreHeroSlideSchema = z
  .object({
    id: z.string().min(1).max(40),
    tag: z.string().max(40).optional(),
    headline: z.string().max(80).optional(),
    ctaLabel: z.string().max(40).optional(),
    ctaHref: looseInternalHrefSchema.optional(),
    imageUrl: mediaUrlSchema,
    imageAlt: z.string().min(1).max(120),
    imagePosition: z.string().max(48).optional(),
    /** Gradiente escuro sobre a imagem. Omitido = activo (slides antigos). */
    showOverlay: z.boolean().optional(),
  })
  .strict()

const shoeStoreHeroPropsSchema = z
  .object({
    slides: z.array(shoeStoreHeroSlideSchema).min(1).max(6),
    autoplayMs: z.number().int().min(3000).max(15000).optional(),
  })
  .strict()

const shoeStoreHeroBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal("shoeStoreHero"),
  enabled: z.boolean().default(true),
  props: shoeStoreHeroPropsSchema,
})

const heroV2ToneSchema = z.enum(["green", "blue", "orange", "purple", "red", "yellow"])

const heroV2SlideSchema = z
  .object({
    id: z.string().min(1).max(40),
    /** Kicker / badge (ex.: ENTREGA EM TODO CABO VERDE) */
    badge: z.string().max(48).optional(),
    /** Nome no card de produto */
    productLabel: z.string().max(60).optional(),
    headline: z.string().min(1).max(80),
    headlineAccent: z.string().max(40).optional(),
    subtitle: z.string().max(HOME_LAYOUT_RULES.subtitleMax).optional(),
    primaryCtaLabel: z.string().min(1).max(40),
    primaryCtaHref: anyHrefSchema,
    secondaryCtaLabel: z.string().max(40).optional(),
    imageUrl: mediaUrlSchema,
    imageAlt: z.string().min(1).max(120),
    pricePrefix: z.string().max(40).optional(),
    price: z.string().max(40).optional(),
    stockLabel: z.string().max(40).optional(),
    warrantyLabel: z.string().max(40).optional(),
  })
  .strict()

const heroV2SideFeatureSchema = z
  .object({
    icon: z.enum(["shield", "truck", "pin", "lock"]),
    tone: heroV2ToneSchema,
    label: z.string().min(1).max(60),
    sublabel: z.string().max(80).optional(),
  })
  .strict()

const heroV2TrustItemSchema = z
  .object({
    icon: z.enum(["truck", "shield", "pin", "support", "star"]),
    tone: heroV2ToneSchema,
    label: z.string().min(1).max(90),
    sublabel: z.string().max(80).optional(),
  })
  .strict()

const heroV2PropsSchema = z
  .object({
    theme: z
      .enum([
        "darkOrange",
        "midnightBlue",
        "emeraldNight",
        "violetDusk",
        "slateSteel",
        "oceanTeal",
        "roseNight",
      ])
      .default("darkOrange"),
    slides: z.array(heroV2SlideSchema).min(1).max(6),
    /** @deprecated — substituído pelo card de produto no slide */
    sideFeatures: z.array(heroV2SideFeatureSchema).max(4).optional().default([]),
    trustItems: z.array(heroV2TrustItemSchema).min(0).max(5).optional(),
    autoplayMs: z.number().int().min(3000).max(15000).optional(),
  })
  .strict()

const heroV2BlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal("heroV2"),
  enabled: z.boolean().default(true),
  props: heroV2PropsSchema,
})

const shoeStoreExploreTileSchema = z
  .object({
    id: z.string().min(1).max(40),
    label: z.string().min(1).max(60),
    description: z.string().max(160).default(""),
    href: internalHrefSchema,
    span: z.enum(["hero", "half", "wide"]),
    imageUrl: mediaUrlSchema,
    imageAlt: z.string().min(1).max(120),
  })
  .strict()

const shoeStoreExplorePropsSchema = z
  .object({
    title: z.string().min(1).max(HOME_LAYOUT_RULES.titleMax),
    seeAllLabel: z.string().min(1).max(40),
    seeAllHref: internalHrefSchema,
    tiles: z.array(shoeStoreExploreTileSchema).min(2).max(6),
  })
  .strict()

const shoeStoreExploreBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal("shoeStoreExplore"),
  enabled: z.boolean().default(true),
  props: shoeStoreExplorePropsSchema,
})

export type ShoeStoreHeroSlideProps = z.infer<typeof shoeStoreHeroSlideSchema>
export type ShoeStoreExploreTileProps = z.infer<typeof shoeStoreExploreTileSchema>
export type HeroV2SlideProps = z.infer<typeof heroV2SlideSchema>

const headerNavToneSchema = z.enum(["default", "promo"]).optional()

const headerNavCategoryItemSchema = z
  .object({
    kind: z.literal("category"),
    slug: slugSchema,
    tone: headerNavToneSchema,
  })
  .strict()

const headerNavLinkItemSchema = z
  .object({
    kind: z.literal("link"),
    label: z.string().min(1).max(80),
    href: internalHrefSchema,
    tone: headerNavToneSchema,
  })
  .strict()

export const headerNavItemSchema = z.discriminatedUnion("kind", [
  headerNavCategoryItemSchema,
  headerNavLinkItemSchema,
])

export type HeaderNavItem = z.infer<typeof headerNavItemSchema>

export const homeBlockSchema = z.discriminatedUnion("type", [
  heroBlockSchema,
  heroV2BlockSchema,
  shoeStoreHeroBlockSchema,
  shoeStoreExploreBlockSchema,
  productRailBlockSchema,
  categoryRailBlockSchema,
  multiCategoryRailsBlockSchema,
  newsletterBlockSchema,
  recentlyViewedBlockSchema,
  shopByCategoryBlockSchema,
  weeklyDealBlockSchema,
  sectionIntroBlockSchema,
  promoDuoBlockSchema,
  splitDealRailBlockSchema,
])

export const homeLayoutDocumentSchema = z
  .object({
    schemaVersion: z.literal(1),
    headerNavItems: z
      .array(headerNavItemSchema)
      .max(HOME_LAYOUT_RULES.maxHeaderNavItems)
      .default([]),
    blocks: z.array(homeBlockSchema).max(HOME_LAYOUT_RULES.maxBlocks),
  })
  .strict()

export type HomeLayoutDocument = z.infer<typeof homeLayoutDocumentSchema>
export type HomeBlock = z.infer<typeof homeBlockSchema>

export type ParseHomeLayoutResult =
  | { success: true; data: HomeLayoutDocument }
  | { success: false; error: z.ZodError }

export function parseHomeLayoutDocument(data: unknown): ParseHomeLayoutResult {
  const parsed = homeLayoutDocumentSchema.safeParse(migrateHomeLayoutDocumentRaw(data))
  if (parsed.success) return { success: true, data: parsed.data }
  return { success: false, error: parsed.error }
}
