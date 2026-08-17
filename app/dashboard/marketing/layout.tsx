import { requirePageAccess } from "@/lib/auth/requirePageAccess"

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requirePageAccess("marketing", "read")
  return (
    <div className="flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden">{children}</div>
  )
}
