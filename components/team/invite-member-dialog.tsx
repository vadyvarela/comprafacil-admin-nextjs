"use client"

import { useState } from "react"
import { Check, Copy, Loader2, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
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
import { FormField } from "@/components/admin/form-field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  STORE_ROLES,
  type StoreRole,
} from "@/lib/auth/roles"
import { getErrorMessage } from "@/lib/utils/errors"

type InviteMemberDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInvited: () => void
}

type InviteSuccess = {
  email: string
  inviteUrl: string
  emailSent: boolean
}

export function InviteMemberDialog({
  open,
  onOpenChange,
  onInvited,
}: InviteMemberDialogProps) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<StoreRole>("operator")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<InviteSuccess | null>(null)
  const [copied, setCopied] = useState(false)
  const { confirm, confirmDialog } = useConfirmDialog()

  function resetForm() {
    setEmail("")
    setRole("operator")
    setSuccess(null)
    setCopied(false)
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm()
    onOpenChange(next)
  }

  async function handleInvite() {
    if (role === "owner" || role === "admin") {
      const confirmed = await confirm({
        title: "Convidar com acesso total?",
        description: `${email} será convidado como ${ROLE_LABELS[role]}.`,
        impact: "Este perfil pode gerir equipa, segurança e tokens de API.",
        confirmText: "Enviar convite",
        variant: "critical",
        requireText: "ACESSO",
      })

      if (!confirmed) return
    }

    try {
      setSubmitting(true)
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error("Erro ao convidar", { description: data?.error ?? `HTTP ${res.status}` })
        return
      }

      const inviteUrl = data?.inviteUrl as string | undefined
      const emailSent = Boolean(data?.emailSent)

      if (!inviteUrl) {
        toast.error("Convite criado, mas sem link de acesso")
        onInvited()
        return
      }

      setSuccess({ email, inviteUrl, emailSent })
      onInvited()

      if (emailSent) {
        toast.success("Convite criado", {
          description: `Email enviado para ${email}. Podes também copiar o link.`,
        })
      } else {
        toast.success("Convite criado", {
          description: "Copia o link e envia ao membro (o email Auth0 pode não ter sido enviado).",
        })
      }
    } catch (err: unknown) {
      toast.error("Erro ao convidar", { description: getErrorMessage(err) })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCopy() {
    if (!success?.inviteUrl) return
    await navigator.clipboard.writeText(success.inviteUrl)
    setCopied(true)
    toast.success("Link copiado")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
        {success ? (
          <>
            <DialogHeader>
              <DialogTitle>Convite criado</DialogTitle>
              <DialogDescription>
                {success.emailSent
                  ? `Enviámos um email para ${success.email}. Se não chegar, partilha o link abaixo.`
                  : `O email pode não ter sido enviado. Partilha este link com ${success.email} para definir a password.`}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 py-2">
              <p className="text-xs font-semibold text-foreground">Link de convite</p>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2">
                <p className="flex-1 text-xs font-mono break-all text-foreground">
                  {success.inviteUrl}
                </p>
                <Button
                  size="icon"
                  variant="ghost"
                  className="shrink-0"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                O link é válido por 7 dias. Verifica também a pasta de spam.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>Fechar</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Convidar membro</DialogTitle>
              <DialogDescription>
                O utilizador receberá um email (ou link) para definir a password e aceder ao backoffice.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-2">
              <FormField label="Email" htmlFor="invite-email">
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="nome@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </FormField>
              <FormField label="Função" htmlFor="invite-role" description={ROLE_DESCRIPTIONS[role]}>
                <Select value={role} onValueChange={(v) => setRole(v as StoreRole)}>
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STORE_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleInvite} disabled={submitting || !email.trim()}>
                {submitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    A enviar…
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                    Enviar convite
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
        </DialogContent>
      </Dialog>
      {confirmDialog}
    </>
  )
}
