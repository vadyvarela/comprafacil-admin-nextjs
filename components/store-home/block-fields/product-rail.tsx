"use client"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  CuratedProductPicker,
  HOME_LAYOUT_RULES,
  Input,
  InternalPathField,
  Label,
  PRODUCT_RAIL_VARIANT_HELP,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  parseProductIdsFromText,
} from "./shared"
import type { BlockFieldsProps, HomeBlock } from "./shared"

type Block = Extract<HomeBlock, { type: "productRail" }>

export function ProductRailFields({ block, onChange }: BlockFieldsProps<Block>) {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-[10px]">Variante</Label>
          <Select
            value={block.props.variant}
            onValueChange={(v) => {
              const variant = v as (typeof block.props)["variant"]
              onChange({
                ...block,
                props: {
                  ...block.props,
                  variant,
                  ...(variant === "curated"
                    ? { productIds: block.props.productIds?.length ? block.props.productIds : [] }
                    : { productIds: undefined }),
                },
              })
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Novidades</SelectItem>
              <SelectItem value="featured">Destaques (metadata)</SelectItem>
              <SelectItem value="curated">Seleção manual</SelectItem>
              <SelectItem value="bestsellers">Mais vendidos</SelectItem>
              <SelectItem value="on_sale">Em promoção</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Limite</Label>
          <Input
            type="number"
            min={1}
            max={24}
            className="h-8 text-xs"
            value={block.props.limit}
            onChange={(e) =>
              onChange({
                ...block,
                props: { ...block.props, limit: Number(e.target.value) || 1 },
              })
            }
          />
          <p className="text-[10px] text-muted-foreground tabular-nums">
            {block.props.limit} / {HOME_LAYOUT_RULES.railLimitMax} produtos mostrados neste rail
          </p>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-[10px]">Formato dos cartões</Label>
          <Select
            value={block.props.railCardStyle ?? "tile"}
            onValueChange={(v) =>
              onChange({
                ...block,
                props: { ...block.props, railCardStyle: v as "tile" | "row" },
              })
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tile">Vertical (scroll no telemóvel)</SelectItem>
              <SelectItem value="row">Horizontal em grelha</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground leading-snug">
            «row» = imagem à esquerda, stock, preço e botão «Ver produto»; grelha 1–3 colunas.
          </p>
        </div>
        <p className="text-[10px] text-muted-foreground leading-snug sm:col-span-2">
          {PRODUCT_RAIL_VARIANT_HELP[block.props.variant] ?? ""}
        </p>
        {block.props.variant === "curated" ? (
          <>
            <p className="text-[10px] text-muted-foreground tabular-nums sm:col-span-2">
              Seleccionados: {(block.props.productIds ?? []).length} / {HOME_LAYOUT_RULES.railLimitMax} (ordem =
              ordem na loja)
            </p>
            <CuratedProductPicker
              value={block.props.productIds ?? []}
              max={HOME_LAYOUT_RULES.railLimitMax}
              onChange={(productIds) => onChange({ ...block, props: { ...block.props, productIds } })}
            />
            <Collapsible className="sm:col-span-2">
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-dashed border-border/70 px-2 py-1.5 text-left text-[10px] text-muted-foreground hover:bg-muted/30">
                <span>Lista em texto (UUID) — avançado</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-1.5">
                <Label className="text-[10px] text-muted-foreground">
                  Um por linha ou separados por vírgula · máx. {HOME_LAYOUT_RULES.railLimitMax}
                </Label>
                <Textarea
                  className="mt-1 min-h-[72px] font-mono text-[11px] leading-relaxed"
                  placeholder="Opcional: cola UUID se preferires editar em massa."
                  value={(block.props.productIds ?? []).join("\n")}
                  onChange={(e) => {
                    const productIds = parseProductIdsFromText(
                      e.target.value,
                      HOME_LAYOUT_RULES.railLimitMax
                    )
                    onChange({ ...block, props: { ...block.props, productIds } })
                  }}
                />
              </CollapsibleContent>
            </Collapsible>
          </>
        ) : null}
        <div className="space-y-1 sm:col-span-2">
          <Label className="flex items-center justify-between gap-2 text-[10px]">
            <span>Título</span>
            <span className="font-normal text-muted-foreground tabular-nums">
              {block.props.title.length}/{HOME_LAYOUT_RULES.titleMax}
            </span>
          </Label>
          <Input
            className="h-8 text-xs"
            value={block.props.title}
            onChange={(e) =>
              onChange({ ...block, props: { ...block.props, title: e.target.value } })
            }
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="flex items-center justify-between gap-2 text-[10px]">
            <span>Subtítulo (opcional)</span>
            <span className="font-normal text-muted-foreground tabular-nums">
              {(block.props.subtitle ?? "").length}/{HOME_LAYOUT_RULES.subtitleMax}
            </span>
          </Label>
          <Input
            className="h-8 text-xs"
            value={block.props.subtitle ?? ""}
            onChange={(e) =>
              onChange({
                ...block,
                props: { ...block.props, subtitle: e.target.value || undefined },
              })
            }
          />
        </div>
        <InternalPathField
          className="sm:col-span-2"
          label="Ver todos — path (opcional)"
          value={block.props.seeAllHref}
          allowEmpty
          placeholder="/produtos?sort=newest"
          onChange={(seeAllHref) => onChange({ ...block, props: { ...block.props, seeAllHref } })}
        />
      </div>
    )
}
