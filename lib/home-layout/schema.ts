import { z } from "zod"
import { isAllowedInternalHref } from "./internal-href"
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

const newsletterBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal("newsletter"),
  enabled: z.boolean().default(true),
  props: z
    .object({
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

const trustStripItemSchema = z
  .object({
    icon: z.enum(["truck", "shield", "store", "card", "support"]),
    label: z.string().min(1).max(90),
    sublabel: z.string().max(140).optional(),
  })
  .strict()

const trustStripBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal("trustStrip"),
  enabled: z.boolean().default(true),
  props: z
    .object({
      items: z.array(trustStripItemSchema).min(2).max(4),
    })
    .strict(),
})

const productPairPropsSchema = z
  .object({
    eyebrow: z.string().max(48).optional(),
    title: z.string().max(HOME_LAYOUT_RULES.titleMax).optional(),
    subtitle: z.string().max(HOME_LAYOUT_RULES.subtitleMax).optional(),
    leftProductId: z.string().uuid(),
    rightProductId: z.string().uuid(),
    layout: z.enum(["equal", "asymmetric"]).default("equal"),
  })
  .strict()
  .refine((p) => p.leftProductId !== p.rightProductId, {
    message: "Os dois produtos devem ser diferentes.",
    path: ["rightProductId"],
  })

const productPairBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal("productPair"),
  enabled: z.boolean().default(true),
  props: productPairPropsSchema,
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

const splitDealLimitSchema = z.number().int().min(4).max(8)

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
    productIds: z.array(z.string().uuid()).max(8).optional(),
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

export const homeBlockSchema = z.discriminatedUnion("type", [
  heroBlockSchema,
  productRailBlockSchema,
  categoryRailBlockSchema,
  multiCategoryRailsBlockSchema,
  newsletterBlockSchema,
  recentlyViewedBlockSchema,
  trustStripBlockSchema,
  productPairBlockSchema,
  promoDuoBlockSchema,
  splitDealRailBlockSchema,
])

export const homeLayoutDocumentSchema = z
  .object({
    schemaVersion: z.literal(1),
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
