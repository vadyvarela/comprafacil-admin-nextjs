import { requirePageAccess } from "@/lib/auth/requirePageAccess"

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  await requirePageAccess("logs", "read")

  return children
}
