export type ProductOffer = {
  enabled: boolean
  /** Ex.: «Pack de proteção» */
  title: string
  /** Itens incluídos, ex.: Capa, Película */
  items: string[]
}

const DEFAULT_TITLE = "Pack de proteção"

export function parseProductOffer(raw: unknown): ProductOffer | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
  const o = raw as Record<string, unknown>
  const items = Array.isArray(o.items)
    ? o.items
        .map((v) => String(v).trim())
        .filter((v) => v.length > 0)
    : []
  const title =
    typeof o.title === "string" && o.title.trim()
      ? o.title.trim()
      : DEFAULT_TITLE
  const enabled = o.enabled === true && items.length > 0
  if (!enabled && items.length === 0 && o.enabled !== true) return null
  return { enabled: o.enabled === true && items.length > 0, title, items }
}

/** Oferta pronta a mostrar na loja (ativada + com itens). */
export function visibleProductOffer(raw: unknown): ProductOffer | null {
  const offer = parseProductOffer(raw)
  if (!offer?.enabled || offer.items.length === 0) return null
  return offer
}

export function productOfferToMetadata(offer: {
  enabled: boolean
  title: string
  items: string[]
}): ProductOffer | undefined {
  const items = offer.items.map((v) => v.trim()).filter(Boolean)
  if (!offer.enabled && items.length === 0) return undefined
  return {
    enabled: offer.enabled && items.length > 0,
    title: offer.title.trim() || DEFAULT_TITLE,
    items,
  }
}
