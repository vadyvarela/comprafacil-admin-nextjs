"use client"

import type { ComponentProps } from "react"
import dynamic from "next/dynamic"
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery } from "@apollo/client/react"
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import {
  LayoutGrid,
  Loader2,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Copy,
  RotateCcw,
  Eye,
  Info,
  ChevronsDownUp,
  Layers,
  Undo2,
  Redo2,
  AlertTriangle,
  X,
  RefreshCw,
} from "lucide-react"
import { GET_STORE_HOME_LAYOUT } from "@/lib/graphql/store-home-layout/queries"
import {
  PUBLISH_STORE_HOME_LAYOUT,
  SAVE_STORE_HOME_LAYOUT_DRAFT,
} from "@/lib/graphql/store-home-layout/mutations"
import type { StoreHomeLayoutQueryData, StoreHomeLayoutMutationData } from "@/lib/graphql/store-home-layout/types"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { PageToolbar } from "@/components/admin/page-toolbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { showToast } from "@/lib/utils/toast"
import type { HomeBlock, HomeLayoutDocument } from "@/lib/home-layout/schema"
import {
  parseHomeLayoutDocument,
  homeLayoutDocumentSchema,
  homeBlockSchema,
  HOME_LAYOUT_RULES,
} from "@/lib/home-layout/schema"
import { analyzeHomeLayoutEditor } from "@/lib/home-layout/editor-layout-issues"
import { DEFAULT_HOME_LAYOUT } from "@/lib/home-layout/default-layout"
import { HOME_BLOCK_REGISTRY, HOME_BLOCK_TYPES, type HomeBlockType } from "@/lib/home-layout/registry"
import { createEmptyBlock } from "@/lib/home-layout/block-factory"
import { StoreHomeSortableBlockShell } from "@/components/store-home/store-home-sortable-block-shell"
import { StoreHomeHeaderNavPanel } from "@/components/store-home/store-home-header-nav-panel"
import { revalidateTecharenaHome } from "@/app/dashboard/store-home/actions"
import { buildHomePreviewUrl } from "@/app/dashboard/store-home/preview-actions"
import { cn } from "@/lib/utils"

function StoreHomeBlockFieldsSkeleton() {
  return (
    <div className="space-y-2 py-0.5" aria-hidden>
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full max-w-lg" />
      <Skeleton className="h-8 w-40" />
    </div>
  )
}

const StoreHomeBlockFields = dynamic(
  () => import("@/components/store-home/store-home-block-fields").then((m) => m.StoreHomeBlockFields),
  { ssr: false, loading: () => <StoreHomeBlockFieldsSkeleton /> }
)

function layoutFromServerRow(row: StoreHomeLayoutQueryData["storeHomeLayout"]): HomeLayoutDocument {
  if (!row) return structuredClone(DEFAULT_HOME_LAYOUT)
  const raw = row.draftPayload ?? row.publishedPayload
  if (raw == null) return structuredClone(DEFAULT_HOME_LAYOUT)
  const parsed = parseHomeLayoutDocument(raw)
  if (!parsed.success) return structuredClone(DEFAULT_HOME_LAYOUT)
  return parsed.data
}

function duplicateBlock(block: HomeBlock): HomeBlock {
  const raw = JSON.parse(JSON.stringify(block)) as Record<string, unknown>
  raw.id = crypto.randomUUID()
  const parsed = homeBlockSchema.safeParse(raw)
  if (parsed.success) return parsed.data
  return createEmptyBlock(block.type)
}

function moveBlock(blocks: HomeBlock[], index: number, delta: number): HomeBlock[] {
  const j = index + delta
  if (j < 0 || j >= blocks.length) return blocks
  const next = [...blocks]
  const t = next[index]!
  next[index] = next[j]!
  next[j] = t
  return next
}

function TippedButton({
  label,
  side = "bottom",
  ...props
}: ComponentProps<typeof Button> & { label: string; side?: ComponentProps<typeof TooltipContent>["side"] }) {
  return (
    <TooltipRoot>
      <TooltipTrigger asChild>
        <Button {...props} />
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-xs text-balance">
        {label}
      </TooltipContent>
    </TooltipRoot>
  )
}

function StoreHomeBlocksSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <Card key={i} className="gap-0 overflow-hidden rounded-xl border-border/50 py-0 shadow-sm">
          <div className="flex gap-2 border-b border-border/40 bg-muted/20 px-4 py-3">
            <Skeleton className="h-7 w-7 shrink-0 rounded-md" />
            <Skeleton className="h-7 w-7 shrink-0 rounded-md" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 max-w-md w-full" />
            </div>
            <Skeleton className="h-7 w-28 shrink-0 rounded-md" />
          </div>
          <div className="space-y-3 p-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full max-w-lg" />
          </div>
        </Card>
      ))}
    </div>
  )
}

