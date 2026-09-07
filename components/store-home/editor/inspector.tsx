"use client"

import dynamic from "next/dynamic"
import { AlertTriangle, Menu, MousePointerSquareDashed } from "lucide-react"
import type { HeaderNavItem, HomeBlock } from "@/lib/home-layout/schema"
import { StoreHomeHeaderNavPanel } from "@/components/store-home/store-home-header-nav-panel"
import { HOME_BLOCK_REGISTRY } from "@/lib/home-layout/registry"
import { HOME_BLOCK_ICONS } from "./block-icons"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Campos da secção seleccionada.
 *
 * Carregado por `dynamic` porque o editor de campos arrasta o picker de
 * produtos e a query de categorias — nada disso é preciso até haver selecção.
 */
const StoreHomeBlockFields = dynamic(
  () =>
    import("@/components/store-home/store-home-block-fields").then(
      (m) => m.StoreHomeBlockFields,
    ),
  { ssr: false, loading: () => <FieldsSkeleton /> },
)

type InspectorProps = {
  /** `"header"` edita a navegação do cabeçalho, que é do documento e não uma secção. */
  mode: "header" | "block" | "none"
  block: HomeBlock | null
  headerNavItems: HeaderNavItem[]
  errors: string[]
  onChange: (next: HomeBlock) => void
  onHeaderNavChange: (next: HeaderNavItem[]) => void
}

export function Inspector({
  mode,
  block,
  headerNavItems,
  errors,
  onChange,
  onHeaderNavChange,
}: InspectorProps) {
  if (mode === "header") {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <header className="border-b border-border/70 px-4 py-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Menu className="size-4 text-muted-foreground" />
            Cabeçalho da loja
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            Links do menu principal, visíveis em todas as páginas da loja.
          </p>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <StoreHomeHeaderNavPanel
            items={headerNavItems}
            onChange={onHeaderNavChange}
          />
        </div>
      </div>
    )
  }

  if (!block) return <InspectorEmpty />

  const entry = HOME_BLOCK_REGISTRY[block.type]
  const Icon = HOME_BLOCK_ICONS[block.type]

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="border-b border-border/70 px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Icon className="size-4 text-muted-foreground" />
          {entry.label}
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          {entry.description}
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {errors.length > 0 ? (
          <div
            role="alert"
            className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5"
          >
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-destructive">
              <AlertTriangle className="size-3.5 shrink-0" />
              {errors.length === 1
                ? "Corrige isto antes de publicar"
                : `Corrige ${errors.length} pontos antes de publicar`}
            </p>
            <ul className="mt-1.5 space-y-1 pl-5 text-[13px] leading-snug text-destructive">
              {errors.map((message, i) => (
                <li key={`${i}-${message}`} className="list-disc">
                  {message}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {entry.hint ? (
          <p className="mb-4 rounded-md bg-muted/60 px-3 py-2 text-[13px] leading-relaxed text-muted-foreground">
            {entry.hint}
          </p>
        ) : null}

        <StoreHomeBlockFields block={block} onChange={onChange} />
      </div>
    </div>
  )
}

/** Estado vazio que ensina a interface em vez de dizer que não há nada. */
function InspectorEmpty() {
  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="flex max-w-[15rem] flex-col items-center gap-2 text-center">
        <MousePointerSquareDashed className="size-5 text-muted-foreground/70" />
        <p className="text-sm font-medium text-foreground">Nenhuma secção seleccionada</p>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Carrega numa secção no preview, ou na lista à esquerda, para editares
          os seus campos aqui.
        </p>
      </div>
    </div>
  )
}

function FieldsSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  )
}
