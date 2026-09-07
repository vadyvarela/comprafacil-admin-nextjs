"use client"

import {
  CategoryRailHomeFields,
} from "./shared"
import type { BlockFieldsProps, HomeBlock } from "./shared"

type Block = Extract<HomeBlock, { type: "categoryRail" }>

export function CategoryRailFields({ block, onChange }: BlockFieldsProps<Block>) {
    return <CategoryRailHomeFields block={block} onChange={onChange} />
}
