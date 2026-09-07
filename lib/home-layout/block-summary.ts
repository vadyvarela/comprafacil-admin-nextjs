import type { HomeBlock } from "@/lib/home-layout/schema"

/**
 * Uma linha que diz o que a secção **tem agora**, não o que ela é.
 *
 * A lista de secções mostrava só o tipo ("Rail de produtos"), o que obriga a
 * abrir cada uma para saber o que lá está. O resumo torna a lista legível de
 * relance: "Novidades · 8 produtos" diz mais do que o nome do tipo.
 */
export function summarizeHomeBlock(block: HomeBlock): string | null {
  switch (block.type) {
    case "hero":
      return "Gerido em Marketing → Banners"

    case "heroV2":
      return plural(block.props.slides.length, "slide", "slides")

    case "shoeStoreHero":
      return plural(block.props.slides.length, "slide", "slides")

    case "shoeStoreExplore":
      return join(
        block.props.title,
        plural(block.props.tiles.length, "tile", "tiles"),
      )

    case "shopByCategory":
      return join(
        block.props.title,
        plural(block.props.items.length, "categoria", "categorias"),
      )

    case "weeklyDeal":
      return block.props.title

    case "sectionIntro":
      return block.props.title

    case "promoDuo":
      return plural(block.props.items.length, "cartão", "cartões")

    case "splitDealRail":
      return join(variantLabel(block.props.variant), countProducts(block.props.productIds))

    case "productRail":
      return join(
        block.props.title,
        variantLabel(block.props.variant),
        countProducts(block.props.productIds),
      )

    case "categoryRail":
      return join(block.props.title, block.props.categorySlug)

    case "multiCategoryRails": {
      const slugs = block.props.slugs
      if (slugs?.length) return plural(slugs.length, "categoria", "categorias")
      const max = block.props.maxSections
      return max ? `até ${max} secções` : "categorias marcadas na home"
    }

    case "newsletter":
      return join(block.props.title, block.props.variant)

    case "recentlyViewed":
      return "Histórico local do visitante"
  }
}

const VARIANT_LABELS: Record<string, string> = {
  newest: "Novidades",
  featured: "Destaques",
  bestsellers: "Mais vendidos",
  on_sale: "Em promoção",
  curated: "Selecção manual",
}

function variantLabel(variant: string | undefined): string | null {
  if (!variant) return null
  return VARIANT_LABELS[variant] ?? variant
}

function countProducts(ids: string[] | undefined): string | null {
  if (!ids?.length) return null
  return plural(ids.length, "produto", "produtos")
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

function join(...parts: (string | null | undefined)[]): string | null {
  const kept = parts.map((p) => p?.trim()).filter((p): p is string => Boolean(p))
  return kept.length ? kept.join(" · ") : null
}