function StoreHomeEmptyBlocks({
  addType,
  onAdd,
}: {
  addType: HomeBlockType
  onAdd: () => void
}) {
  const label = HOME_BLOCK_REGISTRY[addType].label
  return (
    <Card className="rounded-xl border-dashed border-border/80 bg-muted/10 py-0 text-center shadow-none">
      <CardContent className="flex flex-col items-center gap-4 px-6 py-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Layers className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Sem secções na home</p>
          <p className="max-w-sm text-[11px] leading-relaxed text-muted-foreground">
            Escolhe o tipo de bloco acima e adiciona a primeira secção. Podes reordenar arrastando o ícone à
            esquerda de cada cartão.
          </p>
        </div>
        <Button type="button" size="sm" className="gap-1.5" onClick={onAdd}>
          <Plus className="h-3.5 w-3.5" />
          Adicionar «{label}»
        </Button>
      </CardContent>
    </Card>
  )
}

const AUTOSAVE_DEBOUNCE_MS = 2500
const HISTORY_CAP = 40
const HISTORY_THROTTLE_MS = 900

const PREVIEW_BESIDE_STORAGE_KEY = "techstore-backoffice:store-home:preview-beside"

function readPreviewBesideFromStorage(): boolean {
  if (typeof window === "undefined") return false
  try {
    const v = window.localStorage.getItem(PREVIEW_BESIDE_STORAGE_KEY)
    return v === "1" || v === "true"
  } catch {
    return false
  }
}

function writePreviewBesideToStorage(value: boolean) {
  try {
    window.localStorage.setItem(PREVIEW_BESIDE_STORAGE_KEY, value ? "1" : "0")
  } catch {
    /* ignore quota / private mode */
  }
}

