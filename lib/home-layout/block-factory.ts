import type { HomeBlock } from "./schema"
import type { HomeBlockType } from "./registry"
import {
  defaultShoeStoreExploreProps,
  defaultShoeStoreHeroProps,
} from "./shoe-store-defaults"

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function createEmptyBlock(type: HomeBlockType): HomeBlock {
  const id = newId()
  switch (type) {
    case "hero":
      return { id, type: "hero", enabled: true, props: {} }
    case "shoeStoreHero":
      return { id, type: "shoeStoreHero", enabled: true, props: defaultShoeStoreHeroProps() }
    case "shoeStoreExplore":
      return { id, type: "shoeStoreExplore", enabled: true, props: defaultShoeStoreExploreProps() }
    case "trustStrip":
      return {
        id,
        type: "trustStrip",
        enabled: true,
        props: {
          items: [
            { icon: "truck" as const, label: "Entrega em todo o país", sublabel: "Prazos no checkout" },
            { icon: "shield" as const, label: "Pagamento seguro", sublabel: "Dados protegidos" },
            { icon: "store" as const, label: "Levanta na loja", sublabel: "Grátis" },
          ],
        },
      }
    case "productPair":
      return {
        id,
        type: "productPair",
        enabled: true,
        props: {
          eyebrow: "Em destaque",
          title: "Escolhe dois produtos",
          subtitle: "Substitui pelos produtos reais no picker abaixo.",
          leftProductId: "550e8400-e29b-41d4-a716-446655440001",
          rightProductId: "550e8400-e29b-41d4-a716-446655440002",
          layout: "equal" as const,
        },
      }
    case "promoDuo":
      return {
        id,
        type: "promoDuo",
        enabled: true,
        props: {
          items: [
            {
              title: "Descontos até 50%",
              subtitle: "Em artigos seleccionados.",
              ctaLabel: "Comprar agora",
              href: "/ofertas",
              gradient: "purple" as const,
            },
            {
              title: "Novidades da semana",
              subtitle: "Lançamentos frescos.",
              ctaLabel: "Ver novidades",
              href: "/produtos?sort=newest",
              gradient: "blue" as const,
            },
          ],
        },
      }
    case "splitDealRail":
      return {
        id,
        type: "splitDealRail",
        enabled: true,
        props: {
          panelEyebrow: "Promoções",
          panelTitle: "Ofertas em destaque",
          panelDescription: "Seleção de produtos com desconto.",
          panelCtaLabel: "Ver ofertas",
          panelCtaHref: "/ofertas",
          panelGradient: "blue" as const,
          variant: "on_sale" as const,
          limit: 4,
          seeAllHref: "/ofertas",
        },
      }
    case "productRail":
      return {
        id,
        type: "productRail",
        enabled: true,
        props: {
          variant: "newest",
          railCardStyle: "tile",
          title: "Nova secção",
          limit: 8,
          seeAllHref: "/produtos?sort=newest",
        },
      }
    case "categoryRail":
      return {
        id,
        type: "categoryRail",
        enabled: true,
        props: {
          categorySlug: "smartphones",
          limit: 5,
          seeAllHref: "/categoria/smartphones",
        },
      }
    case "multiCategoryRails":
      return {
        id,
        type: "multiCategoryRails",
        enabled: true,
        props: { maxSections: 3 },
      }
    case "newsletter":
      return { id, type: "newsletter", enabled: true, props: { variant: "banner" } }
    case "recentlyViewed":
      return { id, type: "recentlyViewed", enabled: true, props: { limit: 8 } }
  }
}
