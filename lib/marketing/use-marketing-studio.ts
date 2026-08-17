"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { showToast } from "@/lib/utils/toast"
import type { MarketingDesk, MarketingProposal } from "@/lib/graphql/marketing/types"
import {
  buildStudioPack,
  chatFromMessages,
  imageFormatForIntent,
  threadStorageKey,
  type MarketingIntent,
  type StudioChatLine,
  type StudioPack,
} from "@/lib/marketing/studio-pack"

type AgentResponse = {
  error?: string
  reply?: string
  threadId?: string
  messages?: StudioChatLine[]
  proposals?: MarketingProposal[]
  pack?: StudioPack
  desk?: MarketingDesk
}

const emptyPack: StudioPack = { proposal: null, imagePrompt: "", imageUrl: null }

export function useMarketingStudio(intent: MarketingIntent, initialDesk: MarketingDesk) {
  const storageKey = threadStorageKey(intent)
  const [threadId, setThreadId] = useState<string | null>(null)
  const [chat, setChat] = useState<StudioChatLine[]>([])
  const [draft, setDraft] = useState("")
  const [pack, setPack] = useState<StudioPack>(emptyPack)
  const [desk, setDesk] = useState<MarketingDesk>(initialDesk)
  const [busyAgent, setBusyAgent] = useState(false)
  const [busyImage, setBusyImage] = useState(false)
  const [hydrating, setHydrating] = useState(true)
  const endRef = useRef<HTMLDivElement>(null)

  const persistThread = useCallback(
    (id: string | null) => {
      setThreadId(id)
      if (typeof window === "undefined") return
      if (id) window.sessionStorage.setItem(storageKey, id)
      else window.sessionStorage.removeItem(storageKey)
    },
    [storageKey],
  )

  useEffect(() => {
    let cancelled = false
    const stored = typeof window !== "undefined" ? window.sessionStorage.getItem(storageKey) : null
    if (!stored) {
      setHydrating(false)
      return
    }
    void (async () => {
      try {
        const res = await fetch(`/api/marketing/threads/${stored}?intent=${intent}`)
        const json = (await res.json()) as AgentResponse
        if (cancelled) return
        if (!res.ok) {
          window.sessionStorage.removeItem(storageKey)
          return
        }
        persistThread(stored)
        setChat(json.messages ?? [])
        setPack(json.pack ?? buildStudioPack(json.proposals ?? [], intent))
      } catch {
        if (!cancelled) window.sessionStorage.removeItem(storageKey)
      } finally {
        if (!cancelled) setHydrating(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [intent, persistThread, storageKey])

  useEffect(() => {
    queueMicrotask(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }))
  }, [chat, busyAgent])

  const resetConversation = useCallback(() => {
    persistThread(null)
    setChat([])
    setPack(emptyPack)
    setDraft("")
  }, [persistThread])

  async function sendAgent(text: string) {
    const message = text.trim()
    if (!message || busyAgent) return
    setDraft("")
    setChat((prev) => [...prev, { role: "user", content: message }])
    setBusyAgent(true)
    try {
      const res = await fetch("/api/marketing/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, threadId, intent }),
      })
      const json = (await res.json()) as AgentResponse
      if (!res.ok) throw new Error(json.error || "Falha no agente")
      if (json.threadId) persistThread(json.threadId)
      const nextChat = json.messages?.length
        ? chatFromMessages(json.messages)
        : [...chat, { role: "user" as const, content: message }, { role: "assistant" as const, content: json.reply || "" }]
      setChat(nextChat)
      if (json.pack) setPack(json.pack)
      else if (json.proposals) setPack(buildStudioPack(json.proposals, intent))
      if (json.desk) setDesk(json.desk)
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : "Falha no agente")
    } finally {
      setBusyAgent(false)
    }
  }

  async function generateImage() {
    if (!pack.imagePrompt.trim() || busyImage || !pack.proposal) return
    setBusyImage(true)
    try {
      const res = await fetch("/api/marketing/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: pack.imagePrompt,
          format: imageFormatForIntent(intent),
          proposalId: pack.proposal.id,
        }),
      })
      const json = (await res.json()) as { error?: string; url?: string }
      if (!res.ok) throw new Error(json.error || "Falha a gerar")
      if (json.url) {
        setPack((prev) => ({ ...prev, imageUrl: json.url as string }))
        showToast.success("Imagem pronta")
      }
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : "Falha a gerar imagem")
    } finally {
      setBusyImage(false)
    }
  }

  function markApplied() {
    setPack(emptyPack)
  }

  return {
    threadId,
    chat,
    draft,
    setDraft,
    pack,
    desk,
    busyAgent,
    busyImage,
    hydrating,
    endRef,
    sendAgent,
    generateImage,
    resetConversation,
    markApplied,
  }
}
