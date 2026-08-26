/** Defaults Hero v2 — manter alinhados techarena + backoffice. */

export const DEFAULT_HERO_V2_SLIDES = [
  {
    id: "slide-1",
    badge: "NOVO",
    productLabel: "iPhone 17 Pro Max",
    headline: "Tecnologia sem",
    headlineAccent: "complicações.",
    subtitle:
      "Os melhores smartphones e acessórios, com garantia, entrega rápida e atendimento próximo.",
    primaryCtaLabel: "Ver oferta",
    primaryCtaHref: "/categoria/smartphones",
    secondaryCtaLabel: "Comprar no WhatsApp",
    imageUrl:
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "iPhone 17 Pro Max",
    pricePrefix: "A partir de",
    price: "149.900 CVE",
    stockLabel: "Em stock",
    warrantyLabel: "Garantia de 1 ano",
  },
] as const

/** @deprecated — UI usa card de produto no slide */
export const DEFAULT_HERO_V2_SIDE_FEATURES = [] as const

export const DEFAULT_HERO_V2_TRUST_ITEMS = [
  {
    icon: "truck" as const,
    tone: "orange" as const,
    label: "Entrega em todo Cabo Verde",
    sublabel: "Todas as ilhas",
  },
  {
    icon: "shield" as const,
    tone: "green" as const,
    label: "Garantia de 1 ano",
    sublabel: "Em todos os produtos",
  },
  {
    icon: "pin" as const,
    tone: "red" as const,
    label: "Levantamento grátis",
    sublabel: "A. Santo Antonio e Palmarejo",
  },
  {
    icon: "support" as const,
    tone: "blue" as const,
    label: "Suporte WhatsApp",
    sublabel: "Rápido e próximo",
  },
  {
    icon: "star" as const,
    tone: "yellow" as const,
    label: "Clientes satisfeitos",
    sublabel: "4.9/5 (mais de 50+)",
  },
] as const

export function defaultHeroV2Props() {
  return {
    theme: "darkOrange" as const,
    slides: DEFAULT_HERO_V2_SLIDES.map((s) => ({ ...s })),
    sideFeatures: [] as [],
    trustItems: DEFAULT_HERO_V2_TRUST_ITEMS.map((t) => ({ ...t })),
    autoplayMs: 6000,
  }
}
