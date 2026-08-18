"use client"

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react"
import {
  ChevronDown,
  FolderTree,
  House,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Category } from "@/lib/graphql/categories/types"
import { cn } from "@/lib/utils"

type CategoryGroup = {
  root: Category
  children: Category[]
}

type CategoryTreeProps = {
  groups: CategoryGroup[]
  query: string
  deletingId: string | null
  onEdit: (category: Category) => void
  onDelete: (category: Category, childCount: number) => void
}

function matchesQuery(category: Category, q: string): boolean {
  if (!q) return true
  const hay = `${category.name} ${category.slug} ${category.description ?? ""}`.toLowerCase()
  return hay.includes(q)
}

function CategoryThumb({
  category,
  size,
}: {
  category: Category
  size: "sm" | "md"
}) {
  const dim = size === "md" ? "h-9 w-9" : "h-7 w-7"
  const imageUrl = category.image?.trim()
  const icon = category.icon?.trim()

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-md border border-border/70 overflow-hidden shrink-0 bg-muted/50",
        dim,
      )}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      ) : icon ? (
        <span className="text-sm leading-none" aria-hidden>
          {icon}
        </span>
      ) : (
        <FolderTree className={cn("text-muted-foreground/70", size === "md" ? "h-4 w-4" : "h-3.5 w-3.5")} />
      )}
    </div>
  )
}

function StatusDot({ code }: { code?: string }) {
  const active = code?.toUpperCase() === "ACTIVE"
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          active ? "bg-emerald-500" : "bg-muted-foreground/40",
        )}
        aria-hidden
      />
      {active ? "Ativo" : "Inativo"}
    </span>
  )
}

function CategoryRow({
  category,
  depth,
  childCount,
  expanded,
  onToggle,
  deleting,
  onEdit,
  onDelete,
}: {
  category: Category
  depth: 0 | 1
  childCount?: number
  expanded?: boolean
  onToggle?: () => void
  deleting: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const hasChildren = (childCount ?? 0) > 0
  const showOnHome = category.showOnHome !== false

  return (
    <div
      className={cn(
        "group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 transition-colors duration-150 ease-out",
        "hover:bg-muted/40 focus-within:bg-muted/40",
        depth === 0 && "bg-card",
        depth === 1 && "bg-background/60",
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {depth === 0 ? (
          hasChildren ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground"
              aria-expanded={expanded}
              aria-label={expanded ? "Fechar subcategorias" : "Abrir subcategorias"}
              onClick={onToggle}
            >
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-150 ease-out motion-reduce:transition-none",
                  !expanded && "-rotate-90",
                )}
              />
            </Button>
          ) : (
            <span className="w-6" aria-hidden />
          )
        ) : (
          <span className="relative w-6 shrink-0 self-stretch" aria-hidden>
            <span className="absolute left-1/2 -top-2.5 h-[calc(50%+10px)] w-px bg-border" />
            <span className="absolute left-1/2 top-1/2 h-px w-2.5 bg-border" />
          </span>
        )}

        <button
          type="button"
          onClick={onEdit}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <CategoryThumb category={category} size={depth === 0 ? "md" : "sm"} />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "truncate text-foreground",
                  depth === 0 ? "text-sm font-semibold" : "text-sm font-medium",
                )}
              >
                {category.name}
              </span>
              {depth === 0 && hasChildren ? (
                <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                  {childCount} sub
                </span>
              ) : null}
            </span>
            <span className="mt-0.5 block truncate font-mono text-[11px] text-muted-foreground">
              /{category.slug}
            </span>
          </span>
        </button>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <span
          className={cn(
            "hidden sm:inline-flex h-6 w-6 items-center justify-center rounded-md",
            showOnHome
              ? "text-foreground"
              : "text-muted-foreground/35",
          )}
          title={showOnHome ? "Visível na home" : "Oculta na home"}
        >
          <House className="h-3.5 w-3.5" />
        </span>
        <span className="hidden md:inline-flex min-w-18">
          <StatusDot code={category.status?.code} />
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
              aria-label={`Ações de ${category.name}`}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <MoreHorizontal className="h-3.5 w-3.5" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={onDelete}
              disabled={deleting}
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export function CategoryTree({
  groups,
  query,
  deletingId,
  onEdit,
  onDelete,
}: CategoryTreeProps) {
  const q = query.trim().toLowerCase()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const visible = useMemo(() => {
    if (!q) return groups
    return groups.flatMap(({ root, children }) => {
      const rootHit = matchesQuery(root, q)
      const childHits = children.filter((c) => matchesQuery(c, q))
      if (rootHit) return [{ root, children }]
      if (childHits.length) return [{ root, children: childHits }]
      return []
    })
  }, [groups, q])

  if (visible.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 px-4 text-center">
        <FolderTree className="mb-3 h-7 w-7 text-muted-foreground/40" />
        <p className="text-sm font-semibold text-foreground">Nenhum resultado</p>
        <p className="mt-1 text-xs text-muted-foreground">Ajuste o termo de pesquisa.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="hidden sm:grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border/70 bg-muted/25 px-3 py-1.5">
        <p className="pl-8 text-[11px] font-medium text-muted-foreground">Categoria</p>
        <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
          <span className="inline-flex h-6 w-6 items-center justify-center" title="Home">
            <House className="h-3.5 w-3.5" />
          </span>
          <span className="hidden md:inline-flex min-w-18">Estado</span>
          <span className="w-7" aria-hidden />
        </div>
      </div>

      {visible.map(({ root, children }, index) => {
        const expanded = q ? true : !collapsed[root.id]
        return (
          <section
            key={root.id}
            className={cn(index > 0 && "border-t border-border/70")}
          >
            <CategoryRow
              category={root}
              depth={0}
              childCount={children.length}
              expanded={expanded}
              onToggle={() =>
                setCollapsed((prev) => ({ ...prev, [root.id]: !prev[root.id] }))
              }
              deleting={deletingId === root.id}
              onEdit={() => onEdit(root)}
              onDelete={() => onDelete(root, children.length)}
            />
            <div
              className={cn(
                "grid motion-safe:transition-[grid-template-rows] motion-safe:duration-200 motion-safe:ease-out",
                expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                {children.map((child) => (
                  <div key={child.id} className="border-t border-border/50">
                    <CategoryRow
                      category={child}
                      depth={1}
                      deleting={deletingId === child.id}
                      onEdit={() => onEdit(child)}
                      onDelete={() => onDelete(child, 0)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )
      })}
    </div>
  )
}
