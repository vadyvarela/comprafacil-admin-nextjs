"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useQuery } from "@apollo/client/react"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { SettingsSubnav } from "@/components/layout/settings-subnav"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useConfirmDialog } from "@/components/ui/confirm-dialog"
import { Button } from "@/components/ui/button"
import { GET_STORE_SETTINGS } from "@/lib/graphql/store-settings/queries"
import type { StoreSettingsQueryData } from "@/lib/graphql/store-settings/types"
import type { StoreVertical } from "@/lib/store-presets"
import {
  HOME_BLOCK_REGISTRY,
  getHomeBlockTypesForVertical,
  type HomeBlockType,
} from "@/lib/home-layout/registry"
import type { HomeBlock } from "@/lib/home-layout/schema"
import { showToast } from "@/lib/utils/toast"
import { DocumentBar } from "@/components/store-home/editor/document-bar"
import { EditorCanvas } from "@/components/store-home/editor/editor-canvas"
import { Inspector } from "@/components/store-home/editor/inspector"
import { SectionRail } from "@/components/store-home/editor/section-rail"
import {
  HEADER_SELECTION_ID,
  useLayoutDocument,
} from "@/components/store-home/editor/use-layout-document"
import { usePreviewSession } from "@/components/store-home/editor/use-preview-session"
import { revalidateTecharenaHome } from "./actions"

/**
 * Page builder da home, orientado ao canvas.
 *
 * Três zonas: lista de secções, o preview da loja (a superfície de trabalho) e
 * o inspector da secção seleccionada. O estado do documento e a sessão de
 * preview vivem em hooks próprios; aqui só se compõem as zonas e se ligam as
 * duas metades da selecção — lista e canvas seleccionam a mesma coisa.
 */
