"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery } from "@apollo/client/react"
import { GET_STORE_HOME_LAYOUT } from "@/lib/graphql/store-home-layout/queries"
import {
  PUBLISH_STORE_HOME_LAYOUT,
  SAVE_STORE_HOME_LAYOUT_DRAFT,
} from "@/lib/graphql/store-home-layout/mutations"
import type {
  StoreHomeLayoutMutationData,
  StoreHomeLayoutQueryData,
} from "@/lib/graphql/store-home-layout/types"
import type { HomeBlock, HomeLayoutDocument } from "@/lib/home-layout/schema"
import {
  homeLayoutDocumentSchema,
  parseHomeLayoutDocument,
} from "@/lib/home-layout/schema"
import { analyzeHomeLayoutEditor } from "@/lib/home-layout/editor-layout-issues"
import { DEFAULT_HOME_LAYOUT } from "@/lib/home-layout/default-layout"
import { createEmptyBlock } from "@/lib/home-layout/block-factory"
import type { HomeBlockType } from "@/lib/home-layout/registry"
import { showToast } from "@/lib/utils/toast"

/**
 * Ciclo de vida do documento de layout: estado, histórico e persistência.
 *
 * Vivia inline no componente da página, misturado com preview, drag-and-drop e
 * JSX. Separado, o editor pode mudar de forma sem tocar nas regras de gravação
 * — e estas passam a ler-se de uma vez só.
 */

const AUTOSAVE_DEBOUNCE_MS = 2500
const HISTORY_CAP = 40
const HISTORY_THROTTLE_MS = 900

function layoutFromServerRow(
  row: StoreHomeLayoutQueryData["storeHomeLayout"] | null,
): HomeLayoutDocument {
  const raw = row?.draftPayload ?? row?.publishedPayload
  if (!raw) return structuredClone(DEFAULT_HOME_LAYOUT)
  const parsed = parseHomeLayoutDocument(raw)
  return parsed.success ? parsed.data : structuredClone(DEFAULT_HOME_LAYOUT)
}

/** Selecção de nível de documento: o cabeçalho não é uma secção da lista. */
export const HEADER_SELECTION_ID = "__header__"

export type MutateOptions = { forceHistory?: boolean }

