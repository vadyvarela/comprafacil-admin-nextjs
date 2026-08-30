import * as React from "react"

import { cn } from "@/lib/utils"

function DataPanel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border/80 bg-card shadow-xs",
        className
      )}
      {...props}
    />
  )
}

function DataPanelHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-muted/35 px-4 py-3",
        className
      )}
      {...props}
    />
  )
}

function DataPanelTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn("text-sm font-semibold text-foreground", className)}
      {...props}
    />
  )
}

function DataPanelDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-xs leading-relaxed text-muted-foreground", className)}
      {...props}
    />
  )
}

function DataPanelContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("min-w-0", className)} {...props} />
}

export {
  DataPanel,
  DataPanelHeader,
  DataPanelTitle,
  DataPanelDescription,
  DataPanelContent,
}
