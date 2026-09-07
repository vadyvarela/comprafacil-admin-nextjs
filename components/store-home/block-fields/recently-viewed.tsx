"use client"

import {
  Input,
  Label,
} from "./shared"
import type { BlockFieldsProps, HomeBlock } from "./shared"

type Block = Extract<HomeBlock, { type: "recentlyViewed" }>

export function RecentlyViewedFields({ block, onChange }: BlockFieldsProps<Block>) {
    return (
      <div className="space-y-1 max-w-[120px]">
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
              props: { limit: Number(e.target.value) || 1 },
            })
          }
        />
      </div>
    )
}
