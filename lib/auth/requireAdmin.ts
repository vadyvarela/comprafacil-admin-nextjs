import { NextResponse } from "next/server"
import { getValidSession } from "@/lib/auth0"
import { hasAdminRole } from "@/lib/auth/config"

export type AdminSession = NonNullable<Awaited<ReturnType<typeof getValidSession>>>

export async function requireAdminSession(): Promise<
  | { session: AdminSession; error: null }
  | { session: null; error: NextResponse }
> {
  const session = await getValidSession()

  if (!session) {
    return {
      session: null,
      error: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      ),
    }
  }

  if (!hasAdminRole(session.user)) {
    return {
      session: null,
      error: NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      ),
    }
  }

  return { session, error: null }
}

/**
 * For use in Server Actions ("use server").
 * Throws instead of returning NextResponse.
 */
export async function requireAdminSessionOrThrow(): Promise<AdminSession> {
  const session = await getValidSession()

  if (!session) {
    throw new Error("Authentication required")
  }

  if (!hasAdminRole(session.user)) {
    throw new Error("Insufficient permissions")
  }

  return session
}
