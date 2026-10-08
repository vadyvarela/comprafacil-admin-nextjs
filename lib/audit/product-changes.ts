import type { AuditFieldChange } from "./describe"

/** O subconjunto do formulário de produto que vale a pena registar. */
export type ProductAuditForm = {
  title: string
  summary: string
  discount: string
  condition: string
  status: string
  sku: string
  categoryId: string
  brandId: string
  semFaceId: boolean
  batteryHealthPercent: string
  addOnProductIds: string[]
  specifications: unknown
  offerEnabled: boolean
  offerTitle: string
  offerItems: string[]
  metaCatalog: unknown
}

type Lookups = {
  categoryName: (id: string) => string | undefined
  brandName: (id: string) => string | undefined
}

const CONDITION_LABELS: Record<string, string> = {
  novo: "Novo",
  seminovo: "Seminovo",
  usado: "Usado",
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Publicado",
  INACTIVE: "Rascunho",
}

function orEmpty(value: string | null | undefined): string | null {
  const v = value?.trim()
  return v ? v : null
}

function yesNo(value: boolean): string {
  return value ? "Sim" : "Não"
}

/**
 * Lista do que mudou entre o formulário carregado e o que vai ser guardado,
 * com os nomes que a pessoa vê no ecrã — não os ids nem os códigos.
 *
 * Campos longos ou estruturados (descrição, especificações, catálogo Meta)
 * entram só como "alterado": o valor inteiro não cabe numa linha de histórico.
 */
export function productFormChanges(
  before: ProductAuditForm,
  after: ProductAuditForm,
  lookups: Lookups
): AuditFieldChange[] {
  const changes: AuditFieldChange[] = []

  const scalar = (field: string, from: string | null, to: string | null) => {
    if (from !== to) changes.push({ field, from, to })
  }
  const opaque = (field: string, from: unknown, to: unknown) => {
    if (JSON.stringify(from) !== JSON.stringify(to)) changes.push({ field })
  }
  const ref = (id: string, name: (id: string) => string | undefined) =>
    !id || id === "none" ? null : (name(id) ?? id)

  scalar("Título", orEmpty(before.title), orEmpty(after.title))
  opaque("Descrição", before.summary, after.summary)
  scalar(
    "Visibilidade",
    STATUS_LABELS[before.status] ?? before.status,
    STATUS_LABELS[after.status] ?? after.status
  )
  scalar(
    "Condição",
    CONDITION_LABELS[before.condition] ?? before.condition,
    CONDITION_LABELS[after.condition] ?? after.condition
  )
  scalar(
    "Categoria",
    ref(before.categoryId, lookups.categoryName),
    ref(after.categoryId, lookups.categoryName)
  )
  scalar("Marca", ref(before.brandId, lookups.brandName), ref(after.brandId, lookups.brandName))
  scalar("SKU", orEmpty(before.sku), orEmpty(after.sku))
  scalar(
    "Desconto (%)",
    orEmpty(before.discount),
    orEmpty(after.discount)
  )
  if (before.semFaceId !== after.semFaceId) {
    scalar("Sem Face ID", yesNo(before.semFaceId), yesNo(after.semFaceId))
  }
  scalar(
    "Saúde da bateria (%)",
    orEmpty(before.batteryHealthPercent),
    orEmpty(after.batteryHealthPercent)
  )
  if (before.offerEnabled !== after.offerEnabled) {
    scalar("Oferta", yesNo(before.offerEnabled), yesNo(after.offerEnabled))
  }
  scalar("Título da oferta", orEmpty(before.offerTitle), orEmpty(after.offerTitle))
  scalar(
    "Itens da oferta",
    before.offerItems.join(", ") || null,
    after.offerItems.join(", ") || null
  )
  if (JSON.stringify(before.addOnProductIds) !== JSON.stringify(after.addOnProductIds)) {
    scalar(
      "Acessórios opcionais",
      `${before.addOnProductIds.length} produto(s)`,
      `${after.addOnProductIds.length} produto(s)`
    )
  }
  opaque("Especificações", before.specifications, after.specifications)
  opaque("Catálogo Meta", before.metaCatalog, after.metaCatalog)

  return changes
}
