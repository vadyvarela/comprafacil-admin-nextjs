import { requireOwnerPageAccess } from "@/lib/auth/requirePageAccess"

export default async function TeamSettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireOwnerPageAccess()
  return children
}
