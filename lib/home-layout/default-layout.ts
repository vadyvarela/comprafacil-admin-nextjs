import type { HomeLayoutDocument } from "./schema"
import { homeLayoutDocumentSchema } from "./schema"

/** Igual à techarena — ponto de partida no editor quando não há rascunho/publicação. */
export const DEFAULT_HOME_LAYOUT: HomeLayoutDocument = {
  schemaVersion: 1,
  blocks: [
    {
      id: "f47ac10b-58cc-4372-a567-0e02b2c3d401",
      type: "hero",
      enabled: true,
      props: {},
    },
    {
      id: "f47ac10b-58cc-4372-a567-0e02b2c3d402",
      type: "productRail",
      enabled: true,
      props: {
        variant: "newest",
        title: "Recém chegados",
        subtitle: "Lançamentos e produtos recém-chegados",
        limit: 10,
        seeAllHref: "/produtos?sort=newest",
      },
    },
    {
      id: "f47ac10b-58cc-4372-a567-0e02b2c3d403",
      type: "productRail",
      enabled: true,
      props: {
        variant: "featured",
        title: "Produtos em destaque",
        subtitle: "Selecionados especialmente para ti",
        limit: 5,
      },
    },
    {
      id: "f47ac10b-58cc-4372-a567-0e02b2c3d404",
      type: "recentlyViewed",
      enabled: true,
      props: { limit: 8 },
    },
    {
      id: "f47ac10b-58cc-4372-a567-0e02b2c3d405",
      type: "productRail",
      enabled: true,
      props: {
        variant: "bestsellers",
        title: "Mais vendidos",
        subtitle: "Os produtos mais populares",
        limit: 5,
        seeAllHref: "/produtos?sort=bestsellers",
      },
    },
    {
      id: "f47ac10b-58cc-4372-a567-0e02b2c3d406",
      type: "productRail",
      enabled: true,
      props: {
        variant: "on_sale",
        title: "Ofertas especiais",
        subtitle: "Produtos com desconto",
        limit: 5,
        seeAllHref: "/ofertas",
      },
    },
    {
      id: "f47ac10b-58cc-4372-a567-0e02b2c3d407",
      type: "categoryRail",
      enabled: true,
      props: {
        categorySlug: "smartphones",
        title: "Por categoria",
        limit: 8,
        seeAllHref: "/categoria/smartphones",
      },
    },
    {
      id: "f47ac10b-58cc-4372-a567-0e02b2c3d408",
      type: "newsletter",
      enabled: true,
      props: {
        title: "Ofertas exclusivas no teu email",
        subtitle: "Sê o primeiro a saber das melhores promoções",
      },
    },
  ],
}

homeLayoutDocumentSchema.parse(DEFAULT_HOME_LAYOUT)
