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
    description: "Novidades, destaques, mais vendidos ou promoções.",
  },
  categoryRail: {
    label: "Rail por categoria",
    description: "Produtos de uma categoria (slug).",
  },
  multiCategoryRails: {
    label: "Várias categorias",
    description:
      "Slugs explícitos ou só número máximo: nesse caso usam-se categorias com «mostrar na home» e ordem definida no gateway.",
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
