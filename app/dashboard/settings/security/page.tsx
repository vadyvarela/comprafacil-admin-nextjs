"use client"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { SettingsSubnav } from "@/components/layout/settings-subnav"
import { PageHeader } from "@/components/admin/page-header"
import { DataPanel, DataPanelHeader } from "@/components/admin/data-panel"
import { EmptyState } from "@/components/admin/empty-state"
import { FormField } from "@/components/admin/form-field"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Plus,
  Shield,
  Trash2,
  TriangleAlert,
} from "lucide-react"
import { toast } from "sonner"
import { getErrorMessage } from "@/lib/utils/errors"

interface ApiToken {
  id: string
  name: string
  token: string
  active: boolean
  createdAt: string
  expiresAt?: string
}

export default function SecurityPage() {
  const [tokens, setTokens] = useState<ApiToken[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  // Modal de token gerado
  const [generatedToken, setGeneratedToken] = useState<ApiToken | null>(null)
  const [copied, setCopied] = useState(false)

  // Modal de geração
  const [generateOpen, setGenerateOpen] = useState(false)
  const [tokenName, setTokenName] = useState("STORE_API_TOKEN")
  const { confirm, confirmDialog } = useConfirmDialog()

  async function loadTokens() {
    try {
      setLoading(true)
      const res = await fetch("/api/security/tokens")
      const data = await res.json()
      if (!res.ok) {
        toast.error("Erro ao carregar tokens", { description: data?.error ?? `HTTP ${res.status}` })
        return
      }
      setTokens(Array.isArray(data) ? data : [])
    } catch (err: unknown) {
      toast.error("Erro ao carregar tokens", { description: getErrorMessage(err) })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTokens()
  }, [])

  async function handleGenerate() {
    try {
      setGenerating(true)
      const res = await fetch("/api/security/tokens/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tokenName }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error("Erro ao gerar token", { description: data?.error ?? `HTTP ${res.status}` })
        return
      }
      setGeneratedToken(data)
      setGenerateOpen(false)
      setTokenName("STORE_API_TOKEN")
      await loadTokens()
    } catch (err: unknown) {
      toast.error("Erro ao gerar token", { description: getErrorMessage(err) })
    } finally {
      setGenerating(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    const confirmed = await confirm({
      title: "Remover token?",
      description: `Está prestes a remover o token "${name}".`,
      impact: "Integrações que usam este token deixam de autenticar na API. Esta ação não pode ser desfeita.",
      confirmText: "Remover token",
      variant: "critical",
      requireText: "REMOVER",
    })

    if (!confirmed) return

    try {
      const res = await fetch(`/api/security/tokens/${id}`, { method: "DELETE" })
      if (!res.ok && res.status !== 204) throw new Error()
      toast.success("Token removido")
      await loadTokens()
    } catch {
      toast.error("Erro ao remover token")
    }
  }

  async function handleToggle(id: string, active: boolean) {
    if (active) {
      const confirmed = await confirm({
        title: "Desactivar token?",
        description: "Está prestes a desactivar este token de API.",
        impact: "Integrações que usam este token deixam de autenticar enquanto ele estiver inactivo.",
        confirmText: "Desactivar token",
        variant: "destructive",
      })

      if (!confirmed) return
    }

    try {
      const action = active ? "deactivate" : "activate"
      const res = await fetch(`/api/security/tokens/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error()
      toast.success(active ? "Token desactivado" : "Token activado")
      await loadTokens()
    } catch {
      toast.error("Erro ao actualizar token")
    }
  }

  async function handleCopy(token: string) {
    await navigator.clipboard.writeText(token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <DashboardHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Definições", href: "/dashboard/settings" },
          { label: "Segurança" },
        ]}
      />
      <SettingsSubnav />

      <div className="flex flex-1 flex-col gap-5 p-4 md:p-5 bg-background">
        <PageHeader
          title="Tokens de API"
          description="Crie e revogue tokens de autenticação para o frontend e integrações externas."
        >
          <Button onClick={() => setGenerateOpen(true)} size="sm">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Gerar token
          </Button>
        </PageHeader>

        {/* Lista de tokens */}
        <div className="flex flex-col gap-3">
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))
          ) : tokens.length === 0 ? (
            <DataPanel className="border-dashed">
              <EmptyState
                icon={Shield}
                title="Nenhum token criado"
                description="Gera um token para o frontend autenticar na API."
                tone="info"
                action={
                <Button size="sm" onClick={() => setGenerateOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Gerar primeiro token
                </Button>
                }
              />
            </DataPanel>
          ) : (
            tokens.map((token) => (
              <Card key={token.id} className="border-border/80">
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border/60 bg-primary/10">
                    <Key className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{token.name}</p>
                      <Badge
                        variant={token.active ? "default" : "secondary"}
                        className="text-xs shrink-0"
                      >
                        {token.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                      {token.token}
                    </p>
                    {token.createdAt && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Criado em {new Date(token.createdAt).toLocaleDateString("pt-CV")}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2 sm:ml-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggle(token.id, token.active)}
                      className="text-xs"
                    >
                      {token.active ? (
                        <><EyeOff className="h-3.5 w-3.5 mr-1" /> Desactivar</>
                      ) : (
                        <><Eye className="h-3.5 w-3.5 mr-1" /> Activar</>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(token.id, token.name)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <DataPanel>
          <DataPanelHeader>
            <div>
            <h3 className="text-sm font-medium text-foreground">Como usar o token</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Adiciona o header em todas as chamadas ao backend.
            </p>
            </div>
          </DataPanelHeader>
          <div className="p-4">
            <code className="block overflow-x-auto rounded-md bg-muted/50 px-3 py-2.5 font-mono text-xs text-foreground">
              Authorization: Bearer &lt;token&gt;
            </code>
          </div>
        </DataPanel>
      </div>

      {/* Modal — Gerar token */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar novo token</DialogTitle>
            <DialogDescription>
              O token será gerado automaticamente pelo sistema. Guarda-o após a criação — não será mostrado novamente.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <FormField label="Nome do token" htmlFor="token-name">
              <Input
                id="token-name"
                placeholder="Ex: STORE_API_TOKEN"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
              />
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGenerate} disabled={generating || !tokenName.trim()}>
              {generating ? (
                <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> A gerar…</>
              ) : (
                <><Key className="h-3.5 w-3.5 mr-1.5" /> Gerar token</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal — Token gerado (mostrar valor completo) */}
      <Dialog open={!!generatedToken} onOpenChange={() => setGeneratedToken(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-500" />
              Token gerado com sucesso
            </DialogTitle>
            <DialogDescription>
              Copia o token agora — por segurança, não será exibido novamente.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted border border-border">
              <p className="flex-1 text-xs font-mono break-all text-foreground">
                {generatedToken?.token}
              </p>
              <Button
                size="icon"
                variant="ghost"
                className="shrink-0"
                onClick={() => handleCopy(generatedToken!.token)}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
              <TriangleAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Adiciona este valor como <span className="font-mono font-semibold">CMS_ACCESS_TOKEN</span> nas
                variáveis de ambiente do backoffice e como{" "}
                <span className="font-mono font-semibold">STORE_API_TOKEN</span> no frontend da loja.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setGeneratedToken(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {confirmDialog}
    </>
  )
}
