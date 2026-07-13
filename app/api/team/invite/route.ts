import { NextResponse } from "next/server"
import { requireOwnerSession } from "@/lib/auth/requireRole"
import { isStoreRole } from "@/lib/auth/roles"
import { inviteTeamMember } from "@/lib/auth0/management"
import { getErrorMessage } from "@/lib/utils/errors"

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: Request) {
  try {
    const { error } = await requireOwnerSession()
    if (error) return error

    const body = (await request.json()) as { email?: string; role?: string }
    const email = body.email?.trim().toLowerCase() ?? ""
    const role = body.role ?? ""

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 })
    }

    if (!isStoreRole(role)) {
      return NextResponse.json({ error: "Role inválida" }, { status: 400 })
    }

    const member = await inviteTeamMember(email, role)
    return NextResponse.json(member, { status: 201 })
  } catch (err: unknown) {
    console.error("[team/invite] POST error:", err)
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
