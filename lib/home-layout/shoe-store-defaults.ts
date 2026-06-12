/** Defaults partilhados — techarena + backoffice (manter alinhados). */

export const DEFAULT_SHOE_STORE_HERO_SLIDES = [
  {
    id: "running",
    tag: "Running",
    headline: "Ultraleve.",
    ctaLabel: "Comprar",
    ctaHref: "/produtos",
    imageUrl:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=2000&q=85",
    imageAlt: "Corredor com ténis desportivos",
    imagePosition: "center 30%",
  },
  {
    id: "training",
    tag: "Training",
    headline: "Resiste.",
    ctaLabel: "Comprar",
    ctaHref: "/produtos",
    imageUrl:
      "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=2000&q=85",
    imageAlt: "Treino com ténis na ginásio",
    imagePosition: "center",
  },
  {
    id: "street",
    tag: "Street",
    headline: "Move.",
    ctaLabel: "Comprar",
    ctaHref: "/produtos",
    imageUrl:
      "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=2000&q=85",
    imageAlt: "Estilo urbano com sneakers",
    imagePosition: "center 40%",
  },
] as const

export const DEFAULT_SHOE_STORE_EXPLORE_TILES = [
  {
    id: "running",
    label: "Running",
    href: "/produtos",
    span: "hero" as const,
    imageUrl:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Running",
  },
  {
    id: "training",
    label: "Training",
    href: "/produtos",
    span: "half" as const,
    imageUrl:
      "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Training",
  },
  {
    id: "street",
    label: "Street",
    href: "/produtos",
    span: "half" as const,
    imageUrl:
      "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Street",
  },
  {
    id: "novidades",
    label: "Novidades",
    href: "/ofertas",
    span: "wide" as const,
    imageUrl:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1400&q=80",
    imageAlt: "Novidades em calçado",
  },
] as const

export function defaultShoeStoreHeroProps() {
  return {
    slides: DEFAULT_SHOE_STORE_HERO_SLIDES.map((s) => ({ ...s })),
    autoplayMs: 5500,
  }
}

export function defaultShoeStoreExploreProps() {
  return {
    title: "Explora",
    seeAllLabel: "Ver tudo",
    seeAllHref: "/produtos",
    tiles: DEFAULT_SHOE_STORE_EXPLORE_TILES.map((t) => ({ ...t })),
  }
}
