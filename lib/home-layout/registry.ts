export const HOME_BLOCK_TYPES = [
  "hero",
  "productRail",
  "categoryRail",
  "multiCategoryRails",
  "newsletter",
  "recentlyViewed",
] as const

export type HomeBlockType = (typeof HOME_BLOCK_TYPES)[number]

export const HOME_BLOCK_REGISTRY: Record<
  HomeBlockType,
  { label: string; description: string }
> = {
  hero: {
    label: "Hero",
    description: "Carrossel (banners hero / hero-side).",
  },
  productRail: {
    label: "Rail de produtos",
    description:
      "Novidades, mais vendidos, promoções, destaques (metadata no GTW) ou seleção manual por UUID — filtrado no gateway.",
  },
  categoryRail: {
    label: "Rail por categoria",
    description:
      "Escolhe a categoria na lista do GTW e mostra produtos. Para mais secções, adiciona vários blocos deste tipo.",
  },
  multiCategoryRails: {
    label: "Várias categorias (legado)",
    description:
      "Modo antigo (slugs ou N categorias). Preferível usar vários blocos «Rail por categoria».",
  },
  newsletter: {
    label: "CTA newsletter",
    description:
      "Faixa promocional com formulário de email; título e subtítulo opcionais em props.",
  },
  recentlyViewed: {
    label: "Vistos recentemente",
    description: "Histórico no browser do cliente.",
  },
}
