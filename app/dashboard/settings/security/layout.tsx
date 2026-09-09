import { requirePermissionPage } from "@/lib/auth/requirePermission"

export default async function SecuritySettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requirePermissionPage("security.tokens.read")
  return children
}
