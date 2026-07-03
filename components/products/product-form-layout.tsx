import type { ReactNode } from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export function FormSection({
  icon: Icon,
  title,
  iconTone,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  iconTone: string
  children: ReactNode
}) {
  return (
    <div className="rounded-lg border border-border/80 bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-3.5 py-2 border-b border-border/80 bg-muted/25">
        <div
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-md border border-border/60 shrink-0",
            iconTone
          )}
        >
          <Icon className="h-3 w-3" />
        </div>
        <span className="text-xs font-medium text-foreground">{title}</span>
      </div>
      <div className="p-3.5 space-y-3">{children}</div>
    </div>
  )
}

export function Field({
  label,
  htmlFor,
  required,
  children,
  hint,
}: {
  label: string
  htmlFor?: string
  required?: boolean
  children: ReactNode
  hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-medium">
        {label}
        {required ? <span className="text-destructive ml-0.5">*</span> : null}
      </Label>
      {children}
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
