import type { HomeLayoutDocument } from "./schema"
import { homeLayoutDocumentSchema } from "./schema"

export type EditorLayoutIssues = {
  ok: boolean
  /** Mensagens por id do bloco (validação Zod em `props`). */
  byBlockId: Record<string, string[]>
  /** Erros ao nível do documento (ex.: `blocks` em excesso). */
  documentMessages: string[]
}

function pushUnique(map: Record<string, string[]>, key: string, message: string) {
  const arr = map[key] ?? (map[key] = [])
  if (!arr.includes(message)) arr.push(message)
}

/**
 * Agrupa issues do Zod por bloco para o editor da home (sem migrar payload —
 * o `doc` do estado já deve estar coerente com o schema actual).
 */
export function analyzeHomeLayoutEditor(doc: HomeLayoutDocument): EditorLayoutIssues {
  const parsed = homeLayoutDocumentSchema.safeParse(doc)
  if (parsed.success) {
    return { ok: true, byBlockId: {}, documentMessages: [] }
  }

  const byBlockId: Record<string, string[]> = {}
  const documentMessages: string[] = []

  for (const issue of parsed.error.issues) {
    const path = issue.path
    if (path[0] === "blocks") {
      const rawIdx = path[1]
      const idx = typeof rawIdx === "number" ? rawIdx : Number(rawIdx)
      if (Number.isFinite(idx) && doc.blocks[idx]) {
        pushUnique(byBlockId, doc.blocks[idx]!.id, issue.message)
      } else {
        if (!documentMessages.includes(issue.message)) documentMessages.push(issue.message)
      }
    } else {
      if (!documentMessages.includes(issue.message)) documentMessages.push(issue.message)
    }
  }

  return { ok: false, byBlockId, documentMessages }
}
