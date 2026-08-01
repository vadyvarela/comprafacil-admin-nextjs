"use client"

/* eslint-disable @next/next/no-img-element */

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ROLE_LABELS, type StoreRole } from "@/lib/auth/roles"
import type { TeamMember } from "@/lib/auth0/management"
import { Pencil, Trash2, Users } from "lucide-react"

const ROLE_BADGE_VARIANT: Record<StoreRole, "default" | "secondary" | "outline"> = {
  owner: "default",
  admin: "default",
  manager: "secondary",
  operator: "outline",
  viewer: "outline",
}

function MemberAvatar({ member }: { member: TeamMember }) {
  const initials = (member.name ?? member.email)
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("")

  if (member.picture) {
    return (
      <img
        src={member.picture}
        alt=""
        className="h-8 w-8 rounded-full object-cover border border-border/60"
      />
    )
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-muted text-xs font-semibold text-muted-foreground">
      {initials || "?"}
    </div>
  )
}

type TeamMemberListProps = {
  members: TeamMember[]
  loading: boolean
  currentUserId?: string | null
  onInvite: () => void
  onChangeRole: (member: TeamMember) => void
  onRemove: (member: TeamMember) => void
}

export function TeamMemberList({
  members,
  loading,
  currentUserId,
  onInvite,
  onChangeRole,
  onRemove,
}: TeamMemberListProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>
    )
  }

  if (members.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-semibold text-foreground mb-1">Nenhum membro na equipa</p>
          <p className="text-xs text-muted-foreground mb-4">
            Convide colegas para ajudar a gerir a loja.
          </p>
          <Button size="sm" onClick={onInvite}>
            Convidar primeiro membro
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="rounded-lg border border-border/80 bg-card shadow-none overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-xs">Membro</TableHead>
            <TableHead className="text-xs">Função</TableHead>
            <TableHead className="text-xs">Estado</TableHead>
            <TableHead className="text-xs text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <MemberAvatar member={member} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {member.name ?? member.email}
                      {member.id === currentUserId && (
                        <span className="text-muted-foreground font-normal"> (tu)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {member.role ? (
                  <Badge variant={ROLE_BADGE_VARIANT[member.role]} className="text-xs">
                    {ROLE_LABELS[member.role]}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant={member.status === "active" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {member.status === "active" ? "Ativo" : "Convite pendente"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => onChangeRole(member)}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    Função
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-destructive hover:text-destructive"
                    onClick={() => onRemove(member)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