export default function StoreHomePage() {
  const { data, loading, error, refetch } = useQuery<StoreHomeLayoutQueryData>(GET_STORE_HOME_LAYOUT)
  const [saveDraft, { loading: savingDraft }] = useMutation<StoreHomeLayoutMutationData>(
    SAVE_STORE_HOME_LAYOUT_DRAFT,
    { refetchQueries: [{ query: GET_STORE_HOME_LAYOUT }] }
  )
  const [publishLayout, { loading: publishing }] = useMutation<StoreHomeLayoutMutationData>(
    PUBLISH_STORE_HOME_LAYOUT,
    { refetchQueries: [{ query: GET_STORE_HOME_LAYOUT }] }
  )

  const [doc, setDoc] = useState<HomeLayoutDocument>(() => structuredClone(DEFAULT_HOME_LAYOUT))
  const docRef = useRef(doc)
  docRef.current = doc
  const docJson = useMemo(() => JSON.stringify(doc), [doc])

  const [addType, setAddType] = useState<HomeBlockType>("productRail")
  const [dirty, setDirty] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewBeside, setPreviewBesideState] = useState(false)
  const [isLgViewport, setIsLgViewport] = useState(false)
  const [previewBusy, setPreviewBusy] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  /** false = corpo da secção recolhido; ausente/true = expandido (padrão). */
  const [blockBodyOpen, setBlockBodyOpen] = useState<Record<string, boolean>>({})
  const [historyTick, setHistoryTick] = useState(0)
  const [lastAutosaveAt, setLastAutosaveAt] = useState<string | null>(null)

  const pastRef = useRef<HomeLayoutDocument[]>([])
  const futureRef = useRef<HomeLayoutDocument[]>([])
  const lastHistoryAtRef = useRef(0)
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** Evita sessões de preview em paralelo (race no `previewBusy`). */
  const previewSessionInFlightRef = useRef(false)

  const bumpHistory = useCallback(() => {
    setHistoryTick((n) => n + 1)
  }, [])

  const clearHistoryStacks = useCallback(() => {
    pastRef.current = []
    futureRef.current = []
    lastHistoryAtRef.current = 0
    bumpHistory()
  }, [bumpHistory])

  const pushPastSnapshot = (prev: HomeLayoutDocument, force: boolean) => {
    const now = Date.now()
    if (force || now - lastHistoryAtRef.current >= HISTORY_THROTTLE_MS) {
      pastRef.current = [...pastRef.current.slice(-(HISTORY_CAP - 1)), structuredClone(prev)]
      futureRef.current = []
      lastHistoryAtRef.current = now
    }
  }

  const mutateDoc = useCallback(
    (
      updater: (d: HomeLayoutDocument) => HomeLayoutDocument,
      options?: { skipHistory?: boolean; forceHistory?: boolean }
    ) => {
      setDoc((prev) => {
        if (!options?.skipHistory) {
          pushPastSnapshot(prev, options?.forceHistory ?? false)
        }
        return updater(prev)
      })
      setDirty(true)
      bumpHistory()
    },
    [bumpHistory]
  )

  const undo = useCallback(() => {
    setDoc((current) => {
      const past = pastRef.current
      if (past.length === 0) return current
      const snapshot = past[past.length - 1]!
      pastRef.current = past.slice(0, -1)
      futureRef.current = [structuredClone(current), ...futureRef.current.slice(0, HISTORY_CAP - 1)]
      return structuredClone(snapshot)
    })
    setDirty(true)
    bumpHistory()
  }, [bumpHistory])

  const redo = useCallback(() => {
    setDoc((current) => {
      const fut = futureRef.current
      if (fut.length === 0) return current
      const snapshot = fut[0]!
      futureRef.current = fut.slice(1)
      pastRef.current = [...pastRef.current.slice(-(HISTORY_CAP - 1)), structuredClone(current)]
      return structuredClone(snapshot)
    })
    setDirty(true)
    bumpHistory()
  }, [bumpHistory])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const setBlockBodyExpanded = useCallback((id: string, open: boolean) => {
    setBlockBodyOpen((prev) => {
      if (open) {
        const { [id]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [id]: false }
    })
  }, [])

  const expandAllBlocks = useCallback(() => {
    setBlockBodyOpen({})
  }, [])

  const collapseAllBlocks = useCallback(() => {
    if (doc.blocks.length === 0) return
    setBlockBodyOpen(Object.fromEntries(doc.blocks.map((b) => [b.id, false])))
  }, [doc.blocks])

  const serverRow = data?.storeHomeLayout

  useEffect(() => {
    if (dirty) return
    setDoc(layoutFromServerRow(serverRow ?? null))
    clearHistoryStacks()
  }, [serverRow?.id, serverRow?.updatedAt, serverRow?.draftPayload, serverRow?.publishedPayload, dirty, clearHistoryStacks])

  useLayoutEffect(() => {
    setPreviewBesideState(readPreviewBesideFromStorage())
  }, [])

  const setPreviewBeside = useCallback((value: boolean) => {
    setPreviewBesideState(value)
    writePreviewBesideToStorage(value)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)")
    const apply = () => setIsLgViewport(mq.matches)
    apply()
    mq.addEventListener("change", apply)
    return () => mq.removeEventListener("change", apply)
  }, [])

  useEffect(() => {
    if (previewUrl && previewBeside && !isLgViewport) {
      setPreviewOpen(true)
    }
  }, [previewUrl, previewBeside, isLgViewport])

  const meta = useMemo(() => {
    const publishedAt = serverRow?.publishedAt
      ? new Date(serverRow.publishedAt).toLocaleString("pt-PT")
      : "—"
    const updatedAt = serverRow?.updatedAt
      ? new Date(serverRow.updatedAt).toLocaleString("pt-PT")
      : "—"
    return { publishedAt, updatedAt }
  }, [serverRow?.publishedAt, serverRow?.updatedAt])

  const editorIssues = useMemo(() => analyzeHomeLayoutEditor(doc), [doc])

  const publishSummary = useMemo(() => {
    const total = doc.blocks.length
    const active = doc.blocks.filter((b) => b.enabled !== false).length
    const blocksWithErrors = doc.blocks.filter((b) => editorIssues.byBlockId[b.id]?.length).length
    return { total, active, blocksWithErrors }
  }, [doc, editorIssues])

  const validateAndGetPayload = useCallback((): HomeLayoutDocument | null => {
    const parsed = homeLayoutDocumentSchema.safeParse(doc)
    if (!parsed.success) {
      const msg = parsed.error.issues.map((e) => e.message).join(" · ")
      showToast.error("Layout inválido", msg)
      return null
    }
    return parsed.data
  }, [doc])

  const handleSaveDraft = useCallback(
    async (opts?: { silent?: boolean }) => {
      const parsed = homeLayoutDocumentSchema.safeParse(docRef.current)
      if (!parsed.success) {
        if (!opts?.silent) {
          const msg = parsed.error.issues.map((e) => e.message).join(" · ")
          showToast.error("Layout inválido", msg)
        }
        return
      }
      try {
        await saveDraft({ variables: { payload: parsed.data } })
        setDirty(false)
        clearHistoryStacks()
        if (!opts?.silent) {
          showToast.success("Rascunho gravado", "O layout foi guardado como rascunho.")
        }
      } catch (e: unknown) {
        const m = e instanceof Error ? e.message : "Erro ao gravar"
        showToast.error("Erro", m)
      }
    },
    [saveDraft, clearHistoryStacks]
  )

  const runPreviewSession = useCallback(
    async (mode: "initial" | "refresh"): Promise<boolean> => {
      if (previewSessionInFlightRef.current) return false
      previewSessionInFlightRef.current = true
      const payload = validateAndGetPayload()
      if (!payload) {
        previewSessionInFlightRef.current = false
        return false
      }
      setPreviewBusy(true)
      try {
        const res = await buildHomePreviewUrl(payload)
        if (!res.ok) {
          showToast.error("Preview", res.message)
          return false
        }
        setPreviewUrl(res.url)
        if (mode === "initial") {
          const dock = previewBeside && isLgViewport
          setPreviewOpen(!dock)
        }
        return true
      } finally {
        previewSessionInFlightRef.current = false
        setPreviewBusy(false)
      }
    },
    [validateAndGetPayload, previewBeside, isLgViewport]
  )

  const handlePreview = useCallback(() => {
    void runPreviewSession("initial")
  }, [runPreviewSession])

  const handlePreviewRefresh = useCallback(() => {
    void (async () => {
      const ok = await runPreviewSession("refresh")
      if (ok) {
        showToast.success("Preview", "IFrame actualizado com o layout actual.")
      }
    })()
  }, [runPreviewSession])

  const executePublish = useCallback(async () => {
    const parsed = homeLayoutDocumentSchema.safeParse(docRef.current)
    if (!parsed.success) return
    setPublishOpen(false)
    try {
      await publishLayout({ variables: { payload: parsed.data } })
      setDirty(false)
      clearHistoryStacks()
      const rev = await revalidateTecharenaHome()
      if ("skipped" in rev && rev.skipped) {
        showToast.success("Publicado", "Define TECHARENA_REVALIDATE_URL e SECRET para invalidar cache automaticamente.")
      } else if (rev.ok) {
        showToast.success("Publicado", "Cache da home invalidado.")
      } else {
        showToast.warning(
          "Publicado — cache não invalidado",
          "message" in rev ? rev.message : "Ver TECHARENA_REVALIDATE_URL e TECHARENA_REVALIDATE_SECRET (iguais na techarena e no backoffice)."
        )
      }
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : "Erro ao publicar"
      showToast.error("Erro", m)
    }
  }, [publishLayout, clearHistoryStacks])

  const updateBlock = (index: number, next: HomeBlock) => {
    mutateDoc((d) => ({
      ...d,
      blocks: d.blocks.map((b, i) => (i === index ? next : b)),
    }))
  }

  const removeBlock = (index: number) => {
    mutateDoc((d) => ({ ...d, blocks: d.blocks.filter((_, i) => i !== index) }), { forceHistory: true })
  }

  const addBlock = () => {
    mutateDoc(
      (d) => ({
        ...d,
        blocks: [...d.blocks, createEmptyBlock(addType)],
      }),
      { forceHistory: true }
    )
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    mutateDoc((d) => {
      const oldIndex = d.blocks.findIndex((b) => b.id === active.id)
      const newIndex = d.blocks.findIndex((b) => b.id === over.id)
      if (oldIndex < 0 || newIndex < 0) return d
      return { ...d, blocks: arrayMove(d.blocks, oldIndex, newIndex) }
    }, { forceHistory: true })
  }

  const handleDiscard = async () => {
    if (!dirty) return
    if (!confirm("Descartar alterações locais e voltar ao que está no servidor?")) return
    setDirty(false)
    await refetch()
  }

  useEffect(() => {
    if (!dirty) return
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    autosaveTimerRef.current = setTimeout(() => {
      autosaveTimerRef.current = null
      const parsed = homeLayoutDocumentSchema.safeParse(docRef.current)
      if (!parsed.success) return
      void (async () => {
        try {
          await saveDraft({ variables: { payload: parsed.data } })
          setLastAutosaveAt(
            new Date().toLocaleTimeString("pt-PT", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          )
          setDirty(false)
          clearHistoryStacks()
        } catch {
          /* falha silenciosa; o utilizador pode gravar manualmente */
        }
      })()
    }, AUTOSAVE_DEBOUNCE_MS)
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    }
  }, [dirty, docJson, saveDraft, clearHistoryStacks])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const inField = (e.target as HTMLElement | null)?.closest?.(
        "input, textarea, select, [contenteditable=true]"
      )
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault()
        void handleSaveDraft()
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        if (inField) return
        e.preventDefault()
        undo()
        return
      }
      if (e.ctrlKey || e.metaKey) {
        const k = e.key.toLowerCase()
        if (k === "y" || (k === "z" && e.shiftKey)) {
          if (inField) return
          e.preventDefault()
          redo()
        }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [handleSaveDraft, undo, redo])

  const canUndo = useMemo(() => pastRef.current.length > 0, [historyTick])
  const canRedo = useMemo(() => futureRef.current.length > 0, [historyTick])

  return (
    <TooltipProvider delayDuration={280}>
    <>
      <Dialog
        open={previewOpen}
        onOpenChange={(o) => {
          setPreviewOpen(o)
          if (!o) {
            const keepUrlForDock = previewBeside && isLgViewport && previewUrl != null
            if (!keepUrlForDock) setPreviewUrl(null)
          }
        }}
      >
        <DialogContent className="flex h-[calc(100dvh-1.25rem)] max-h-[calc(100dvh-1.25rem)] w-[calc(100vw-1.25rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
          <DialogHeader className="shrink-0 border-b border-border/60 px-4 py-3 text-left">
            <div className="flex flex-wrap items-center justify-between gap-2 pr-8 sm:pr-10">
              <DialogTitle className="text-base">Preview da home</DialogTitle>
              {previewUrl ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 shrink-0 gap-1.5 text-xs"
                  disabled={previewBusy}
                  onClick={handlePreviewRefresh}
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", previewBusy && "animate-spin")} />
                  Actualizar
                </Button>
              ) : null}
            </div>
          </DialogHeader>
          {previewUrl ? (
            <div className="flex min-h-0 flex-1 flex-col gap-2 px-4 pb-4 pt-2">
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-[11px] font-medium text-primary underline-offset-2 hover:underline"
              >
                Abrir em novo separador
              </a>
              <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-border/80 bg-muted/20">
                <iframe
                  key={previewUrl}
                  title="Preview da home da loja"
                  src={previewUrl}
                  className="h-full min-h-0 w-full border-0 bg-[#f7f8fc]"
                />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent className="max-w-md gap-3">
          <DialogHeader>
            <DialogTitle className="text-base">Publicar na loja</DialogTitle>
            <DialogDescription className="text-left text-xs leading-relaxed">
              {publishSummary.total} secç{publishSummary.total !== 1 ? "ões" : "ão"} no layout ·{" "}
              <span className="font-medium text-foreground">{publishSummary.active}</span> activas · máximo{" "}
              {HOME_LAYOUT_RULES.maxBlocks} blocos.
            </DialogDescription>
          </DialogHeader>
          {!editorIssues.ok ? (
            <div className="rounded-lg border border-destructive/35 bg-destructive/5 px-3 py-2 text-[11px] text-destructive">
              <p className="font-semibold">Não é possível publicar enquanto o layout falhar validação.</p>
              {editorIssues.documentMessages.length ? (
                <ul className="mt-1.5 list-inside list-disc space-y-0.5">
                  {editorIssues.documentMessages.map((m, i) => (
                    <li key={`${i}-${m}`}>{m}</li>
                  ))}
                </ul>
              ) : null}
              {publishSummary.blocksWithErrors > 0 ? (
                <p className="mt-1.5 text-[10px] opacity-90">
                  {publishSummary.blocksWithErrors} bloco(s) com erros — vê o aviso vermelho no cartão de cada
                  secção.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Os visitantes passam a ver esta versão na home pública. Podes voltar a editar e publicar de novo em
              qualquer momento.
            </p>
          )}
          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => setPublishOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 text-xs"
              disabled={!editorIssues.ok || publishing}
              onClick={() => void executePublish()}
            >
              {publishing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Confirmar publicação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DashboardHeader
        items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Home da loja" }]}
      />
      <div className="flex flex-1 flex-col min-h-0">
        <PageToolbar
          icon={LayoutGrid}
          iconBg="bg-primary/10"
          iconColor="text-primary"
          title="Home da loja"
          subtitle={
            loading ? (
              "A carregar…"
            ) : (
              <span className="inline-flex flex-wrap items-center gap-2">
                <span>
                  {doc.blocks.length} secç{doc.blocks.length !== 1 ? "ões" : "ão"} · Publicado:{" "}
                  {meta.publishedAt}
                </span>
                {dirty ? (
                  <Badge
                    variant="outline"
                    className="border-amber-500/55 text-[10px] font-semibold text-amber-800 dark:border-amber-400/40 dark:text-amber-300"
                  >
                    Alterações locais
                  </Badge>
                ) : null}
                {!editorIssues.ok ? (
                  <Badge variant="destructive" className="text-[10px] font-semibold">
                    Layout inválido
                  </Badge>
                ) : null}
                {lastAutosaveAt && !dirty ? (
                  <Badge variant="secondary" className="text-[10px] font-medium">
                    Auto-gravado {lastAutosaveAt}
                  </Badge>
                ) : null}
              </span>
            )
          }
        >
          <div className="flex flex-wrap items-center gap-2">
            <Select value={addType} onValueChange={(v) => setAddType(v as HomeBlockType)}>
              <SelectTrigger className="h-8 w-[min(100%,180px)] text-xs">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {HOME_BLOCK_TYPES.map((t) => {
                  const meta = HOME_BLOCK_REGISTRY[t]
                  return (
                    <SelectItem key={t} value={t} className="text-xs py-2 [&>span]:items-start">
                      <span className="flex flex-col gap-0.5 text-left">
                        <span className="font-medium leading-tight">{meta.label}</span>
                        <span className="line-clamp-2 text-[10px] font-normal text-muted-foreground leading-snug">
                          {meta.hint ?? meta.description}
                        </span>
                      </span>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            <TippedButton
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1"
              label={`Adicionar bloco «${HOME_BLOCK_REGISTRY[addType].label}» ao fim da página`}
              onClick={addBlock}
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar
            </TippedButton>
            <Separator orientation="vertical" className="hidden h-7 self-center sm:block" />
            <TippedButton
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs"
              disabled={doc.blocks.length === 0}
              label="Mostrar o formulário de todas as secções"
              onClick={expandAllBlocks}
            >
              <ChevronsDownUp className="h-3.5 w-3.5" />
              Expandir todas
            </TippedButton>
            <TippedButton
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs"
              disabled={doc.blocks.length === 0}
              label="Esconder os formulários e mostrar só o cabeçalho de cada secção"
              onClick={collapseAllBlocks}
            >
              <ChevronsDownUp className="h-3.5 w-3.5 rotate-180" />
              Recolher todas
            </TippedButton>
            <Separator orientation="vertical" className="hidden h-7 self-center sm:block" />
            <TippedButton
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 px-2 text-xs"
              disabled={!canUndo}
              label="Desfazer (Ctrl+Z fora de campos de texto)"
              onClick={undo}
            >
              <Undo2 className="h-3.5 w-3.5" />
              Desfazer
            </TippedButton>
            <TippedButton
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 px-2 text-xs"
              disabled={!canRedo}
              label="Refazer (Ctrl+Y ou Ctrl+Shift+Z)"
              onClick={redo}
            >
              <Redo2 className="h-3.5 w-3.5" />
              Refazer
            </TippedButton>
            <Separator orientation="vertical" className="hidden h-7 self-center sm:block" />
            <TippedButton
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1 text-muted-foreground"
              disabled={!dirty}
              label="Repor o layout igual ao último estado gravado no servidor"
              onClick={handleDiscard}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Descartar
            </TippedButton>
            <label className="hidden cursor-pointer items-center gap-1.5 rounded-md border border-border/50 bg-background/80 px-2 py-1 text-[10px] text-muted-foreground hover:bg-muted/40 lg:inline-flex">
              <input
                type="checkbox"
                checked={previewBeside}
                onChange={(e) => {
                  const next = e.target.checked
                  setPreviewBeside(next)
                  if (next && previewUrl && isLgViewport) setPreviewOpen(false)
                  if (!next && previewUrl && isLgViewport) setPreviewOpen(true)
                }}
                className="rounded border-input"
              />
              <span className="leading-tight">
                Preview ao lado <span className="text-muted-foreground/80">(neste browser)</span>
              </span>
            </label>
            <TippedButton
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1"
              disabled={previewBusy}
              label={
                previewBeside && isLgViewport
                  ? "Carregar o iframe do preview à direita (ecrã largo)"
                  : "Abrir o preview da home num diálogo com iframe"
              }
              onClick={handlePreview}
            >
              {previewBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
              Preview
            </TippedButton>
            {previewUrl ? (
              <TippedButton
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1 px-2 text-xs"
                disabled={previewBusy}
                label="Nova sessão de preview na loja com o layout actual (mantém modal ou painel)"
                onClick={handlePreviewRefresh}
              >
                <RefreshCw className={cn("h-3.5 w-3.5", previewBusy && "animate-spin")} />
                Actualizar
              </TippedButton>
            ) : null}
            <TippedButton
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              disabled={savingDraft}
              label="Guardar o layout actual como rascunho no servidor (Ctrl+S)"
              onClick={() => void handleSaveDraft()}
            >
              {savingDraft ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Gravar rascunho
            </TippedButton>
            <TippedButton
              type="button"
              size="sm"
              className="h-8 text-xs"
              disabled={publishing}
              label={
                editorIssues.ok
                  ? "Rever secções e confirmar publicação na loja"
                  : "Corrige os erros indicados nos cartões antes de publicar"
              }
              onClick={() => setPublishOpen(true)}
            >
              {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Publicar
            </TippedButton>
          </div>
        </PageToolbar>

        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col lg:flex-row lg:items-stretch",
            previewBeside && previewUrl && isLgViewport ? "lg:divide-x lg:divide-border/50" : ""
          )}
        >
          <div
            className={cn(
              "min-h-0 flex-1 overflow-auto bg-linear-to-b from-muted/25 via-background to-muted/15",
              previewBeside && previewUrl && isLgViewport
                ? "lg:max-w-[min(800px,46%)] lg:shrink-0"
                : ""
            )}
          >
            <div className="mx-auto max-w-4xl space-y-4 px-4 py-5 md:px-6 md:py-6">
            {error ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-xs shadow-sm">
                <p className="mb-1 font-semibold text-destructive">Erro ao carregar</p>
                <p className="mb-3 text-muted-foreground">{error.message}</p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Tentar novamente
                </Button>
              </div>
            ) : null}

            {loading && !serverRow ? (
              <StoreHomeBlocksSkeleton />
            ) : (
              <>
                {editorIssues.documentMessages.length > 0 ? (
                  <div className="rounded-xl border border-destructive/35 bg-destructive/5 px-4 py-3 text-[11px] text-destructive shadow-sm">
                    <p className="mb-1 flex items-center gap-1.5 font-semibold">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      Erros ao nível do documento
                    </p>
                    <ul className="list-inside list-disc space-y-0.5 leading-snug">
                      {editorIssues.documentMessages.map((m, i) => (
                        <li key={`doc-${i}-${m}`}>{m}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <Card className="border-border/60 bg-card/80 py-3 shadow-sm backdrop-blur-sm">
                  <CardContent className="flex gap-3 px-4 py-0">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Info className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 space-y-1 text-[11px] leading-relaxed text-muted-foreground">
                      <p>
                        <span className="font-medium text-foreground">Última actualização (servidor):</span>{" "}
                        {meta.updatedAt}. O rascunho substitui o rascunho anterior ao gravar; a loja só muda ao
                        publicar.
                      </p>
                     
                      <p>
                        Atalhos: <span className="font-medium text-foreground">Ctrl+S</span> gravar rascunho ·{" "}
                        <span className="font-medium text-foreground">Ctrl+Z</span> /{" "}
                        <span className="font-medium text-foreground">Ctrl+Shift+Z</span> desfazer ou refazer
                        (fora de campos de texto).
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <StoreHomeHeaderNavPanel
                  items={doc.headerNavItems}
                  onChange={(next) =>
                    mutateDoc((d) => ({
                      ...d,
                      headerNavItems: next?.length ? next : undefined,
                    }))
                  }
                />

                {doc.blocks.length === 0 ? (
                  <StoreHomeEmptyBlocks addType={addType} onAdd={addBlock} />
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext
                      items={doc.blocks.map((b) => b.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {doc.blocks.map((block, index) => {
                          const bodyOpen = blockBodyOpen[block.id] !== false
                          const reg = HOME_BLOCK_REGISTRY[block.type]
                          const blockProblems = editorIssues.byBlockId[block.id]
                          return (
                            <StoreHomeSortableBlockShell key={block.id} id={block.id}>
                              {(dragHandle) => (
                                <Collapsible
                                  open={bodyOpen}
                                  onOpenChange={(open) => setBlockBodyExpanded(block.id, open)}
                                >
                                  <Card
                                    className={cn(
                                      "overflow-hidden rounded-xl border-border/60 py-0 shadow-sm transition-shadow duration-200 hover:border-primary/15 hover:shadow-md gap-0",
                                      blockProblems?.length
                                        ? "border-destructive/55 ring-1 ring-destructive/15"
                                        : ""
                                    )}
                                  >
                                    <div className="border-b border-border/50 bg-muted/30 px-3 py-2.5 md:px-4">
                                      <div className="flex flex-row items-start justify-between gap-2">
                                        <div className="flex min-w-0 flex-1 items-start gap-1">
                                          <TippedButton
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="mt-0.5 h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                                            aria-expanded={bodyOpen}
                                            aria-label={bodyOpen ? "Recolher secção" : "Expandir secção"}
                                            label={bodyOpen ? "Recolher formulário desta secção" : "Expandir formulário desta secção"}
                                            onClick={() => setBlockBodyExpanded(block.id, !bodyOpen)}
                                          >
                                            {bodyOpen ? (
                                              <ChevronDown className="h-3.5 w-3.5" />
                                            ) : (
                                              <ChevronRight className="h-3.5 w-3.5" />
                                            )}
                                          </TippedButton>
                                          {dragHandle}
                                          <div className="min-w-0 flex-1 space-y-1">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                              <Badge
                                                variant={block.enabled === false ? "outline" : "secondary"}
                                                className="text-[10px] font-semibold"
                                              >
                                                {reg.label}
                                              </Badge>
                                              {blockProblems?.length ? (
                                                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-destructive">
                                                  <AlertTriangle className="h-3 w-3" />
                                                  {blockProblems.length} erro{blockProblems.length !== 1 ? "s" : ""}
                                                </span>
                                              ) : null}
                                              {block.enabled === false ? (
                                                <span className="text-[10px] text-muted-foreground">Inactivo</span>
                                              ) : null}
                                              <span className="truncate font-mono text-[10px] text-muted-foreground/90">
                                                {block.id}
                                              </span>
                                            </div>
                                            <p
                                              className={`text-[10px] leading-snug text-muted-foreground ${bodyOpen ? "" : "line-clamp-2"}`}
                                            >
                                              {reg.hint ?? reg.description}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex shrink-0 flex-wrap items-center justify-end gap-0.5 sm:gap-1">
                                          <label className="flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 text-[10px] text-muted-foreground hover:bg-background/80">
                                            <input
                                              type="checkbox"
                                              checked={block.enabled !== false}
                                              onChange={(e) =>
                                                updateBlock(index, { ...block, enabled: e.target.checked })
                                              }
                                              className="rounded border-input"
                                            />
                                            Activo
                                          </label>
                                          <TippedButton
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            label="Mover esta secção para cima"
                                            disabled={index === 0}
                                            onClick={() => {
                                              mutateDoc((d) => ({ ...d, blocks: moveBlock(d.blocks, index, -1) }), {
                                                forceHistory: true,
                                              })
                                            }}
                                          >
                                            <ChevronUp className="h-3.5 w-3.5" />
                                          </TippedButton>
                                          <TippedButton
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            label="Mover esta secção para baixo"
                                            disabled={index === doc.blocks.length - 1}
                                            onClick={() => {
                                              mutateDoc((d) => ({ ...d, blocks: moveBlock(d.blocks, index, 1) }), {
                                                forceHistory: true,
                                              })
                                            }}
                                          >
                                            <ChevronDown className="h-3.5 w-3.5" />
                                          </TippedButton>
                                          <TippedButton
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            label="Duplicar este bloco (novo ID) logo abaixo"
                                            onClick={() => {
                                              mutateDoc(
                                                (d) => ({
                                                  ...d,
                                                  blocks: [
                                                    ...d.blocks.slice(0, index + 1),
                                                    duplicateBlock(block),
                                                    ...d.blocks.slice(index + 1),
                                                  ],
                                                }),
                                                { forceHistory: true }
                                              )
                                            }}
                                          >
                                            <Copy className="h-3.5 w-3.5" />
                                          </TippedButton>
                                          <TippedButton
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-destructive hover:text-destructive"
                                            label="Remover esta secção do layout"
                                            onClick={() => removeBlock(index)}
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </TippedButton>
                                        </div>
                                      </div>
                                    </div>
                                    {blockProblems?.length ? (
                                      <div className="border-b border-destructive/30 bg-destructive/5 px-3 py-2 md:px-4">
                                        <ul className="list-inside list-disc space-y-0.5 text-[10px] leading-snug text-destructive">
                                          {blockProblems.map((msg, i) => (
                                            <li key={`${block.id}-${i}-${msg}`}>{msg}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    ) : null}
                                    <CollapsibleContent>
                                      <CardContent className="border-border/40 bg-card/50 px-3 pb-4 pt-3 md:px-4">
                                        {bodyOpen ? (
                                          <StoreHomeBlockFields
                                            block={block}
                                            onChange={(next) => updateBlock(index, next)}
                                          />
                                        ) : null}
                                      </CardContent>
                                    </CollapsibleContent>
                                  </Card>
                                </Collapsible>
                              )}
                            </StoreHomeSortableBlockShell>
                          )
                        })}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </>
            )}
          </div>
        </div>
        {previewBeside && previewUrl && isLgViewport ? (
          <aside className="flex min-h-0 min-w-0 flex-1 flex-col bg-muted/15 lg:flex-1">
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/50 px-3 py-2">
              <span className="truncate text-[11px] font-semibold text-foreground">Preview da home</span>
              <div className="flex shrink-0 items-center gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground"
                  aria-label="Actualizar preview"
                  disabled={previewBusy}
                  onClick={handlePreviewRefresh}
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", previewBusy && "animate-spin")} />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px]" asChild>
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                    Novo separador
                  </a>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground"
                  aria-label="Fechar preview"
                  onClick={() => {
                    setPreviewUrl(null)
                    setPreviewOpen(false)
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="flex min-h-0 flex-1 flex-col p-2 pt-1">
              <div className="flex min-h-0 flex-1 overflow-hidden rounded-md border border-border/70 bg-muted/20">
                <iframe
                  key={previewUrl}
                  title="Preview da home da loja"
                  src={previewUrl}
                  className="h-full min-h-0 w-full border-0 bg-[#f7f8fc]"
                />
              </div>
            </div>
          </aside>
        ) : null}
      </div>
      </div>
    </>
    </TooltipProvider>
  )
}
