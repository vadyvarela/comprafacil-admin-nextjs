import type { HomeLayoutDocument } from "./schema"
import { homeLayoutDocumentSchema } from "./schema"
import { migrateHomeLayoutDocumentRaw } from "./migrate-raw-layout"

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
      id: "f47ac10b-58cc-4372-a567-0e02b2c3d409",
      type: "trustStrip",
      enabled: true,
      props: {
        items: [
          { icon: "truck", label: "Entrega nacional", sublabel: "Prazos no checkout" },
          { icon: "shield", label: "Pagamento seguro", sublabel: "Dados protegidos" },
          { icon: "store", label: "Levanta na loja", sublabel: "Sem custo" },
          { icon: "support", label: "Apoio ao cliente", sublabel: "Resposta rápida" },
        ],
      },
    },
    {
      id: "f47ac10b-58cc-4372-a567-0e02b2c3d40a",
      type: "promoDuo",
      enabled: true,
      props: {
        items: [
          {
            title: "Mega descontos esta semana",
            subtitle: "Campanhas por tempo limitado na loja.",
            ctaLabel: "Ver ofertas",
            href: "/ofertas",
            gradient: "purple",
          },
          {
            title: "Novidades em destaque",
            subtitle: "Os últimos lançamentos.",
            ctaLabel: "Explorar",
            href: "/produtos?sort=newest",
            gradient: "blue",
          },
          {
            title: "Mais vendidos",
            ctaLabel: "Ver ranking",
            href: "/produtos?sort=bestsellers",
            gradient: "orange",
          },
        ],
      },
    },
    {
      id: "f47ac10b-58cc-4372-a567-0e02b2c3d40b",
      type: "splitDealRail",
      enabled: true,
      props: {
        panelEyebrow: "Hot deals",
        panelTitle: "Ofertas em destaque",
        panelDescription: "Painel editorial + grelha compacta de produtos em promoção.",
        panelCtaLabel: "Ver todas",
        panelCtaHref: "/ofertas",
        panelGradient: "slate",
        variant: "on_sale",
        limit: 4,
        seeAllHref: "/ofertas",
      },
    },
    {
      id: "f47ac10b-58cc-4372-a567-0e02b2c3d402",
      type: "productRail",
      enabled: true,
      props: {
        variant: "newest",
        railCardStyle: "tile",
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
        railCardStyle: "tile",
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
        railCardStyle: "tile",
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
        railCardStyle: "tile",
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

homeLayoutDocumentSchema.parse(migrateHomeLayoutDocumentRaw(DEFAULT_HOME_LAYOUT))
