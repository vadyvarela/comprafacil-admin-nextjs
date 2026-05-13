export const HOME_BLOCK_TYPES = [
  "hero",
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

export const HOME_BLOCK_REGISTRY: Record<
  HomeBlockType,
  { label: string; description: string; hint?: string }
> = {
  hero: {
    label: "Hero",
    description: "Carrossel principal no topo da home.",
    hint: "Imagens vêm de Marketing → Banners (posições hero e hero-side). Não escolhes ficheiros aqui.",
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
    description:
      "Lista produtos de uma única categoria do gateway.",
    hint: "Escolhe a categoria no menu; a loja mostra essa lista. Várias categorias = vários blocos deste tipo.",
  },
  multiCategoryRails: {
    label: "Várias categorias (legado)",
    description:
      "Várias secções de categoria num só bloco (slugs ou categorias «na home»).",
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
