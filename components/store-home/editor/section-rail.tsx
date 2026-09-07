"use client"

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { AlertTriangle, Eye, EyeOff, GripVertical, Menu, Plus, Trash2 } from "lucide-react"
import type { HomeBlock } from "@/lib/home-layout/schema"
import {
  HOME_BLOCK_REGISTRY,
  type HomeBlockType,
} from "@/lib/home-layout/registry"
import { summarizeHomeBlock } from "@/lib/home-layout/block-summary"
import { HOME_BLOCK_ICONS } from "./block-icons"
import { HEADER_SELECTION_ID } from "./use-layout-document"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

/**
 * Lista de secções: a espinha do layout.
 *
 * Cada linha diz o que a secção **tem** (via `summarizeHomeBlock`), não só o
 * que ela é — a lista anterior mostrava o tipo, o que obrigava a abrir cada uma
 * para saber o que lá estava. Linhas, não cartões: são itens de uma lista, e
 * cartões aqui só acrescentariam moldura.
 */

type SectionRailProps = {
  blocks: HomeBlock[]
  headerNavCount: number
  selectedId: string | null
  availableTypes: HomeBlockType[]
  errorsByBlockId: Record<string, string[] | undefined>
  onSelect: (id: string) => void
  onReorder: (blocks: HomeBlock[]) => void
  onToggleEnabled: (id: string) => void
  onRemove: (id: string) => void
  onAdd: (type: HomeBlockType) => void
}

export function SectionRail({
  blocks,
  headerNavCount,
  selectedId,
  availableTypes,
  errorsByBlockId,
  onSelect,
  onReorder,
  onToggleEnabled,
  onRemove,
  onAdd,
}: SectionRailProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = blocks.findIndex((b) => b.id === active.id)
    const to = blocks.findIndex((b) => b.id === over.id)
    if (from < 0 || to < 0) return
    onReorder(arrayMove(blocks, from, to))
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border/70 px-3 py-2.5">
        <h2 className="text-[13px] font-semibold text-foreground">Secções</h2>
        <span className="text-[13px] tabular-nums text-muted-foreground">
          {blocks.length}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <button
          type="button"
          onClick={() => onSelect(HEADER_SELECTION_ID)}
          aria-current={selectedId === HEADER_SELECTION_ID ? "true" : undefined}
          className={cn(
            "mb-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left",
            selectedId === HEADER_SELECTION_ID ? "bg-accent" : "hover:bg-muted/60",
          )}
        >
          <Menu className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-foreground">
              Cabeçalho da loja
            </span>
            <span className="block truncate text-[13px] text-muted-foreground">
              {headerNavCount === 0
                ? "Sem links"
                : `${headerNavCount} ${headerNavCount === 1 ? "link" : "links"}`}
            </span>
          </span>
        </button>

        <div className="my-1 h-px bg-border/70" />

        {blocks.length === 0 ? (
          <p className="px-2 py-8 text-center text-[13px] leading-relaxed text-muted-foreground">
            A home está vazia.
            <br />
            Adiciona a primeira secção abaixo.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={blocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-0.5">
                {blocks.map((block) => (
                  <SectionRow
                    key={block.id}
                    block={block}
                    selected={block.id === selectedId}
                    hasErrors={Boolean(errorsByBlockId[block.id]?.length)}
                    onSelect={onSelect}
                    onToggleEnabled={onToggleEnabled}
                    onRemove={onRemove}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <div className="border-t border-border/70 p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="w-full justify-start gap-2">
              <Plus className="size-4" />
              Adicionar secção
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-80 w-72 overflow-y-auto">
            {availableTypes.map((type) => {
              const entry = HOME_BLOCK_REGISTRY[type]
              const Icon = HOME_BLOCK_ICONS[type]
              return (
                <DropdownMenuItem
                  key={type}
                  onSelect={() => onAdd(type)}
                  className="flex-col items-start gap-0.5 py-2"
                >
                  <span className="flex items-center gap-2 font-medium">
                    <Icon className="size-4 text-muted-foreground" />
                    {entry.label}
                  </span>
                  <span className="pl-6 text-[13px] leading-snug text-muted-foreground">
                    {entry.description}
                  </span>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

function SectionRow({
  block,
  selected,
  hasErrors,
  onSelect,
  onToggleEnabled,
  onRemove,
}: {
  block: HomeBlock
  selected: boolean
  hasErrors: boolean
  onSelect: (id: string) => void
  onToggleEnabled: (id: string) => void
  onRemove: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id })

  const entry = HOME_BLOCK_REGISTRY[block.type]
  const Icon = HOME_BLOCK_ICONS[block.type]
  const summary = summarizeHomeBlock(block)
  const disabled = block.enabled === false

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group relative flex items-center gap-1 rounded-md pr-1",
        selected ? "bg-accent" : "hover:bg-muted/60",
        isDragging && "z-10 opacity-80 shadow-sm",
      )}
    >
      <button
        type="button"
        aria-label="Reordenar secção"
        className="flex h-9 w-5 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3.5" />
      </button>

      <button
        type="button"
        onClick={() => onSelect(block.id)}
        aria-current={selected ? "true" : undefined}
        className="flex min-w-0 flex-1 items-center gap-2 py-1.5 pr-1 text-left focus-visible:outline-none"
      >
        <Icon
          className={cn(
            "size-4 shrink-0",
            disabled ? "text-muted-foreground/40" : "text-muted-foreground",
          )}
        />
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "flex items-center gap-1.5 truncate text-[13px] font-medium",
              disabled ? "text-muted-foreground line-through" : "text-foreground",
            )}
          >
            {entry.label}
            {hasErrors ? (
              <AlertTriangle
                className="size-3.5 shrink-0 text-destructive"
                aria-label="Secção com erros"
              />
            ) : null}
          </span>
          {summary ? (
            <span className="block truncate text-[13px] text-muted-foreground">
              {summary}
            </span>
          ) : null}
        </span>
      </button>

      <div className="flex shrink-0 items-center opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground"
          aria-label={disabled ? "Mostrar secção na loja" : "Esconder secção da loja"}
          onClick={() => onToggleEnabled(block.id)}
        >
          {disabled ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:text-destructive"
          aria-label="Remover secção"
          onClick={() => onRemove(block.id)}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </li>
  )
}
