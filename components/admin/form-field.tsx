import type { ReactNode } from "react"

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type FormFieldProps = {
  label?: string
  htmlFor?: string
  description?: ReactNode
  error?: ReactNode
  children: ReactNode
  className?: string
}

export function FormField({
  label,
  htmlFor,
  description,
  error,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? <Label htmlFor={htmlFor}>{label}</Label> : null}
      {children}
      {description && !error ? (
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
      {error ? (
        <p className="text-xs leading-relaxed font-medium text-destructive">{error}</p>
      ) : null}
    </div>
  )
}
