"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ROLE_CLAIM } from "@/lib/auth/config"
import {
  canAccessPath,
  isWritePath,
  type StoreRole,
} from "@/lib/auth/roles"

type RouteAccessGuardProps = {
  primaryRole: StoreRole | null
  roles: StoreRole[]
}

export function RouteAccessGuard({ primaryRole, roles }: RouteAccessGuardProps) {
  const pathname = usePathname() ?? ""
  const router = useRouter()

  useEffect(() => {
    if (!primaryRole) return

    const userLike = {
      sub: null,
      [ROLE_CLAIM]: roles,
    }

    const mode = isWritePath(pathname) ? "write" : "read"
    if (!canAccessPath(userLike, pathname, mode)) {
      router.replace("/unauthorized")
    }
  }, [pathname, primaryRole, roles, router])

  return null
}
