import { NextResponse } from "next/server"
import { requireOwnerSession } from "@/lib/auth/requireRole"
import { listTeamMembers } from "@/lib/auth0/management"
import { getErrorMessage } from "@/lib/utils/errors"

export async function GET() {
  try {
    const { error } = await requireOwnerSession()
    if (error) return error

    const members = await listTeamMembers()
    return NextResponse.json(members)
  } catch (err: unknown) {
    console.error("[team/members] GET error:", err)
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