export default function PageBuilderPage() {
  const doc = useLayoutDocument()
  const { confirm, confirmDialog } = useConfirmDialog()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data: settingsData } = useQuery<StoreSettingsQueryData>(GET_STORE_SETTINGS)
  const storeVertical = (settingsData?.storeSettings?.storeVertical ??
    "tech") as StoreVertical
  const availableTypes = useMemo(
    () => getHomeBlockTypesForVertical(storeVertical),
    [storeVertical],
  )

  const preview = usePreviewSession({
    onSelectBlock: (blockId) => setSelectedId(blockId),
  })

  const { doc: document, blocks, validate } = doc
  const { open: openPreview, scheduleRefresh } = preview

  // Primeira sessão de preview assim que houver layout do servidor.
  const previewUrl = preview.url
  useEffect(() => {
    if (previewUrl || !doc.hasServerRow || blocks.length === 0) return
    const payload = validate()
    if (payload) void openPreview(payload)
  }, [previewUrl, doc.hasServerRow, blocks.length, validate, openPreview])

  // O canvas segue as edições, agrupadas para não recarregar a cada tecla.
  useEffect(() => {
    if (!previewUrl || !doc.dirty) return
    scheduleRefresh(document)
  }, [previewUrl, doc.dirty, document, scheduleRefresh])

  // A selecção não pode sobreviver à secção que a originou.
  useEffect(() => {
    if (selectedId === HEADER_SELECTION_ID) return
    if (selectedId && !blocks.some((b) => b.id === selectedId)) {
      setSelectedId(null)
    }
  }, [blocks, selectedId])

  const selectedBlock = blocks.find((b) => b.id === selectedId) ?? null

  const handleAdd = useCallback(
    (type: HomeBlockType) => setSelectedId(doc.addBlock(type)),
    [doc],
  )

  const handleRemove = useCallback(
    async (id: string) => {
      const block = blocks.find((b) => b.id === id)
      if (!block) return
      const label = HOME_BLOCK_REGISTRY[block.type]?.label ?? block.type
      const confirmed = await confirm({
        title: "Remover secção?",
        description: `Está prestes a remover "${label}" da home.`,
        impact:
          "Sai do layout local. Só afeta a loja pública depois de publicar.",
        confirmText: "Remover secção",
        variant: "destructive",
      })
      if (confirmed) doc.removeBlock(id)
    },
    [blocks, confirm, doc],
  )

  const handleDiscard = useCallback(async () => {
    const confirmed = await confirm({
      title: "Descartar alterações?",
      description: "Está prestes a voltar ao layout guardado no servidor.",
      impact: "As alterações locais que ainda não foram guardadas perdem-se.",
      confirmText: "Descartar alterações",
      variant: "destructive",
    })
    if (confirmed) await doc.discard()
  }, [confirm, doc])

  const handlePublish = useCallback(async () => {
    const confirmed = await confirm({
      title: "Publicar na loja?",
      description: `${doc.meta.active} de ${doc.meta.total} secções ficam visíveis na loja pública.`,
      impact: "Os visitantes passam a ver este layout.",
      confirmText: "Publicar",
    })
    if (!confirmed) return

    const ok = await doc.publish()
    if (!ok) return

    const rev = await revalidateTecharenaHome()
    if ("skipped" in rev && rev.skipped) {
      showToast.success(
        "Publicado",
        "Define TECHARENA_REVALIDATE_URL e SECRET para invalidar a cache automaticamente.",
      )
    } else if (rev.ok) {
      showToast.success("Publicado", "Cache da home invalidada.")
    } else {
      showToast.warning(
        "Publicado — cache não invalidada",
        "message" in rev ? rev.message : "Confirma as variáveis de revalidação.",
      )
    }
  }, [confirm, doc])

  const handleFieldChange = useCallback(
    (next: HomeBlock) => {
      if (selectedId) doc.updateBlock(selectedId, next)
    },
    [doc, selectedId],
  )

  // Ctrl+S grava, Ctrl+Z / Ctrl+Shift+Z andam no histórico — mas nunca por cima
  // do comportamento nativo dentro de um campo de texto.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const inField = (event.target as HTMLElement | null)?.closest?.(
        "input, textarea, select, [contenteditable=true]",
      )
      const mod = event.ctrlKey || event.metaKey
      if (!mod) return
      const key = event.key.toLowerCase()
      if (key === "s") {
        event.preventDefault()
        void doc.saveDraft()
        return
      }
      if (inField) return
      if (key === "z" && !event.shiftKey) {
        event.preventDefault()
        doc.undo()
      } else if ((key === "z" && event.shiftKey) || key === "y") {
        event.preventDefault()
        doc.redo()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [doc])

  return (
    <TooltipProvider delayDuration={280}>
      <DashboardHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Definições", href: "/dashboard/settings" },
          { label: "Page Builder" },
        ]}
      />
      <SettingsSubnav />

      <div className="flex min-h-0 flex-1 flex-col">
        <DocumentBar
          dirty={doc.dirty}
          savingDraft={doc.savingDraft}
          publishing={doc.publishing}
          lastAutosaveAt={doc.lastAutosaveAt}
          publishedAt={doc.meta.publishedAt}
          blocksWithErrors={doc.meta.withErrors}
          canUndo={doc.canUndo}
          canRedo={doc.canRedo}
          onUndo={doc.undo}
          onRedo={doc.redo}
          onDiscard={() => void handleDiscard()}
          onPublish={() => void handlePublish()}
        />

        {doc.error ? (
          <div className="border-b border-destructive/30 bg-destructive/5 px-4 py-3">
            <p className="text-[13px] font-semibold text-destructive">
              Não foi possível carregar o layout
            </p>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {doc.error.message}
            </p>
          </div>
        ) : null}

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_360px]">
          <aside className="hidden min-h-0 border-r border-border/70 lg:block">
            <SectionRail
              blocks={blocks}
              headerNavCount={document.headerNavItems.length}
              selectedId={selectedId}
              availableTypes={availableTypes}
              errorsByBlockId={doc.issues.byBlockId}
              onSelect={setSelectedId}
              onReorder={doc.reorderBlocks}
              onToggleEnabled={doc.toggleBlockEnabled}
              onRemove={(id) => void handleRemove(id)}
              onAdd={handleAdd}
            />
          </aside>

          <main className="min-h-0">
            <EditorCanvas
              url={preview.url}
              busy={preview.busy}
              error={preview.error}
              device={preview.device}
              isEmpty={blocks.length === 0}
              onDeviceChange={preview.setDevice}
              onRefresh={() => {
                const payload = validate()
                if (payload) void preview.refreshNow(payload)
              }}
            />
          </main>

          <aside className="hidden min-h-0 border-l border-border/70 lg:block">
            <Inspector
              mode={
                selectedId === HEADER_SELECTION_ID
                  ? "header"
                  : selectedBlock
                    ? "block"
                    : "none"
              }
              block={selectedBlock}
              headerNavItems={document.headerNavItems}
              errors={selectedId ? (doc.issues.byBlockId[selectedId] ?? []) : []}
              onChange={handleFieldChange}
              onHeaderNavChange={doc.updateHeaderNav}
            />
          </aside>
        </div>

        {/* Abaixo de lg as três zonas não cabem lado a lado; o editor empilha. */}
        <div className="border-t border-border/70 p-4 lg:hidden">
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            O editor da home precisa de um ecrã largo para mostrar lista,
            preview e campos ao mesmo tempo. Abre num monitor ou alarga a
            janela.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              const payload = validate()
              if (payload) void preview.refreshNow(payload)
            }}
          >
            Ver preview da loja
          </Button>
        </div>
      </div>

      {confirmDialog}
    </TooltipProvider>
  )
}
