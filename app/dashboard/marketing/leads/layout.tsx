import { requirePermissionPage } from "@/lib/auth/requirePermission"

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  await requirePermissionPage("marketing.leads.read")
  return children
}
