"use client"

import { useState } from "react"
import { Loader2, UserPlus } from "lucide-react"
import { toast } from "sonner"
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
import { Label } from "@/components/ui/label"
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

export function InviteMemberDialog({
  open,
  onOpenChange,
  onInvited,
}: InviteMemberDialogProps) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<StoreRole>("manager")
  const [submitting, setSubmitting] = useState(false)

  async function handleInvite() {
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
      toast.success("Convite enviado", {
        description: `Email enviado para ${email}`,
      })
      setEmail("")
      setRole("manager")
      onOpenChange(false)
      onInvited()
    } catch (err: unknown) {
      toast.error("Erro ao convidar", { description: getErrorMessage(err) })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar membro</DialogTitle>
          <DialogDescription>
            O utilizador receberá um email para definir a password e aceder ao backoffice.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="nome@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-role">Função</Label>
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
            <p className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
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
      </DialogContent>
    </Dialog>
  )
}
