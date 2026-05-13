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
  { label: string; description: string; hint?: string }
> = {
  hero: {
    label: "Hero",
    description: "Carrossel principal no topo da home.",
    hint: "Imagens vêm de Marketing → Banners (posições hero e hero-side). Não escolhes ficheiros aqui.",
  },
  productRail: {
    label: "Rail de produtos",
    description:
      "Uma fila horizontal de cartões de produto (novidades, destaques, promoções, lista manual, etc.).",
    hint: "Escolhe a variante: define a origem dos produtos. «Seleção manual» abre o picker; não precisas de colar UUID.",
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
