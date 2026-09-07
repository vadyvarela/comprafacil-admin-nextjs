import type { HomeBlock, HomeLayoutDocument } from "@/lib/home-layout/schema"
import { HOME_BLOCK_REGISTRY } from "@/lib/home-layout/registry"

/**
 * O que muda na loja se este layout for publicado.
 *
 * Publicar mostrava só quantas secções ficavam activas, o que não responde à
 * pergunta que a pessoa tem antes de carregar no botão: *o que é que isto
 * altera?*
 */

export type LayoutDiff = {
  added: string[]
  removed: string[]
  changed: string[]
  enabled: string[]
  disabled: string[]
  reordered: boolean
  /** Nada muda: publicar seria um no-op. */
  identical: boolean
}

function label(block: HomeBlock): string {
  return HOME_BLOCK_REGISTRY[block.type]?.label ?? block.type
}

function propsOf(block: HomeBlock): string {
  return JSON.stringify((block as { props?: unknown }).props ?? null)
}

export function diffHomeLayout(
  current: HomeLayoutDocument,
  published: HomeLayoutDocument | null,
): LayoutDiff {
  const empty: LayoutDiff = {
    added: [],
    removed: [],
    changed: [],
    enabled: [],
    disabled: [],
    reordered: false,
    identical: false,
  }

  // Sem nada publicado, tudo o que existe é novo.
  if (!published) {
    return { ...empty, added: current.blocks.map(label) }
  }

  const before = new Map(published.blocks.map((b) => [b.id, b]))
  const after = new Map(current.blocks.map((b) => [b.id, b]))

  const diff: LayoutDiff = { ...empty }

  for (const block of current.blocks) {
    const prev = before.get(block.id)
    if (!prev) {
      diff.added.push(label(block))
      continue
    }
    if (prev.enabled === false && block.enabled !== false) {
      diff.enabled.push(label(block))
    } else if (prev.enabled !== false && block.enabled === false) {
      diff.disabled.push(label(block))
    }
    if (propsOf(prev) !== propsOf(block)) {
      diff.changed.push(label(block))
    }
  }

  for (const block of published.blocks) {
    if (!after.has(block.id)) diff.removed.push(label(block))
  }

  const commonBefore = published.blocks
    .filter((b) => after.has(b.id))
    .map((b) => b.id)
  const commonAfter = current.blocks
    .filter((b) => before.has(b.id))
    .map((b) => b.id)
  diff.reordered = commonBefore.join("|") !== commonAfter.join("|")

  const headerChanged =
    JSON.stringify(published.headerNavItems) !==
    JSON.stringify(current.headerNavItems)
  if (headerChanged) diff.changed.push("Cabeçalho da loja")

  diff.identical =
    diff.added.length === 0 &&
    diff.removed.length === 0 &&
    diff.changed.length === 0 &&
    diff.enabled.length === 0 &&
    diff.disabled.length === 0 &&
    !diff.reordered

  return diff
}

/** Linhas legíveis para o diálogo de publicação. */
export function describeLayoutDiff(diff: LayoutDiff): string[] {
  if (diff.identical) return []
  const lines: string[] = []
  const add = (verb: string, names: string[]) => {
    if (names.length) lines.push(`${verb}: ${names.join(", ")}`)
  }
  add("Secções novas", diff.added)
  add("Secções removidas", diff.removed)
  add("Secções alteradas", diff.changed)
  add("Passam a estar visíveis", diff.enabled)
  add("Deixam de estar visíveis", diff.disabled)
  if (diff.reordered) lines.push("A ordem das secções muda")
  return lines
}