export function useLayoutDocument() {
  const { data, loading, error, refetch } =
    useQuery<StoreHomeLayoutQueryData>(GET_STORE_HOME_LAYOUT)

  const [saveDraftMutation, { loading: savingDraft }] =
    useMutation<StoreHomeLayoutMutationData>(SAVE_STORE_HOME_LAYOUT_DRAFT, {
      refetchQueries: [{ query: GET_STORE_HOME_LAYOUT }],
    })
  const [publishMutation, { loading: publishing }] =
    useMutation<StoreHomeLayoutMutationData>(PUBLISH_STORE_HOME_LAYOUT, {
      refetchQueries: [{ query: GET_STORE_HOME_LAYOUT }],
    })

  const [doc, setDocState] = useState<HomeLayoutDocument>(() =>
    structuredClone(DEFAULT_HOME_LAYOUT),
  )
  const docRef = useRef(doc)
  docRef.current = doc
  const docJson = useMemo(() => JSON.stringify(doc), [doc])

  const [dirty, setDirty] = useState(false)
  const [lastAutosaveAt, setLastAutosaveAt] = useState<string | null>(null)
  const [historyTick, setHistoryTick] = useState(0)

  const pastRef = useRef<HomeLayoutDocument[]>([])
  const futureRef = useRef<HomeLayoutDocument[]>([])
  const lastHistoryAtRef = useRef(0)
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const bumpHistory = useCallback(() => setHistoryTick((n) => n + 1), [])

  const clearHistory = useCallback(() => {
    pastRef.current = []
    futureRef.current = []
    lastHistoryAtRef.current = 0
    bumpHistory()
  }, [bumpHistory])

  /** Agrupa edições seguidas (escrever num campo) num só passo de histórico. */
  const pushPastSnapshot = useCallback(
    (prev: HomeLayoutDocument, force: boolean) => {
      const now = Date.now()
      if (force || now - lastHistoryAtRef.current >= HISTORY_THROTTLE_MS) {
        pastRef.current = [
          ...pastRef.current.slice(-(HISTORY_CAP - 1)),
          structuredClone(prev),
        ]
        lastHistoryAtRef.current = now
        futureRef.current = []
        bumpHistory()
      }
    },
    [bumpHistory],
  )

  const mutateDoc = useCallback(
    (
      recipe: (current: HomeLayoutDocument) => HomeLayoutDocument,
      options?: MutateOptions,
    ) => {
      setDocState((prev) => {
        const next = recipe(prev)
        if (next === prev) return prev
        pushPastSnapshot(prev, options?.forceHistory ?? false)
        return next
      })
      setDirty(true)
    },
    [pushPastSnapshot],
  )

  const undo = useCallback(() => {
    const previous = pastRef.current.at(-1)
    if (!previous) return
    pastRef.current = pastRef.current.slice(0, -1)
    futureRef.current = [...futureRef.current, structuredClone(docRef.current)]
    setDocState(previous)
    setDirty(true)
    bumpHistory()
  }, [bumpHistory])

  const redo = useCallback(() => {
    const next = futureRef.current.at(-1)
    if (!next) return
    futureRef.current = futureRef.current.slice(0, -1)
    pastRef.current = [...pastRef.current, structuredClone(docRef.current)]
    setDocState(next)
    setDirty(true)
    bumpHistory()
  }, [bumpHistory])

  const serverRow = data?.storeHomeLayout ?? null

  // Só re-hidrata quando não há trabalho por gravar, para não perder edições.
  useEffect(() => {
    if (dirty) return
    setDocState(layoutFromServerRow(serverRow))
    clearHistory()
  }, [serverRow, dirty, clearHistory])

  const validate = useCallback((): HomeLayoutDocument | null => {
    const parsed = homeLayoutDocumentSchema.safeParse(docRef.current)
    if (!parsed.success) {
      showToast.error(
        "Layout inválido",
        parsed.error.issues.map((e) => e.message).join(" · "),
      )
      return null
    }
    return parsed.data
  }, [])

  const saveDraft = useCallback(
    async (opts?: { silent?: boolean }) => {
      const parsed = homeLayoutDocumentSchema.safeParse(docRef.current)
      if (!parsed.success) {
        if (!opts?.silent) {
          showToast.error(
            "Layout inválido",
            parsed.error.issues.map((e) => e.message).join(" · "),
          )
        }
        return false
      }
      try {
        await saveDraftMutation({ variables: { payload: parsed.data } })
        setDirty(false)
        clearHistory()
        if (!opts?.silent) {
          showToast.success("Rascunho gravado", "O layout foi guardado.")
        }
        return true
      } catch (e: unknown) {
        if (!opts?.silent) {
          showToast.error(
            "Erro",
            e instanceof Error ? e.message : "Erro ao gravar",
          )
        }
        return false
      }
    },
    [saveDraftMutation, clearHistory],
  )

  const publish = useCallback(async () => {
    const payload = validate()
    if (!payload) return false
    try {
      await publishMutation({ variables: { payload } })
      setDirty(false)
      clearHistory()
      return true
    } catch (e: unknown) {
      showToast.error(
        "Erro",
        e instanceof Error ? e.message : "Erro ao publicar",
      )
      return false
    }
  }, [validate, publishMutation, clearHistory])

  const discard = useCallback(async () => {
    setDirty(false)
    await refetch()
  }, [refetch])

  // Autosave: guarda em rascunho quando o utilizador pára de escrever.
  useEffect(() => {
    if (!dirty) return
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    autosaveTimerRef.current = setTimeout(() => {
      autosaveTimerRef.current = null
      void (async () => {
        const ok = await saveDraft({ silent: true })
        if (ok) {
          setLastAutosaveAt(
            new Date().toLocaleTimeString("pt-PT", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          )
        }
      })()
    }, AUTOSAVE_DEBOUNCE_MS)
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    }
  }, [dirty, docJson, saveDraft])

  const updateBlock = useCallback(
    (id: string, next: HomeBlock) => {
      mutateDoc((d) => ({
        ...d,
        blocks: d.blocks.map((b) => (b.id === id ? next : b)),
      }))
    },
    [mutateDoc],
  )

  const removeBlock = useCallback(
    (id: string) => {
      mutateDoc((d) => ({ ...d, blocks: d.blocks.filter((b) => b.id !== id) }), {
        forceHistory: true,
      })
    },
    [mutateDoc],
  )

  const addBlock = useCallback(
    (type: HomeBlockType): string => {
      const block = createEmptyBlock(type)
      mutateDoc((d) => ({ ...d, blocks: [...d.blocks, block] }), {
        forceHistory: true,
      })
      return block.id
    },
    [mutateDoc],
  )

  const toggleBlockEnabled = useCallback(
    (id: string) => {
      mutateDoc(
        (d) => ({
          ...d,
          blocks: d.blocks.map((b) =>
            b.id === id ? { ...b, enabled: b.enabled === false } : b,
          ),
        }),
        { forceHistory: true },
      )
    },
    [mutateDoc],
  )

  const updateHeaderNav = useCallback(
    (headerNavItems: HomeLayoutDocument["headerNavItems"]) => {
      mutateDoc((d) => ({ ...d, headerNavItems }))
    },
    [mutateDoc],
  )

  const reorderBlocks = useCallback(
    (nextBlocks: HomeBlock[]) => {
      mutateDoc((d) => ({ ...d, blocks: nextBlocks }), { forceHistory: true })
    },
    [mutateDoc],
  )

  const issues = useMemo(() => analyzeHomeLayoutEditor(doc), [doc])

  const meta = useMemo(
    () => ({
      publishedAt: serverRow?.publishedAt
        ? new Date(serverRow.publishedAt).toLocaleString("pt-PT")
        : null,
      updatedAt: serverRow?.updatedAt
        ? new Date(serverRow.updatedAt).toLocaleString("pt-PT")
        : null,
      total: doc.blocks.length,
      active: doc.blocks.filter((b) => b.enabled !== false).length,
      withErrors: doc.blocks.filter((b) => issues.byBlockId[b.id]?.length)
        .length,
    }),
    [serverRow?.publishedAt, serverRow?.updatedAt, doc.blocks, issues],
  )

  return {
    doc,
    blocks: doc.blocks,
    mutateDoc,
    loading,
    error,
    hasServerRow: Boolean(serverRow),
    dirty,
    lastAutosaveAt,
    savingDraft,
    publishing,
    issues,
    meta,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
    historyTick,
    undo,
    redo,
    saveDraft,
    publish,
    discard,
    validate,
    addBlock,
    updateBlock,
    removeBlock,
    toggleBlockEnabled,
    reorderBlocks,
    updateHeaderNav,
  }
}
