import { NextResponse } from "next/server"
import { requireOwnerSession } from "@/lib/auth/requireRole"
import { isPrivilegedRole, isStoreRole } from "@/lib/auth/roles"
import {
  countOwners,
  listTeamMembers,
  removeTeamMember,
  updateMemberRole,
} from "@/lib/auth0/management"
import { getErrorMessage } from "@/lib/utils/errors"

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { session, error } = await requireOwnerSession()
    if (error) return error

    const { id } = await context.params
    const body = (await request.json()) as { role?: string }
    const role = body.role ?? ""

    if (!isStoreRole(role)) {
      return NextResponse.json({ error: "Role inválida" }, { status: 400 })
    }

    if (session.user.sub === id && !isPrivilegedRole(role)) {
      const privileged = await countOwners(id)
      if (privileged === 0) {
        return NextResponse.json(
          { error: "Não é possível alterar a sua função — é o único administrador" },
          { status: 400 }
        )
      }
    }

    const member = await updateMemberRole(id, role)
    return NextResponse.json(member)
  } catch (err: unknown) {
    console.error("[team/members] PATCH error:", err)
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { session, error } = await requireOwnerSession()
    if (error) return error

    const { id } = await context.params

    if (session.user.sub === id) {
      const privileged = await countOwners(id)
      if (privileged === 0) {
        return NextResponse.json(
          { error: "Não é possível remover-se — é o único administrador" },
          { status: 400 }
        )
      }
    }

    const privilegedBefore = await countOwners()
    const members = await listTeamMembers()
    const target = members.find((m) => m.id === id)

    if (target?.role && isPrivilegedRole(target.role) && privilegedBefore <= 1) {
      return NextResponse.json(
        { error: "Não é possível remover o último administrador" },
        { status: 400 }
      )
    }

    await removeTeamMember(id)
    return new NextResponse(null, { status: 204 })
  } catch (err: unknown) {
    console.error("[team/members] DELETE error:", err)
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
