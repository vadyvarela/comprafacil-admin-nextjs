"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { HomeLayoutDocument } from "@/lib/home-layout/schema"
import { buildHomePreviewUrl } from "@/app/dashboard/settings/page-builder/preview-actions"
import { showToast } from "@/lib/utils/toast"

/**
 * Sessão de preview da loja e a ponte de mensagens com o iframe.
 *
 * O preview é a superfície de trabalho, não um extra: é ele que diz ao editor
 * que secção o utilizador clicou. A loja publica `{ type: "kf:block-click" }`
 * quando a página corre em modo preview; aqui traduzimos isso em selecção.
 *
 * Limite conhecido: actualizar o preview recria a sessão e recarrega o iframe.
 * Re-render ao vivo obrigaria a tornar cliente o renderer da loja, que hoje é
 * um server component que vai buscar dados.
 */

export type PreviewDevice = "desktop" | "mobile"

/** Debounce alto: cada refresh é um POST à loja + reload do iframe. */
const REFRESH_DEBOUNCE_MS = 1200

const BLOCK_CLICK_MESSAGE = "kf:block-click"

type BlockClickMessage = {
  type: typeof BLOCK_CLICK_MESSAGE
  blockId: string
}

function isBlockClickMessage(value: unknown): value is BlockClickMessage {
  if (!value || typeof value !== "object") return false
  const msg = value as Record<string, unknown>
  return msg.type === BLOCK_CLICK_MESSAGE && typeof msg.blockId === "string"
}

export function usePreviewSession(options: {
  /** Chamado quando o utilizador clica numa secção dentro do preview. */
  onSelectBlock: (blockId: string) => void
}) {
  const { onSelectBlock } = options

  const [url, setUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [device, setDevice] = useState<PreviewDevice>("desktop")
  const [error, setError] = useState<string | null>(null)

  const inFlightRef = useRef(false)
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onSelectRef = useRef(onSelectBlock)
  onSelectRef.current = onSelectBlock

  const open = useCallback(async (payload: HomeLayoutDocument) => {
    if (inFlightRef.current) return false
    inFlightRef.current = true
    setBusy(true)
    try {
      const res = await buildHomePreviewUrl(payload)
      if (!res.ok) {
        setError(res.message)
        return false
      }
      setError(null)
      setUrl(res.url)
      return true
    } finally {
      inFlightRef.current = false
      setBusy(false)
    }
  }, [])

  /** Reabre a sessão com o layout actual, agrupando alterações seguidas. */
  const scheduleRefresh = useCallback(
    (payload: HomeLayoutDocument) => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = setTimeout(() => {
        refreshTimerRef.current = null
        void open(payload)
      }, REFRESH_DEBOUNCE_MS)
    },
    [open],
  )

  const refreshNow = useCallback(
    async (payload: HomeLayoutDocument) => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
      const ok = await open(payload)
      if (ok) showToast.success("Preview", "Actualizado com o layout actual.")
      return ok
    },
    [open],
  )

  useEffect(
    () => () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    },
    [],
  )

  // Ponte preview → editor. A origem é validada contra o URL da sessão.
  useEffect(() => {
    if (!url) return
    let expectedOrigin: string
    try {
      expectedOrigin = new URL(url).origin
    } catch {
      return
    }

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== expectedOrigin) return
      if (!isBlockClickMessage(event.data)) return
      onSelectRef.current(event.data.blockId)
    }

    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [url])

  return { url, busy, error, device, setDevice, open, scheduleRefresh, refreshNow }
}
