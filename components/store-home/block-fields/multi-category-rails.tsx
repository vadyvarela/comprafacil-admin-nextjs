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

type Block = Extract<HomeBlock, { type: "multiCategoryRails" }>

export function MultiCategoryRailsFields({ block, onChange }: BlockFieldsProps<Block>) {
    const mode = block.props.slugs?.length ? "slugs" : "max"
    return (
      <div className="grid gap-2">
        <div className="space-y-1">
          <Label className="text-[10px]">Modo</Label>
          <Select
            value={mode}
            onValueChange={(v) => {
              if (v === "max") {
                onChange({
                  ...block,
                  props: { maxSections: block.props.maxSections ?? 3 },
                })
              } else {
                onChange({
                  ...block,
                  props: { slugs: block.props.slugs?.length ? block.props.slugs : ["smartphones"] },
                })
              }
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="max">Primeiras N categorias</SelectItem>
              <SelectItem value="slugs">Lista de slugs</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {mode === "max" ? (
          <div className="space-y-1">
            <Label className="text-[10px]">N.º de categorias</Label>
            <Input
              type="number"
              min={1}
              max={10}
              className="h-8 text-xs"
              value={block.props.maxSections ?? 3}
              onChange={(e) =>
                onChange({
                  ...block,
                  props: { maxSections: Number(e.target.value) || 1 },
                })
              }
            />
          </div>
        ) : (
          <div className="space-y-1">
            <Label className="text-[10px]">Slugs (vírgula)</Label>
            <Input
              className="h-8 text-xs font-mono"
              value={(block.props.slugs ?? []).join(", ")}
              onChange={(e) => {
                const slugs = e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
                onChange({ ...block, props: { slugs: slugs.length ? slugs : ["smartphones"] } })
              }}
            />
          </div>
        )}
      </div>
    )
}
