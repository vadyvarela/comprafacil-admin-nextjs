import { requirePageAccess } from "@/lib/auth/requirePageAccess"

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requirePageAccess("marketing", "read")
  return children
}
