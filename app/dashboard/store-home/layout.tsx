import { requirePageAccess } from "@/lib/auth/requirePageAccess"

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  await requirePageAccess("settings", "read")
  return children
}
