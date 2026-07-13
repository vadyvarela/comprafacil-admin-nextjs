import { isOwner } from "@/lib/auth/config"
import { requirePageAccess } from "@/lib/auth/requirePageAccess"
import { SettingsAccessProvider } from "@/components/layout/settings-access-context"

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requirePageAccess("settings", "read")
  const owner = isOwner(session.user)

  return <SettingsAccessProvider isOwner={owner}>{children}</SettingsAccessProvider>
}
