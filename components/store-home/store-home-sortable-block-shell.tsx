"use client"

import type { ReactNode } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { TooltipRoot, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

interface StoreHomeSortableBlockShellProps {
  id: string
  children: (dragHandle: ReactNode) => ReactNode
}

export function StoreHomeSortableBlockShell({ id, children }: StoreHomeSortableBlockShellProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const dragHandle = (
    <TooltipRoot>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
          aria-label="Arrastar para reordenar"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">Arrastar para reordenar as secções</TooltipContent>
    </TooltipRoot>
  )

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("relative", isDragging && "z-20 opacity-80")}
    >
      {children(dragHandle)}
    </div>
  )
}
