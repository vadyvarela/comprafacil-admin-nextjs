"use client"

import { useState } from "react"
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react"
import { CATEGORY_TABS_RULES } from "@/lib/home-layout/schema"
import {
  Button,
  HOME_LAYOUT_RULES,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  resolveCategoryId,
  useSortedCategoryList,
  type BlockFieldsProps,
  type HomeBlock,
} from "./shared"

type Block = Extract<HomeBlock, { type: "categoryTabs" }>
type Tab = Block["props"]["tabs"][number]

/**
 * Campo numérico que deixa apagar o valor enquanto se escreve.
 * Só grava números válidos, já limitados a [min, max]; ao sair repõe o valor gravado.
 */
function ClampedNumberInput({
  value,
  min,
  max,
  onChange,
  id,
}: {
  value: number
  min: number
  max: number
  onChange: (next: number) => void
  id?: string
}) {
  const [draft, setDraft] = useState<string | null>(null)
  return (
    <Input
      id={id}
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      className="h-8 text-xs"
      value={draft ?? String(value)}
      onChange={(e) => {
        const raw = e.target.value
        setDraft(raw)
        const n = Number(raw)
        if (raw.trim() === "" || !Number.isFinite(n)) return
        onChange(Math.min(max, Math.max(min, Math.trunc(n))))
      }}
      onBlur={() => setDraft(null)}
    />
  )
}

export function CategoryTabsFields({ block, onChange }: BlockFieldsProps<Block>) {
  const { list, loading } = useSortedCategoryList()

  const tabs = block.props.tabs
  const setProps = (patch: Partial<Block["props"]>) =>
    onChange({ ...block, props: { ...block.props, ...patch } })
  const setTabs = (next: Tab[]) => setProps({ tabs: next })
  const updateTab = (index: number, patch: Partial<Tab>) =>
    setTabs(tabs.map((tab, i) => (i === index ? { ...tab, ...patch } : tab)))
  const moveTab = (index: number, delta: -1 | 1) => {
    const target = index + delta
    if (target < 0 || target >= tabs.length) return
    const next = [...tabs]
    ;[next[index], next[target]] = [next[target], next[index]]
    setTabs(next)
  }

  const usedSlugs = new Set(tabs.map((tab) => tab.categorySlug))
  const nextFreeCategory = list.find((c) => !usedSlugs.has(c.slug))

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1 sm:col-span-2">
        <Label className="flex items-center justify-between gap-2 text-[11px]">
          <span>Título (opcional)</span>
          <span className="font-normal text-muted-foreground tabular-nums">
            {(block.props.title ?? "").length}/{HOME_LAYOUT_RULES.titleMax}
          </span>
        </Label>
        <Input
          className="h-8 text-xs"
          maxLength={HOME_LAYOUT_RULES.titleMax}
          value={block.props.title ?? ""}
          onChange={(e) => setProps({ title: e.target.value.trim() ? e.target.value : undefined })}
        />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label className="flex items-center justify-between gap-2 text-[11px]">
          <span>Subtítulo (opcional)</span>
          <span className="font-normal text-muted-foreground tabular-nums">
            {(block.props.subtitle ?? "").length}/{HOME_LAYOUT_RULES.subtitleMax}
          </span>
        </Label>
        <Input
          className="h-8 text-xs"
          maxLength={HOME_LAYOUT_RULES.subtitleMax}
          value={block.props.subtitle ?? ""}
          onChange={(e) => setProps({ subtitle: e.target.value.trim() ? e.target.value : undefined })}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${block.id}-limit`} className="text-[11px]">
          Produtos por tab
        </Label>
        <ClampedNumberInput
          id={`${block.id}-limit`}
          min={1}
          max={HOME_LAYOUT_RULES.railLimitMax}
          value={block.props.limit}
          onChange={(limit) => setProps({ limit })}
        />
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label className="flex items-center justify-between gap-2 text-[11px]">
          <span>Tabs (por ordem)</span>
          <span className="font-normal text-muted-foreground tabular-nums">
            {tabs.length} / {CATEGORY_TABS_RULES.maxTabs}
          </span>
        </Label>

        {tabs.map((tab, index) => {
          const selectedId = resolveCategoryId(list, tab.categoryId, tab.categorySlug)
          const missing = !loading && list.length > 0 && !selectedId
          return (
            // Slugs são únicos no bloco (o schema garante): a linha mantém-se ao mudar de posição.
            <div key={tab.categorySlug} className="space-y-1 rounded-md border p-2">
              <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <Select
                  value={selectedId || undefined}
                  disabled={loading && list.length === 0}
                  onValueChange={(id) => {
                    const cat = list.find((c) => c.id === id)
                    if (!cat) return
                    updateTab(index, { categoryId: cat.id, categorySlug: cat.slug })
                  }}
                >
                  <SelectTrigger
                    className="h-8 text-xs"
                    aria-label={`Categoria da tab ${index + 1}`}
                    aria-invalid={missing || undefined}
                  >
                    <SelectValue placeholder={loading ? "A carregar…" : "Escolhe uma categoria"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {list.map((c) => (
                      <SelectItem
                        key={c.id}
                        value={c.id}
                        disabled={usedSlugs.has(c.slug) && c.id !== selectedId}
                        className="text-xs"
                      >
                        <span className="truncate">{c.name}</span>
                        <span className="text-muted-foreground ml-1 font-mono text-[11px]">{c.slug}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  className="h-8 text-xs"
                  placeholder="Texto da tab (opcional)"
                  maxLength={CATEGORY_TABS_RULES.labelMax}
                  value={tab.label ?? ""}
                  aria-label={`Texto da tab ${index + 1}`}
                  // Só espaços = sem texto: a loja usa o nome da categoria.
                  onChange={(e) =>
                    updateTab(index, { label: e.target.value.trim() ? e.target.value : undefined })
                  }
                  onBlur={(e) => updateTab(index, { label: e.target.value.trim() || undefined })}
                />
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={index === 0}
                    onClick={() => moveTab(index, -1)}
                    aria-label="Subir tab"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={index === tabs.length - 1}
                    onClick={() => moveTab(index, 1)}
                    aria-label="Descer tab"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    disabled={tabs.length <= CATEGORY_TABS_RULES.minTabs}
                    onClick={() => setTabs(tabs.filter((_, i) => i !== index))}
                    aria-label="Remover tab"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {missing ? (
                <p className="text-[11px] text-destructive">
                  A categoria «{tab.categorySlug}» não existe nesta loja. Escolhe outra.
                </p>
              ) : null}
            </div>
          )
        })}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          disabled={tabs.length >= CATEGORY_TABS_RULES.maxTabs || !nextFreeCategory}
          onClick={() => {
            if (!nextFreeCategory) return
            setTabs([
              ...tabs,
              { categoryId: nextFreeCategory.id, categorySlug: nextFreeCategory.slug },
            ])
          }}
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Adicionar tab
        </Button>
        <p className="text-[11px] text-muted-foreground">
          Mínimo {CATEGORY_TABS_RULES.minTabs}. Categorias sem produtos ficam escondidas na loja.
        </p>
      </div>
    </div>
  )
}
