import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-ring/35 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-20 w-full rounded-md border bg-background px-3 py-2 text-base leading-relaxed shadow-xs transition-[border-color,background-color,box-shadow] outline-none hover:border-border focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:bg-muted/35 disabled:opacity-70 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
