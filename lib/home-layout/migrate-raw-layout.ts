/**
 * Normaliza payloads antigos antes do Zod (ex.: `promoDuo` com `left`/`right` → `items`;
 * `categoryMenuSlugs` → `headerNavItems`).
 */
export function migrateHomeLayoutDocumentRaw(data: unknown): unknown {
  if (data == null || typeof data !== "object") return data
  let doc = data as Record<string, unknown>

  if (Array.isArray(doc.categoryMenuSlugs) && doc.headerNavItems == null) {
    const slugs = doc.categoryMenuSlugs.filter((s): s is string => typeof s === "string")
    const { categoryMenuSlugs, ...rest } = doc
    void categoryMenuSlugs
    doc = {
      ...rest,
      headerNavItems: slugs.map((slug) => ({ kind: "category", slug })),
    }
  }

  if (!Array.isArray(doc.headerNavItems)) {
    doc = { ...doc, headerNavItems: [] }
  }

  if (!Array.isArray(doc.blocks)) return doc

  return {
    ...doc,
    blocks: doc.blocks.map((block) => {
      if (block == null || typeof block !== "object") return block
      const b = block as { type?: string; props?: Record<string, unknown> }
      if (b.type !== "promoDuo" || b.props == null || typeof b.props !== "object") return block
      const p = b.props as { items?: unknown; left?: unknown; right?: unknown }
      if (Array.isArray(p.items)) return block
      if (p.left != null && p.right != null) {
        return { ...b, props: { items: [p.left, p.right] } }
      }
      return block
    }).map((block) => {
      if (block == null || typeof block !== "object") return block
      const b = block as { type?: string; props?: Record<string, unknown> }
      if (b.type !== "shoeStoreExplore" || b.props == null || typeof b.props !== "object") return block
      const p = b.props as { tiles?: unknown[] }
      if (!Array.isArray(p.tiles)) return block
      return {
        ...b,
        props: {
          ...p,
          tiles: p.tiles.map((tile) => {
            if (tile == null || typeof tile !== "object") return tile
            const t = tile as Record<string, unknown>
            return typeof t.description === "string" ? t : { ...t, description: "" }
          }),
        },
      }
    }).map((block) => {
      if (block == null || typeof block !== "object") return block
      const b = block as { type?: string; props?: Record<string, unknown> }
      if (b.type !== "trustStrip") return block
      return { ...b, type: "benefitsBar" }
    }),
  }
}
