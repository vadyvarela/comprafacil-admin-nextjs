import { requirePermissionPage } from "@/lib/auth/requirePermission"

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requirePermissionPage("settings.read")
  return <>{children}</>
}
