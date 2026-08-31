"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
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
  ROLE_RANK,
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
  const { confirm, confirmDialog } = useConfirmDialog()

  useEffect(() => {
    if (member?.role) setRole(member.role)
  }, [member])

  async function handleSave() {
    if (!member) return
    const currentRole = member.role ?? "viewer"
    if (ROLE_RANK[role] > ROLE_RANK[currentRole]) {
      const confirmed = await confirm({
        title: "Aumentar permissões?",
        description: `Está prestes a alterar ${member.email} de ${ROLE_LABELS[currentRole]} para ${ROLE_LABELS[role]}.`,
        impact: "Este membro passará a ter acesso a mais áreas e ações no backoffice.",
        confirmText: "Alterar função",
        variant: role === "owner" || role === "admin" ? "critical" : "destructive",
        requireText: role === "owner" || role === "admin" ? "ACESSO" : undefined,
      })

      if (!confirmed) return
    }

    try {
      setSubmitting(true)
      const res = await fetch(`/api/team/members/${encodeURIComponent(member.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error("Erro ao actualizar função", {
          description: data?.error ?? `HTTP ${res.status}`,
        })
        return
      }
      toast.success("Função actualizada")
      onOpenChange(false)
      onUpdated()
    } catch (err: unknown) {
      toast.error("Erro ao actualizar função", { description: getErrorMessage(err) })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar função</DialogTitle>
          <DialogDescription>
            {member?.email
              ? `Actualizar permissões de ${member.email}`
              : "Selecione a nova função"}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          <FormField label="Função" htmlFor="change-role" description={ROLE_DESCRIPTIONS[role]}>
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
          </FormField>
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
      {confirmDialog}
    </>
  )
}
