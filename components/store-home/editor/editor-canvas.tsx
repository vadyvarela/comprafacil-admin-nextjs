"use client"

import { Loader2, Monitor, RefreshCw, Smartphone, TriangleAlert } from "lucide-react"
import type { PreviewDevice } from "./use-preview-session"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * O preview da loja, como superfície de trabalho.
 *
 * Fundo recuado para a loja flutuar como um dispositivo e ler-se como "a loja",
 * distinta da ferramenta à volta. O `key` no iframe força recarga quando o URL
 * da sessão muda — é assim que o canvas reflecte edições, até haver
 * re-render ao vivo do lado da loja.
 */

const DEVICE_WIDTH: Record<PreviewDevice, string> = {
  desktop: "100%",
  mobile: "390px",
}

type EditorCanvasProps = {
  url: string | null
  busy: boolean
  error: string | null
  device: PreviewDevice
  isEmpty: boolean
  onDeviceChange: (device: PreviewDevice) => void
  onRefresh: () => void
}

export function EditorCanvas({
  url,
  busy,
  error,
  device,
  isEmpty,
  onDeviceChange,
  onRefresh,
}: EditorCanvasProps) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-muted/40">
      <div className="flex items-center justify-between gap-2 border-b border-border/70 bg-background/80 px-3 py-2">
        <div
          role="group"
          aria-label="Largura do preview"
          className="flex items-center gap-0.5 rounded-md border border-border/70 p-0.5"
        >
          <DeviceButton
            active={device === "desktop"}
            label="Ver como computador"
            onClick={() => onDeviceChange("desktop")}
          >
            <Monitor className="size-3.5" />
          </DeviceButton>
          <DeviceButton
            active={device === "mobile"}
            label="Ver como telemóvel"
            onClick={() => onDeviceChange("mobile")}
          >
            <Smartphone className="size-3.5" />
          </DeviceButton>
        </div>

        <div className="flex items-center gap-2">
          {busy ? (
            <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              A actualizar
            </span>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-[13px]"
            onClick={onRefresh}
            disabled={busy}
          >
            <RefreshCw className="size-3.5" />
            Actualizar
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        <CanvasBody
          url={url}
          busy={busy}
          error={error}
          device={device}
          isEmpty={isEmpty}
          onRefresh={onRefresh}
        />
      </div>
    </div>
  )
}

function CanvasBody({
  url,
  busy,
  error,
  device,
  isEmpty,
  onRefresh,
}: Omit<EditorCanvasProps, "onDeviceChange">) {
  if (error) {
    return (
      <CanvasMessage
        icon={<TriangleAlert className="size-5 text-destructive" />}
        title="A loja não respondeu"
        body={error}
        action={
          <Button variant="outline" size="sm" onClick={onRefresh}>
            Tentar novamente
          </Button>
        }
      />
    )
  }

  if (isEmpty) {
    return (
      <CanvasMessage
        title="A home está vazia"
        body="Adiciona uma secção na lista à esquerda para a veres aqui."
      />
    )
  }

  if (!url) {
    return (
      <CanvasMessage
        icon={busy ? <Loader2 className="size-5 animate-spin text-muted-foreground" /> : undefined}
        title={busy ? "A preparar o preview" : "Preview por carregar"}
        body={
          busy
            ? "A loja está a montar a home com o layout actual."
            : "Carrega em Actualizar para veres a home com o layout actual."
        }
        action={
          busy ? undefined : (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              Carregar preview
            </Button>
          )
        }
      />
    )
  }

  return (
    <div
      className="mx-auto h-full overflow-hidden rounded-lg border border-border/70 bg-background shadow-sm transition-[max-width] duration-200 motion-reduce:transition-none"
      style={{ maxWidth: DEVICE_WIDTH[device] }}
    >
      <iframe
        key={url}
        src={url}
        title="Preview da home da loja"
        className="h-full w-full"
      />
    </div>
  )
}

function CanvasMessage({
  icon,
  title,
  body,
  action,
}: {
  icon?: React.ReactNode
  title: string
  body: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex max-w-xs flex-col items-center gap-2 text-center">
        {icon}
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-[13px] leading-relaxed text-muted-foreground">{body}</p>
        {action ? <div className="pt-1">{action}</div> : null}
      </div>
    </div>
  )
}

function DeviceButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex size-7 items-center justify-center rounded transition-colors motion-reduce:transition-none",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  )
}
