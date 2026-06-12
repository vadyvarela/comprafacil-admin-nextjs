import type { StoreVertical } from "@/lib/store-presets"

export const HOME_BLOCK_TYPES = [
  "hero",
  "shoeStoreHero",
  "shoeStoreExplore",
  "trustStrip",
  "productPair",
  "promoDuo",
  "splitDealRail",
  "productRail",
  "categoryRail",
  "multiCategoryRails",
  "newsletter",
  "recentlyViewed",
] as const

export type HomeBlockType = (typeof HOME_BLOCK_TYPES)[number]

export type HomeBlockRegistryEntry = {
  label: string
  description: string
  hint?: string
  /** Se definido, bloco só aparece nestes verticais. Omitido = todos. */
  verticals?: StoreVertical[]
}

export const HOME_BLOCK_REGISTRY: Record<HomeBlockType, HomeBlockRegistryEntry> = {
  hero: {
    label: "Hero",
    description: "Carrossel principal no topo da home.",
    hint: "Imagens vêm de Marketing → Banners (posições hero e hero-side). Não escolhes ficheiros aqui.",
    verticals: ["tech", "beauty", "automotive", "general"],
  },
  shoeStoreHero: {
    label: "Hero calçado (full-bleed)",
    description: "Slider lifestyle com fotos grandes, tag, headline e botão «Comprar».",
    hint: "Ideal para moda / calçado. Cada slide: imagem (URL ou /path), textos curtos e link interno.",
    verticals: ["fashion", "general"],
  },
  shoeStoreExplore: {
    label: "Explora (grelha bento)",
    description: "Grelha editorial com tiles Running, Training, Street e faixa larga.",
    hint: "Coloca abaixo do hero calçado. Cada tile: label, link, tamanho (hero / metade / largo) e imagem.",
    verticals: ["fashion", "general"],
  },
  trustStrip: {
    label: "Faixa de confiança",
    description: "Ícones + mensagens curtas (envio, pagamento, loja física, apoio).",
    hint: "Entre 2 e 4 itens. Boa secção logo abaixo do hero para variar o layout.",
  },
  productPair: {
    label: "Dois produtos em destaque",
    description: "Dois cartões grandes lado a lado (ou destaque + secundário).",
    hint: "Escolhe exactamente dois produtos no picker. Layout «assimétrico» = primeiro cartão mais largo em desktop.",
  },
  promoDuo: {
    label: "Banners promocionais (2–4)",
    description: "Gradiente + texto + link; 2 a 4 cartões; imagem opcional por cartão.",
    hint: "Links só em paths internos. Imagem: URL https (CDN) ou path absoluto tipo /ficheiro.png.",
  },
  splitDealRail: {
    label: "Painel + grelha de produtos",
    description: "Painel com gradiente e grelha de produtos; imagem opcional no painel.",
    hint: "Ideal para «hot deals». Imagem do painel: URL https ou path /…",
  },
  productRail: {
    label: "Rail de produtos",
    description:
      "Uma fila ou grelha de produtos (novidades, destaques, promoções, lista manual). Formato «tile» = cartão vertical; «row» = cartão horizontal (imagem + texto + botão).",
    hint: "Variante define a origem dos produtos. «Formato» escolhe tile vs. row. «Seleção manual» abre o picker.",
  },
  categoryRail: {
    label: "Rail por categoria",
    description: "Lista produtos de uma única categoria do gateway.",
    hint: "Escolhe a categoria no menu; a loja mostra essa lista. Várias categorias = vários blocos deste tipo.",
  },
  multiCategoryRails: {
    label: "Várias categorias (legado)",
    description: "Várias secções de categoria num só bloco (slugs ou categorias «na home»).",
    hint: "Preferível vários «Rail por categoria» — mais simples de perceber e de reordenar.",
  },
  newsletter: {
    label: "CTA newsletter",
    description: "Faixa com formulário de email na home.",
    hint: "Textos opcionais aqui; o formulário é o mesmo da loja.",
  },
  recentlyViewed: {
    label: "Vistos recentemente",
    description: "Mostra produtos que o visitante já abriu neste browser.",
    hint: "Não usa dados do backoffice — só histórico local do cliente.",
  },
}

export function isHomeBlockType(value: string): value is HomeBlockType {
  return (HOME_BLOCK_TYPES as readonly string[]).includes(value)
}

export function getHomeBlockTypesForVertical(vertical: StoreVertical): HomeBlockType[] {
  return HOME_BLOCK_TYPES.filter((type) => {
    const entry = HOME_BLOCK_REGISTRY[type]
    if (!entry.verticals) return true
    return entry.verticals.includes(vertical)
  })
}

export function defaultAddBlockTypeForVertical(vertical: StoreVertical): HomeBlockType {
  const available = getHomeBlockTypesForVertical(vertical)
  if (vertical === "fashion" && available.includes("shoeStoreHero")) return "shoeStoreHero"
  return available[0] ?? "productRail"
}
