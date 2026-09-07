"use client"

import {
  Button,
  PromoDuoCellFields,
} from "./shared"
import type { BlockFieldsProps, HomeBlock } from "./shared"
import type {
  PromoDuoCell,
} from "./shared"

type Block = Extract<HomeBlock, { type: "promoDuo" }>

export function PromoDuoFields({ block, onChange }: BlockFieldsProps<Block>) {
    const items = block.props.items
    const patchItems = (next: typeof items) => onChange({ ...block, props: { items: next } })
    const defaultCell = (): PromoDuoCell => ({
      title: "Nova oferta",
      ctaLabel: "Ver",
      href: "/produtos",
      gradient: "blue",
    })
    return (
      <div className="grid gap-3">
        <p className="text-[10px] text-muted-foreground leading-snug">
          Entre 2 e 4 cartões. Cada um pode ter imagem (URL ou path <span className="font-mono">/</span>).
        </p>
        <div className="flex flex-col gap-3">
          {items.map((cell, idx) => (
            <div key={idx} className="flex flex-col gap-2">
              <PromoDuoCellFields
                legend={`Cartão ${idx + 1}`}
                cell={cell}
                onChange={(next) => patchItems(items.map((it, i) => (i === idx ? next : it)))}
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px]"
                  disabled={items.length <= 2}
                  onClick={() => patchItems(items.filter((_, i) => i !== idx))}
                >
                  Remover cartão
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          disabled={items.length >= 4}
          onClick={() => patchItems([...items, defaultCell()])}
        >
          Adicionar cartão
        </Button>
      </div>
    )
}
