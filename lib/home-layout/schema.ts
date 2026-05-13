import { z } from "zod"
import { isAllowedInternalHref } from "./internal-href"

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

const productRailBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal("productRail"),
  enabled: z.boolean().default(true),
  props: z
    .object({
      variant: z.enum(["newest", "featured", "bestsellers", "on_sale"]),
      title: z.string().min(1).max(HOME_LAYOUT_RULES.titleMax),
      subtitle: z.string().max(HOME_LAYOUT_RULES.subtitleMax).optional(),
      limit: railLimitSchema,
      seeAllHref: internalHrefSchema.optional(),
    })
    .strict(),
})

const categoryRailBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal("categoryRail"),
  enabled: z.boolean().default(true),
  props: z
    .object({
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

export const homeBlockSchema = z.discriminatedUnion("type", [
  heroBlockSchema,
  productRailBlockSchema,
  categoryRailBlockSchema,
  multiCategoryRailsBlockSchema,
  newsletterBlockSchema,
  recentlyViewedBlockSchema,
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
  const parsed = homeLayoutDocumentSchema.safeParse(data)
  if (parsed.success) return { success: true, data: parsed.data }
  return { success: false, error: parsed.error }
}
