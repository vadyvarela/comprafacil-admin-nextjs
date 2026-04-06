"use client"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  const [tokenName, setTokenName] = useState("KUMPRAFACIL_API_TOKEN")

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
    } catch (err: any) {
      toast.error("Erro ao carregar tokens", { description: err.message })
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
      setTokenName("KUMPRAFACIL_API_TOKEN")
      await loadTokens()
    } catch (err: any) {
      toast.error("Erro ao gerar token", { description: err.message })
    } finally {
      setGenerating(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remover o token "${name}"?`)) return
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
    try {
      const action = active ? "deactivate" : "activate"
      const res = await fetch(`/api/security/tokens/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error()
      toast.success(active ? "Token desativado" : "Token ativado")
      await loadTokens()
    } catch {
      toast.error("Erro ao atualizar token")
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

      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Tokens de API</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Gere e revoga tokens de autenticação para o frontend e integrações externas.
            </p>
          </div>
          <Button onClick={() => setGenerateOpen(true)} size="sm">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Gerar token
          </Button>
        </div>

        {/* Lista de tokens */}
        <div className="flex flex-col gap-3">
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))
          ) : tokens.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Shield className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-semibold text-foreground mb-1">Nenhum token criado</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Gera um token para o frontend autenticar na API.
                </p>
                <Button size="sm" onClick={() => setGenerateOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Gerar primeiro token
                </Button>
              </CardContent>
            </Card>
          ) : (
            tokens.map((token) => (
              <Card key={token.id} className="border-border shadow-sm">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Key className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{token.name}</p>
                      <Badge
                        variant={token.active ? "default" : "secondary"}
                        className="text-xs shrink-0"
                      >
                        {token.active ? "Ativo" : "Inativo"}
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
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggle(token.id, token.active)}
                      className="text-xs"
                    >
                      {token.active ? (
                        <><EyeOff className="h-3.5 w-3.5 mr-1" /> Desativar</>
                      ) : (
                        <><Eye className="h-3.5 w-3.5 mr-1" /> Ativar</>
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

        {/* Info card */}
        <Card className="border-border bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Como usar o token</CardTitle>
            <CardDescription className="text-xs">
              Adiciona o header em todas as chamadas ao backend.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs font-mono bg-muted rounded-lg p-3 text-muted-foreground">
            Authorization: Bearer &lt;token&gt;
          </CardContent>
        </Card>
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
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="token-name">Nome do token</Label>
              <Input
                id="token-name"
                placeholder="Ex: KUMPRAFACIL_API_TOKEN"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
              />
            </div>
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
                <span className="font-mono font-semibold">KUMPRAFACIL_API_TOKEN</span> no frontend.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setGeneratedToken(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
