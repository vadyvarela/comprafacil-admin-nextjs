"use client"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { SettingsSubnav } from "@/components/layout/settings-subnav"
import { PageHeader } from "@/components/admin/page-header"
import { ChangeRoleDialog } from "@/components/team/change-role-dialog"
import { InviteMemberDialog } from "@/components/team/invite-member-dialog"
import { TeamMemberList } from "@/components/team/team-member-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useConfirmDialog } from "@/components/ui/confirm-dialog"
import type { TeamMember } from "@/lib/auth0/management"
import { ROLE_DESCRIPTIONS, ROLE_LABELS, STORE_ROLES } from "@/lib/auth/roles"
import { getErrorMessage } from "@/lib/utils/errors"
import { Plus, UserCog } from "lucide-react"
import { toast } from "sonner"

type TeamSettingsClientProps = {
  currentUserId: string | null
}

export function TeamSettingsClient({ currentUserId }: TeamSettingsClientProps) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [changeMember, setChangeMember] = useState<TeamMember | null>(null)
  const { confirm, confirmDialog } = useConfirmDialog()

  async function loadMembers() {
    try {
      setLoading(true)
      const res = await fetch("/api/team/members")
      const data = await res.json()
      if (!res.ok) {
        toast.error("Erro ao carregar equipa", {
          description: data?.error ?? `HTTP ${res.status}`,
        })
        return
      }
      setMembers(Array.isArray(data) ? data : [])
    } catch (err: unknown) {
      toast.error("Erro ao carregar equipa", { description: getErrorMessage(err) })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMembers()
  }, [])

  async function handleRemove(member: TeamMember) {
    const confirmed = await confirm({
      title: "Remover acesso?",
      description: `Está prestes a remover o acesso de ${member.email}.`,
      impact: "Este membro deixa de conseguir entrar no backoffice. A ação pode ser revertida com um novo convite.",
      confirmText: "Remover acesso",
      variant: "destructive",
    })

    if (!confirmed) return

    try {
      const res = await fetch(`/api/team/members/${encodeURIComponent(member.id)}`, {
        method: "DELETE",
      })
      if (!res.ok && res.status !== 204) {
        const data = await res.json()
        toast.error("Erro ao remover membro", {
          description: data?.error ?? `HTTP ${res.status}`,
        })
        return
      }
      toast.success("Membro removido")
      await loadMembers()
    } catch (err: unknown) {
      toast.error("Erro ao remover membro", { description: getErrorMessage(err) })
    }
  }

  return (
    <>
      <DashboardHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Definições", href: "/dashboard/settings" },
          { label: "Equipa" },
        ]}
      />
      <SettingsSubnav />

      <div className="flex flex-1 flex-col gap-5 p-4 md:p-5 bg-background">
        <PageHeader
          title="Equipa"
          description="Convide membros e defina funções de acesso ao backoffice."
        >
          <Button onClick={() => setInviteOpen(true)} size="sm">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Convidar membro
          </Button>
        </PageHeader>

        <TeamMemberList
          members={members}
          loading={loading}
          currentUserId={currentUserId}
          onInvite={() => setInviteOpen(true)}
          onChangeRole={setChangeMember}
          onRemove={handleRemove}
        />

        <Card className="border-border/80">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <UserCog className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">Funções e permissões</h3>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {STORE_ROLES.map((role) => (
                <div
                  key={role}
                  className="rounded-md border border-border/60 bg-muted/20 px-3 py-2"
                >
                  <p className="text-xs font-semibold text-foreground">{ROLE_LABELS[role]}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {ROLE_DESCRIPTIONS[role]}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onInvited={loadMembers}
      />

      <ChangeRoleDialog
        member={changeMember}
        open={!!changeMember}
        onOpenChange={(open) => !open && setChangeMember(null)}
        onUpdated={loadMembers}
      />
      {confirmDialog}
    </>
  )
}
