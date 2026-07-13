import { requireOwnerPageAccess } from "@/lib/auth/requirePageAccess"

export default async function SecuritySettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireOwnerPageAccess()
  return children
}
