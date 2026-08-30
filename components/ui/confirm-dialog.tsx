"use client"

import * as React from "react"
import { AlertTriangle, Info, ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type ConfirmVariant = "default" | "destructive" | "critical"

type ConfirmOptions = {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmVariant
  impact?: string
  requireText?: string
}

type ConfirmState = Required<Pick<ConfirmOptions, "confirmText" | "cancelText" | "variant">> &
  Omit<ConfirmOptions, "confirmText" | "cancelText" | "variant">

const variantCopy: Record<ConfirmVariant, { icon: React.ElementType; iconClass: string; button: "default" | "destructive" }> = {
  default: {
    icon: Info,
    iconClass: "border-primary/20 bg-primary/8 text-primary",
    button: "default",
  },
  destructive: {
    icon: AlertTriangle,
    iconClass: "border-destructive/20 bg-destructive/8 text-destructive",
    button: "destructive",
  },
  critical: {
    icon: ShieldAlert,
    iconClass: "border-destructive/20 bg-destructive/8 text-destructive",
    button: "destructive",
  },
}

export function useConfirmDialog() {
  const [state, setState] = React.useState<ConfirmState | null>(null)
  const [typedValue, setTypedValue] = React.useState("")
  const resolverRef = React.useRef<((confirmed: boolean) => void) | null>(null)

  const close = React.useCallback((confirmed: boolean) => {
    resolverRef.current?.(confirmed)
    resolverRef.current = null
    setState(null)
    setTypedValue("")
  }, [])

  const confirm = React.useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
      setTypedValue("")
      setState({
        ...options,
        confirmText: options.confirmText ?? "Confirmar",
        cancelText: options.cancelText ?? "Cancelar",
        variant: options.variant ?? "default",
      })
    })
  }, [])

  const dialog = state ? (
    <Dialog open onOpenChange={(open) => !open && close(false)}>
      <DialogContent className="max-w-md p-0" showCloseButton={false}>
        <div className="flex gap-3 p-5 pb-3">
          <div
            className={cn(
              "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border",
              variantCopy[state.variant].iconClass
            )}
          >
            {React.createElement(variantCopy[state.variant].icon, { className: "h-4 w-4" })}
          </div>
          <DialogHeader className="min-w-0 gap-1.5">
            <DialogTitle className="text-base leading-5">{state.title}</DialogTitle>
            <DialogDescription className="text-[13px] leading-5">
              {state.description}
            </DialogDescription>
          </DialogHeader>
        </div>

        {state.impact ? (
          <div className="mx-5 rounded-md border border-border/70 bg-muted/35 px-3 py-2.5 text-[12px] leading-5 text-muted-foreground">
            {state.impact}
          </div>
        ) : null}

        {state.requireText ? (
          <div className="mx-5 space-y-2">
            <p className="text-[12px] text-muted-foreground">
              Digite <span className="font-semibold text-foreground">{state.requireText}</span> para confirmar.
            </p>
            <Input
              value={typedValue}
              onChange={(event) => setTypedValue(event.target.value)}
              className="h-8 text-xs"
              autoFocus
            />
          </div>
        ) : null}

        <DialogFooter className="border-t border-border/70 bg-muted/20 px-5 py-3">
          <Button type="button" variant="outline" size="sm" onClick={() => close(false)}>
            {state.cancelText}
          </Button>
          <Button
            type="button"
            variant={variantCopy[state.variant].button}
            size="sm"
            disabled={Boolean(state.requireText && typedValue.trim() !== state.requireText)}
            onClick={() => close(true)}
          >
            {state.confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ) : null

  return { confirm, confirmDialog: dialog }
}
