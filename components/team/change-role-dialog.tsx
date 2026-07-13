"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
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
import type { TeamMember } from "@/lib/auth0/management"
import { getErrorMessage } from "@/lib/utils/errors"

type ChangeRoleDialogProps = {
  member: TeamMember | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: () => void
}

export function ChangeRoleDialog({
  member,
  open,
  onOpenChange,
  onUpdated,
}: ChangeRoleDialogProps) {
  const [role, setRole] = useState<StoreRole>("manager")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (member?.role) setRole(member.role)
  }, [member])

  async function handleSave() {
    if (!member) return
    try {
      setSubmitting(true)
      const res = await fetch(`/api/team/members/${encodeURIComponent(member.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error("Erro ao atualizar função", {
          description: data?.error ?? `HTTP ${res.status}`,
        })
        return
      }
      toast.success("Função atualizada")
      onOpenChange(false)
      onUpdated()
    } catch (err: unknown) {
      toast.error("Erro ao atualizar função", { description: getErrorMessage(err) })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar função</DialogTitle>
          <DialogDescription>
            {member?.email
              ? `Atualizar permissões de ${member.email}`
              : "Selecione a nova função"}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="change-role">Função</Label>
            <Select value={role} onValueChange={(v) => setRole(v as StoreRole)}>
              <SelectTrigger id="change-role">
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
          <Button onClick={handleSave} disabled={submitting || !member}>
            {submitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                A guardar…
              </>
            ) : (
              "Guardar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
