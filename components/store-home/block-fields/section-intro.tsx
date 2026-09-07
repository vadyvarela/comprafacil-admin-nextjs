"use client"

import {
  HOME_LAYOUT_RULES,
  Input,
  Label,
} from "./shared"
import type { BlockFieldsProps, HomeBlock } from "./shared"

type Block = Extract<HomeBlock, { type: "sectionIntro" }>

export function SectionIntroFields({ block, onChange }: BlockFieldsProps<Block>) {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
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
