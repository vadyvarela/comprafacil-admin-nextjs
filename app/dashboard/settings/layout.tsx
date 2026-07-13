import { getValidSession } from "@/lib/auth0"
import { isOwner } from "@/lib/auth/config"
import { SettingsAccessProvider } from "@/components/layout/settings-access-context"

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getValidSession()
  const owner = isOwner(session?.user)

  return <SettingsAccessProvider isOwner={owner}>{children}</SettingsAccessProvider>
}
