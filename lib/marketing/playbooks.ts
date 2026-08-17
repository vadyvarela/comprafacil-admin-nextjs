export const MARKETING_PLAYBOOKS = [
  {
    id: "social-post",
    label: "Gerar publicação",
    prompt:
      "Quero um pack de publicação pronto a colar nas redes, que venda. Escolhe 1 produto do catálogo (ou a campanha live). Usa propose_social_pack: facebookPost que vende (gancho, produto, preço CVE se existir, porquê agora, CTA, 3–5 hashtags), instagramCaption (gancho, corpo, CTA, linha em branco, 8–12 hashtags) e whatsappText sem hashtags. Propõe também propose_image_prompt formato feed do mesmo produto. Se houver campanha live, usa campaignId. Não cries campanha nova. Não apliques.",
  },
  {
    id: "salary-week",
    label: "Semana de salário",
    prompt:
      "Prepara a campanha da semana de salário em Cabo Verde (fim do mês, quando as pessoas recebem). Usa propose_campaign com nome, datas, objectivo sell, canais store+facebook+instagram+whatsapp, e um pack de publicação que venda (Facebook com 3–5 hashtags, Instagram com 8–12, WhatsApp sem hashtags). Escolhe 1–3 produtos. Propõe propose_image_prompt Feed. Não apliques.",
  },
  {
    id: "slow-stock",
    label: "Esgotar stock parado",
    prompt:
      "Olha para o catálogo e para as vendas. Cria uma campanha desta semana para esgotar produtos parados: propose_campaign, preço riscado (propose_product_merch), pack de publicação que venda com hashtags, e propose_image_prompt Feed. Propõe, não apliques.",
  },
  {
    id: "launch",
    label: "Lançar produto",
    prompt:
      "Quero lançar um produto em destaque. Usa o catálogo (mais recente ou featured). Campanha desta semana + pack de publicação que venda (FB/IG com hashtags) + propose_image_prompt Stories e Feed. Propõe, não apliques.",
  },
] as const

export const MARKETING_CAMPAIGN_PLAYBOOKS = [
  {
    id: "salary-week",
    label: "Semana de salário",
    prompt:
      "Cria a campanha da semana de salário em Cabo Verde (fim do mês). search_products no catálogo, escolhe 1–3 que vendam agora. propose_campaign completo: nome, datas desta semana, headline, hook, facebookPost que venda (preço CVE se souberes, CTA, 3–5 hashtags), instagramCaption (8–12 hashtags), whatsappText sem hashtags, productIds reais, destinationType campaign. propose_image_prompt Feed. Não apliques.",
  },
  {
    id: "slow-stock",
    label: "Esgotar stock",
    prompt:
      "Campanha desta semana para esgotar stock parado. search_products, escolhe 1–3. propose_campaign completo com copy que venda e hashtags + productIds. propose_image_prompt Feed. Não apliques.",
  },
  {
    id: "launch",
    label: "Lançar produto",
    prompt:
      "Campanha de lançamento. search_products (mais recente ou featured), 1 produto. propose_campaign desta semana com pack de publicação que venda + productIds. propose_image_prompt Feed. Não apliques.",
  },
] as const

export type MarketingPlaybookId = (typeof MARKETING_PLAYBOOKS)[number]["id"]
