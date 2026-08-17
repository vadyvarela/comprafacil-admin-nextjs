export const MARKETING_AGENT_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "search_products",
      description: "Pesquisar produtos do catálogo por nome.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_campaigns",
      description: "Listar campanhas (live, agendadas, rascunhos, encerradas) com datas e canais.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", description: "Opcional: draft, scheduled, live, ended" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "propose_campaign",
      description:
        "Propor uma campanha com nome, datas e o mesmo gancho para loja + Facebook + Instagram + WhatsApp.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          objective: { type: "string", enum: ["sell", "awareness", "traffic"] },
          startDate: { type: "string", description: "Data ISO (início)" },
          endDate: { type: "string", description: "Data ISO (fim)" },
          channels: {
            type: "array",
            items: { type: "string", enum: ["store", "facebook", "instagram", "whatsapp"] },
          },
          brief: { type: "string" },
          headline: { type: "string" },
          hook: { type: "string" },
          facebookPost: {
            type: "string",
            description:
              "Post Facebook pronto a colar: 3–6 frases + CTA + 3 a 5 hashtags no fim (produto, CV, oferta).",
          },
          instagramCaption: {
            type: "string",
            description:
              "Caption Instagram pronta a colar: gancho, corpo, CTA, linha em branco, 8 a 12 hashtags.",
          },
          whatsappText: { type: "string" },
          productIds: { type: "array", items: { type: "string" } },
          imageUrls: { type: "array", items: { type: "string" } },
          destinationType: {
            type: "string",
            enum: ["campaign", "product", "category"],
            description: "Para onde o anúncio manda: página campanha, produto ou categoria",
          },
          destinationHref: {
            type: "string",
            description: "Caminho: /campanha, /produto/slug ou /categoria/slug",
          },
          slug: {
            type: "string",
            description: "Slug da página grande (ex. mundial-2026 → /campanha/mundial-2026)",
          },
          pageTheme: {
            type: "string",
            enum: ["default", "black-friday", "carnival", "seasonal"],
            description: "Visual da página de campanha",
          },
          siteTopEnabled: {
            type: "boolean",
            description: "Mostrar faixa no topo do site enquanto a campanha estiver live",
          },
          siteTopText: { type: "string" },
          siteTopSubtext: { type: "string" },
          siteTopCtaLabel: { type: "string" },
          siteTopCtaHref: { type: "string", description: "Ex. /campanha/mundial-2026" },
          siteTopSecondaryCtaLabel: { type: "string" },
          siteTopSecondaryCtaHref: { type: "string" },
        },
        required: ["name", "headline"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "attach_to_campaign",
      description: "Ligar banners, cupões ou imagens a uma campanha existente.",
      parameters: {
        type: "object",
        properties: {
          campaignId: { type: "string" },
          bannerIds: { type: "array", items: { type: "string" } },
          couponIds: { type: "array", items: { type: "string" } },
          imageUrls: { type: "array", items: { type: "string" } },
        },
        required: ["campaignId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "propose_weekly_offer",
      description: "Propor a oferta da semana (gancho único para loja + Facebook + Instagram).",
      parameters: {
        type: "object",
        properties: {
          headline: { type: "string" },
          hook: { type: "string" },
          productIds: { type: "array", items: { type: "string" } },
          productLabel: { type: "string" },
          facebookPost: {
            type: "string",
            description:
              "Post Facebook pronto a colar: 3–6 frases + CTA + 3 a 5 hashtags no fim.",
          },
          instagramCaption: {
            type: "string",
            description:
              "Caption Instagram: gancho, corpo, CTA, linha em branco, 8 a 12 hashtags.",
          },
          whatsappText: { type: "string", description: "Mensagem WhatsApp. Sem hashtags." },
          endsAt: { type: "string", description: "Data ISO opcional" },
          campaignId: { type: "string" },
        },
        required: ["headline"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "propose_social_pack",
      description:
        "Propor um pack de publicação que vende: post Facebook, caption Instagram e WhatsApp, prontos a colar. Sempre com preço CVE se existir no contexto, CTA e hashtags.",
      parameters: {
        type: "object",
        properties: {
          facebookPost: {
            type: "string",
            description:
              "Post Facebook pronto a colar: 3–6 frases + CTA + 3 a 5 hashtags no fim.",
          },
          instagramCaption: {
            type: "string",
            description:
              "Caption Instagram: gancho, corpo, CTA, linha em branco, 8 a 12 hashtags.",
          },
          whatsappText: { type: "string", description: "Mensagem WhatsApp. Sem hashtags." },
          campaignId: { type: "string" },
        },
        required: ["facebookPost", "instagramCaption"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "propose_banner",
      description: "Propor um banner da homepage. imageUrl só se já existir na biblioteca.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          subtitle: { type: "string" },
          buttonText: { type: "string" },
          link: { type: "string" },
          position: { type: "string", enum: ["hero", "hero-side"] },
          imageUrl: { type: "string" },
          imagePrompt: { type: "string" },
          campaignId: { type: "string" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "propose_coupon",
      description: "Propor um cupão com código. Preferir desconto em produto quando fizer mais sentido.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          code: { type: "string" },
          percentOff: { type: "number" },
          amountOff: { type: "number" },
          campaignId: { type: "string" },
        },
        required: ["name", "code"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "propose_product_merch",
      description: "Propor desconto (preço riscado) ou destaque num produto existente.",
      parameters: {
        type: "object",
        properties: {
          productId: { type: "string" },
          discount: { type: "number", description: "Percentagem 0-90" },
          featured: { type: "boolean" },
          campaignId: { type: "string" },
        },
        required: ["productId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "propose_image_prompt",
      description: "Propor um prompt para gerar imagem de campanha (Feed, Stories ou banner).",
      parameters: {
        type: "object",
        properties: {
          prompt: { type: "string" },
          format: { type: "string", enum: ["feed", "stories", "banner"] },
          campaignId: { type: "string" },
        },
        required: ["prompt", "format"],
      },
    },
  },
]
