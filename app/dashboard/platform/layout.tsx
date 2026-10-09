import { requirePermissionPage } from "@/lib/auth/requirePermission"

/** Só o dono da plataforma (`platformAdmin`). A loja nunca vê isto. */
export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  await requirePermissionPage("platform.revenue.read")
  return children
}
