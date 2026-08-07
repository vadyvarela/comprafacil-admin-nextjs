/** Label for category selects: `Pai › Filho` when nested. */
export function formatCategoryLabel(category: {
  name: string
  parentCategory?: { name?: string | null } | null
}): string {
  const parentName = category.parentCategory?.name?.trim()
  if (parentName) return `${parentName} › ${category.name}`
  return category.name
}

type CategoryLike = {
  id: string
  name: string
  parentCategory?: { id?: string; name?: string | null } | null
}

/** Roots first, then each parent's children (for product selects). */
export function sortCategoriesForSelect<T extends CategoryLike>(categories: T[]): T[] {
  const roots = categories
    .filter((c) => !c.parentCategory?.id)
    .sort((a, b) => a.name.localeCompare(b.name, "pt"))
  const children = categories.filter((c) => c.parentCategory?.id)
  const out: T[] = []
  const seen = new Set<string>()

  for (const root of roots) {
    out.push(root)
    seen.add(root.id)
    const kids = children
      .filter((c) => c.parentCategory?.id === root.id)
      .sort((a, b) => a.name.localeCompare(b.name, "pt"))
    for (const kid of kids) {
      out.push(kid)
      seen.add(kid.id)
    }
  }

  for (const c of children) {
    if (!seen.has(c.id)) out.push(c)
  }

  return out
}

/** Only root categories (valid parents in Phase 1 — one level). */
export function getRootCategoriesForParentSelect<T extends CategoryLike>(
  categories: T[],
  excludeId?: string,
): T[] {
  return categories
    .filter((c) => !c.parentCategory?.id && c.id !== excludeId)
    .sort((a, b) => a.name.localeCompare(b.name, "pt"))
}

/** Group for admin list: root → children. */
export function groupCategoriesByParent<T extends CategoryLike>(
  categories: T[],
): { root: T; children: T[] }[] {
  const roots = categories
    .filter((c) => !c.parentCategory?.id)
    .sort((a, b) => a.name.localeCompare(b.name, "pt"))
  const children = categories.filter((c) => c.parentCategory?.id)

  const groups = roots.map((root) => ({
    root,
    children: children
      .filter((c) => c.parentCategory?.id === root.id)
      .sort((a, b) => a.name.localeCompare(b.name, "pt")),
  }))

  const orphanChildren = children.filter(
    (c) => !roots.some((r) => r.id === c.parentCategory?.id),
  )
  if (orphanChildren.length > 0) {
    for (const orphan of orphanChildren) {
      groups.push({ root: orphan, children: [] })
    }
  }

  return groups
}
