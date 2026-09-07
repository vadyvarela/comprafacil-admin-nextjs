"use client"

import {
  toDatetimeLocalValue,
  CuratedProductPicker,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  WEEKLY_DEAL_GLOW_OPTIONS,
  cn,
  isWeeklyDealHref,
} from "./shared"
import type { BlockFieldsProps, HomeBlock } from "./shared"

type Block = Extract<HomeBlock, { type: "weeklyDeal" }>

export function WeeklyDealFields({ block, onChange }: BlockFieldsProps<Block>) {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-[10px]">Rótulo (ex.: Oferta da semana)</Label>
          <Input
            className="h-8 text-xs"
            value={block.props.title}
            onChange={(e) =>
              onChange({ ...block, props: { ...block.props, title: e.target.value } })
            }
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-[10px]">Headline (grande)</Label>
          <Textarea
            className="min-h-[64px] text-xs resize-y"
            placeholder={"Ex.: Som premium.\nPreço especial."}
            value={block.props.headline ?? ""}
            onChange={(e) =>
              onChange({
                ...block,
                props: { ...block.props, headline: e.target.value || undefined },
              })
            }
          />
          <p className="text-[10px] text-muted-foreground">
            Enter = quebra de linha na loja.
          </p>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-[10px]">Fim do countdown (ISO / datetime-local)</Label>
          <Input
            type="datetime-local"
            className="h-8 text-xs"
            value={toDatetimeLocalValue(block.props.endsAt)}
            onChange={(e) => {
              const v = e.target.value
              if (!v) return
              const iso = new Date(v).toISOString()
              onChange({ ...block, props: { ...block.props, endsAt: iso } })
            }}
          />
          <p className="text-[10px] text-muted-foreground font-mono truncate">
            {block.props.endsAt}
          </p>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-[10px]">Produto</Label>
          <CuratedProductPicker
            value={[block.props.productId]}
            max={1}
            onChange={(ids) => {
              const productId = ids[0]
              if (!productId) return
              onChange({ ...block, props: { ...block.props, productId } })
            }}
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-[10px]">Imagem custom (opcional)</Label>
          <Input
            className="h-8 text-xs font-mono"
            placeholder="https://… ou /media/… — vazio = imagem do produto"
            value={block.props.imageUrl ?? ""}
            onChange={(e) =>
              onChange({
                ...block,
                props: { ...block.props, imageUrl: e.target.value.trim() || undefined },
              })
            }
          />
          <p className="text-[10px] text-muted-foreground leading-snug">
            Se preenchido, substitui a foto do produto no banner.
          </p>
          {block.props.imageUrl?.trim() ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={block.props.imageUrl.trim()}
              alt=""
              className="mt-1 h-16 w-16 rounded-md border border-border object-contain bg-muted/30"
            />
          ) : null}
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-[10px]">Subtítulo do produto (opcional)</Label>
          <Input
            className="h-8 text-xs"
            placeholder="Ex.: Bluetooth"
            value={block.props.productSubtitle ?? ""}
            onChange={(e) =>
              onChange({
                ...block,
                props: { ...block.props, productSubtitle: e.target.value || undefined },
              })
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Texto do botão</Label>
          <Input
            className="h-8 text-xs"
            value={block.props.ctaLabel}
            onChange={(e) =>
              onChange({ ...block, props: { ...block.props, ctaLabel: e.target.value } })
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Badge (opcional)</Label>
          <Input
            className="h-8 text-xs"
            placeholder="-30%"
            value={block.props.badgeLabel ?? ""}
            onChange={(e) =>
              onChange({
                ...block,
                props: { ...block.props, badgeLabel: e.target.value || undefined },
              })
            }
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-[10px]">Glow / gradiente do produto</Label>
          <Select
            value={block.props.glow ?? "blue"}
            onValueChange={(v) =>
              onChange({
                ...block,
                props: {
                  ...block.props,
                  glow: v as NonNullable<typeof block.props.glow>,
                },
              })
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEEKLY_DEAL_GLOW_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground">
            Cor do brilho atrás do produto e do botão/badge.
          </p>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-[10px]">
            Link do botão (opcional — path ou URL completa)
          </Label>
          <Input
            className={cn(
              "h-8 text-xs font-mono",
              block.props.ctaHref?.trim() &&
                !isWeeklyDealHref(block.props.ctaHref)
                ? "border-destructive/60 focus-visible:ring-destructive/30"
                : "",
            )}
            placeholder="/produto/… ou https://…"
            value={block.props.ctaHref ?? ""}
            onChange={(e) => {
              const v = e.target.value.trim()
              onChange({
                ...block,
                props: { ...block.props, ctaHref: v || undefined },
              })
            }}
          />
          <p className="text-[10px] text-muted-foreground leading-snug">
            Vazio = página do produto. Aceita paths internos (/…) ou links externos (https://…).
          </p>
          {block.props.ctaHref?.trim() && !isWeeklyDealHref(block.props.ctaHref) ? (
            <p className="text-[10px] text-destructive leading-snug">
              Link inválido: usa /caminho ou http(s)://…
            </p>
          ) : null}
        </div>
      </div>
    )
}
