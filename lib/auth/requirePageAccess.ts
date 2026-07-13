import { redirect } from "next/navigation"
import { getValidSession } from "@/lib/auth0"
import { hasStoreAccess, isOwner } from "@/lib/auth/config"
import {
  canReadModule,
  canWriteModule,
  type AccessModule,
} from "@/lib/auth/roles"

/**
 * Protege páginas no servidor. Se não tiver acesso, faz redirect
 * antes de renderizar qualquer UI (sem flash).
 */
export async function requirePageAccess(
  module: AccessModule,
  mode: "read" | "write" = "read"
) {
  const session = await getValidSession()

  if (!session?.user) {
    redirect("/auth/login?returnTo=/dashboard")
  }

  if (!hasStoreAccess(session.user)) {
    redirect("/unauthorized")
  }

  const allowed =
    mode === "write"
      ? canWriteModule(session.user, module)
      : canReadModule(session.user, module)

  if (!allowed) {
    redirect("/unauthorized")
  }

  return session
}

export async function requireOwnerPageAccess() {
  const session = await getValidSession()

  if (!session?.user) {
    redirect("/auth/login?returnTo=/dashboard")
  }

  if (!isOwner(session.user)) {
    redirect("/unauthorized")
  }

  return session
}
