import { requirePermissionPage } from "@/lib/auth/requirePermission"

export default async function TeamSettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requirePermissionPage("team.read")
  return children
}
