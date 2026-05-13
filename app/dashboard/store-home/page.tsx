"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
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
import { LayoutGrid, Loader2, Plus, Trash2, ChevronUp, ChevronDown, Copy, RotateCcw } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { showToast } from "@/lib/utils/toast"
import type { HomeBlock, HomeLayoutDocument } from "@/lib/home-layout/schema"
import { parseHomeLayoutDocument, homeLayoutDocumentSchema, homeBlockSchema } from "@/lib/home-layout/schema"
import { DEFAULT_HOME_LAYOUT } from "@/lib/home-layout/default-layout"
import { HOME_BLOCK_REGISTRY, HOME_BLOCK_TYPES, type HomeBlockType } from "@/lib/home-layout/registry"
import { createEmptyBlock } from "@/lib/home-layout/block-factory"
import { StoreHomeBlockFields } from "@/components/store-home/store-home-block-fields"
import { StoreHomeSortableBlockShell } from "@/components/store-home/store-home-sortable-block-shell"
import { revalidateTecharenaHome } from "@/app/dashboard/store-home/actions"

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
  const [addType, setAddType] = useState<HomeBlockType>("productRail")
  const [dirty, setDirty] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const serverRow = data?.storeHomeLayout

  useEffect(() => {
    if (dirty) return
    setDoc(layoutFromServerRow(serverRow ?? null))
  }, [serverRow?.id, serverRow?.updatedAt, serverRow?.draftPayload, serverRow?.publishedPayload, dirty])

  const meta = useMemo(() => {
    const publishedAt = serverRow?.publishedAt
      ? new Date(serverRow.publishedAt).toLocaleString("pt-PT")
      : "—"
    const updatedAt = serverRow?.updatedAt
      ? new Date(serverRow.updatedAt).toLocaleString("pt-PT")
      : "—"
    return { publishedAt, updatedAt }
  }, [serverRow?.publishedAt, serverRow?.updatedAt])

  const validateAndGetPayload = useCallback((): HomeLayoutDocument | null => {
    const parsed = homeLayoutDocumentSchema.safeParse(doc)
    if (!parsed.success) {
      const msg = parsed.error.issues.map((e) => e.message).join(" · ")
      showToast.error("Layout inválido", msg)
      return null
    }
    return parsed.data
  }, [doc])

  const handleSaveDraft = async () => {
    const payload = validateAndGetPayload()
    if (!payload) return
    try {
      await saveDraft({ variables: { payload } })
      setDirty(false)
      showToast.success("Rascunho gravado", "O layout foi guardado como rascunho.")
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : "Erro ao gravar"
      showToast.error("Erro", m)
    }
  }

  const handlePublish = async () => {
    const payload = validateAndGetPayload()
    if (!payload) return
    if (!confirm("Publicar este layout na loja? Os visitantes passam a ver a versão publicada.")) return
    try {
      await publishLayout({ variables: { payload } })
      setDirty(false)
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
  }

  const updateBlock = (index: number, next: HomeBlock) => {
    setDirty(true)
    setDoc((d) => ({
      ...d,
      blocks: d.blocks.map((b, i) => (i === index ? next : b)),
    }))
  }

  const removeBlock = (index: number) => {
    setDirty(true)
    setDoc((d) => ({ ...d, blocks: d.blocks.filter((_, i) => i !== index) }))
  }

  const addBlock = () => {
    setDirty(true)
    setDoc((d) => ({
      ...d,
      blocks: [...d.blocks, createEmptyBlock(addType)],
    }))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setDirty(true)
    setDoc((d) => {
      const oldIndex = d.blocks.findIndex((b) => b.id === active.id)
      const newIndex = d.blocks.findIndex((b) => b.id === over.id)
      if (oldIndex < 0 || newIndex < 0) return d
      return { ...d, blocks: arrayMove(d.blocks, oldIndex, newIndex) }
    })
  }

  const handleDiscard = async () => {
    if (!dirty) return
    if (!confirm("Descartar alterações locais e voltar ao que está no servidor?")) return
    setDirty(false)
    await refetch()
  }

  return (
    <>
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
            loading
              ? "A carregar…"
              : `${doc.blocks.length} secç${doc.blocks.length !== 1 ? "ões" : "ão"} · Publicado: ${meta.publishedAt}`
          }
        >
          <div className="flex flex-wrap items-center gap-2">
            <Select value={addType} onValueChange={(v) => setAddType(v as HomeBlockType)}>
              <SelectTrigger className="h-8 w-[180px] text-xs">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {HOME_BLOCK_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {HOME_BLOCK_REGISTRY[t].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={addBlock}>
              <Plus className="h-3.5 w-3.5" />
              Adicionar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1 text-muted-foreground"
              disabled={!dirty}
              onClick={handleDiscard}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Descartar
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              disabled={savingDraft}
              onClick={handleSaveDraft}
            >
              {savingDraft ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Gravar rascunho
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 text-xs"
              disabled={publishing}
              onClick={handlePublish}
            >
              {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Publicar
            </Button>
          </div>
        </PageToolbar>

        <div className="flex-1 overflow-auto p-4 md:p-5 bg-background space-y-3">
          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs">
              <p className="font-semibold text-destructive mb-1">Erro ao carregar</p>
              <p className="text-muted-foreground mb-2">{error.message}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </div>
          ) : null}

          <p className="text-[11px] text-muted-foreground">
            Última actualização (servidor): {meta.updatedAt}. O rascunho tem prioridade sobre o publicado ao editar.
            Arrasta pelo ícone de agarrar à esquerda do tipo de bloco para reordenar.
          </p>

          {loading && !serverRow ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> A carregar layout…
            </div>
          ) : null}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={doc.blocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2 max-w-3xl">
                {doc.blocks.map((block, index) => (
                  <StoreHomeSortableBlockShell key={block.id} id={block.id}>
                    {(dragHandle) => (
              <Card className="border-border/80 shadow-none py-3 gap-0">
                <div className="flex flex-row items-start justify-between gap-2 px-3 pb-2 border-b border-border/60">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    {dragHandle}
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {HOME_BLOCK_REGISTRY[block.type].label}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono truncate">{block.id}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <label className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer">
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setDirty(true)
                        setDoc((d) => ({ ...d, blocks: moveBlock(d.blocks, index, -1) }))
                      }}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setDirty(true)
                        setDoc((d) => ({ ...d, blocks: moveBlock(d.blocks, index, 1) }))
                      }}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setDirty(true)
                        setDoc((d) => ({
                          ...d,
                          blocks: [...d.blocks.slice(0, index + 1), duplicateBlock(block), ...d.blocks.slice(index + 1)],
                        }))
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => removeBlock(index)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <CardContent className="px-3 pt-3 pb-0">
                  <StoreHomeBlockFields block={block} onChange={(next) => updateBlock(index, next)} />
                </CardContent>
              </Card>
                    )}
                  </StoreHomeSortableBlockShell>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </>
  )
}
