"use client"

import {
  ShopByCategoryHomeFields,
} from "./shared"
import type { BlockFieldsProps, HomeBlock } from "./shared"

type Block = Extract<HomeBlock, { type: "shopByCategory" }>

export function ShopByCategoryFields({ block, onChange }: BlockFieldsProps<Block>) {
    return <ShopByCategoryHomeFields block={block} onChange={onChange} />
}
