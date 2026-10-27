"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Check, Copy, KeyRound } from "lucide-react"
import { toast } from "sonner"

import { createStore } from "@/lib/actions/platform"
import type { CreateStoreResult } from "@/lib/graphql/platform/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DataPanel,
  DataPanelContent,
  DataPanelDescription,
  DataPanelHeader,
  DataPanelTitle,
} from "@/components/admin/data-panel"

/** "Loja Feed" → "loja-feed". O mesmo formato que a API aceita. */
function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
}

export function CreateStoreForm() {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()
  const [name, setName] = React.useState("")
  const [slug, setSlug] = React.useState("")
  const [slugEdited, setSlugEdited] = React.useState(false)
  const [commission, setCommission] = React.useState("")
  const [created, setCreated] = React.useState<CreateStoreResult | null>(null)
  const [copied, setCopied] = React.useState(false)

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const percent = commission.trim()
    const commissionRate = percent === "" ? null : Number(percent.replace(",", ".")) / 100
    if (commissionRate !== null && !(commissionRate >= 0 && commissionRate <= 1)) {
      toast.error("A comissão é uma percentagem entre 0 e 100.")
      return
    }
    startTransition(async () => {
      const result = await createStore({ name: name.trim(), slug, commissionRate })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setCreated(result.data)
      setName("")
      setSlug("")
      setSlugEdited(false)
      setCommission("")
      router.refresh()
    })
  }

  async function copyToken() {
    if (!created) return
    try {
      await navigator.clipboard.writeText(created.storefrontToken)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Não foi possível copiar. Selecciona o token e copia à mão.")
    }
  }

  if (created) {
    return (
      <DataPanel>
        <DataPanelHeader>
          <div>
            <DataPanelTitle>Loja &quot;{created.store.name}&quot; criada</DataPanelTitle>
            <DataPanelDescription>
              Já aparece no seletor de loja. Ficaste como dono.
            </DataPanelDescription>
          </div>
        </DataPanelHeader>
        <DataPanelContent className="space-y-3 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="storefront-token" className="flex items-center gap-1.5">
              <KeyRound className="size-3.5" />
              Token da loja pública (KUMPRAFACIL_API_TOKEN)
            </Label>
            <div className="flex gap-2">
              <Input
                id="storefront-token"
                readOnly
                value={created.storefrontToken}
                className="font-mono text-xs"
                onFocus={(event) => event.currentTarget.select()}
              />
              <Button type="button" variant="outline" size="icon" onClick={copyToken} aria-label="Copiar token">
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Copia agora e põe-no no <code>.env</code> do site desta loja. Só aparece esta vez:
              a API guarda apenas o hash. Se o perderes, gera outro em Definições → Segurança, já
              dentro desta loja.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={() => setCreated(null)}>
            Criar outra loja
          </Button>
        </DataPanelContent>
      </DataPanel>
    )
  }

  return (
    <DataPanel>
      <DataPanelHeader>
        <div>
          <DataPanelTitle>Nova loja</DataPanelTitle>
          <DataPanelDescription>
            Catálogo, encomendas e definições próprias, na mesma API. Ficas como dono.
          </DataPanelDescription>
        </div>
      </DataPanelHeader>
      <DataPanelContent className="p-4">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="store-name">Nome</Label>
            <Input
              id="store-name"
              required
              maxLength={120}
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                if (!slugEdited) setSlug(slugify(event.target.value))
              }}
              placeholder="Loja Feed"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="store-slug">Identificador</Label>
            <Input
              id="store-slug"
              required
              minLength={2}
              maxLength={60}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              title="Letras minúsculas, números e hífens"
              value={slug}
              onChange={(event) => {
                setSlugEdited(true)
                setSlug(event.target.value.toLowerCase())
              }}
              placeholder="loja-feed"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="store-commission">Comissão da plataforma (%)</Label>
            <Input
              id="store-commission"
              inputMode="decimal"
              value={commission}
              onChange={(event) => setCommission(event.target.value)}
              placeholder="Vazio = taxa por omissão"
            />
          </div>
          <div className="sm:col-span-3">
            <Button type="submit" disabled={pending}>
              {pending ? "A criar…" : "Criar loja"}
            </Button>
          </div>
        </form>
      </DataPanelContent>
    </DataPanel>
  )
}
