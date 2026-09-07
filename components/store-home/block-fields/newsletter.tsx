"use client"

import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./shared"
import type { BlockFieldsProps, HomeBlock } from "./shared"

type Block = Extract<HomeBlock, { type: "newsletter" }>

export function NewsletterFields({ block, onChange }: BlockFieldsProps<Block>) {
    return (
      <div className="grid gap-2">
        <div className="space-y-1">
          <Label className="text-[10px]">Variante</Label>
          <Select
            value={block.props.variant ?? "banner"}
            onValueChange={(v) =>
              onChange({
                ...block,
                props: { ...block.props, variant: v as "banner" | "strip" | "card" },
              })
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="banner">Banner (destaque escuro)</SelectItem>
              <SelectItem value="strip">Faixa compacta</SelectItem>
              <SelectItem value="card">Cartão centrado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Título (opcional)</Label>
          <Input
            className="h-8 text-xs"
            value={block.props.title ?? ""}
            onChange={(e) =>
              onChange({
                ...block,
                props: { ...block.props, title: e.target.value || undefined },
              })
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Subtítulo (opcional)</Label>
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
      </div>
    )
}
