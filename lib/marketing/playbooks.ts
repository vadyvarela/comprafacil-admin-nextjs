export const MARKETING_PLAYBOOKS = [
  {
    id: "salary-week",
    label: "Semana de salário",
    prompt:
      "Prepara a campanha da semana de salário em Cabo Verde (fim do mês, quando as pessoas recebem). Usa propose_campaign com nome, datas (início e fim desta semana de salário), objectivo sell, canais store+facebook+instagram+whatsapp, gancho em pt-PT, post Facebook, caption Instagram e mensagem WhatsApp. Escolhe 1–3 produtos do catálogo. Propõe também um prompt de imagem Feed 1080x1080 ligado a esta campanha. Não apliques nada — só propostas.",
  },
  {
    id: "slow-stock",
    label: "Esgotar stock parado",
    prompt:
      "Olha para o catálogo e para as vendas. Cria uma campanha desta semana para esgotar produtos parados: propose_campaign com datas, preço riscado (propose_product_merch), copy Facebook/Instagram e um banner. Propõe, não apliques.",
  },
  {
    id: "launch",
    label: "Lançar produto",
    prompt:
      "Quero lançar um produto em destaque. Usa o catálogo (preferência: mais recente ou featured). Cria uma campanha com datas desta semana, posts Facebook e Instagram, e um prompt de imagem Stories. Propõe, não apliques.",
  },
  {
    id: "weekly-pack",
    label: "Campanha da semana",
    prompt:
      "Prepara a campanha da semana: nome claro, datas de segunda a domingo, a mesma frase na loja, Facebook e Instagram, e mensagem WhatsApp. Se já existir uma campanha live, alinha com ela ou propõe a seguinte. Inclui prompts de imagem Feed e Stories. Propõe, não apliques.",
  },
  {
    id: "hero",
    label: "Hero da homepage",
    prompt:
      "Propõe um banner hero para a homepage alinhado com a campanha live (ou a oferta da semana). Título, subtítulo, CTA, link /campanha, prompt de imagem banner largo. Se houver campanha, usa attach_to_campaign. Propõe, não apliques.",
  },
] as const

export type MarketingPlaybookId = (typeof MARKETING_PLAYBOOKS)[number]["id"]
