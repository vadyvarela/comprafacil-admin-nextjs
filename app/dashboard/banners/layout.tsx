import { requirePermissionPage } from "@/lib/auth/requirePermission"

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  await requirePermissionPage("banners.read")
  return (
    <div className="flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden">{children}</div>
  )
}
