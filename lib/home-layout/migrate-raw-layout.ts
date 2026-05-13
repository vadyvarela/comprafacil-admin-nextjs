/**
 * Normaliza payloads antigos antes do Zod (ex.: `promoDuo` com `left`/`right` → `items`).
 */
export function migrateHomeLayoutDocumentRaw(data: unknown): unknown {
  if (data == null || typeof data !== "object") return data;
  const doc = data as { blocks?: unknown[] };
  if (!Array.isArray(doc.blocks)) return data;
  return {
    ...doc,
    blocks: doc.blocks.map((block) => {
      if (block == null || typeof block !== "object") return block;
      const b = block as { type?: string; props?: Record<string, unknown> };
      if (b.type !== "promoDuo" || b.props == null || typeof b.props !== "object") return block;
      const p = b.props as { items?: unknown; left?: unknown; right?: unknown };
      if (Array.isArray(p.items)) return block;
      if (p.left != null && p.right != null) {
        return { ...b, props: { items: [p.left, p.right] } };
      }
      return block;
    }),
  };
}
