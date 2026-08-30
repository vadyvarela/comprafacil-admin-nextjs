import { requirePageAccess } from "@/lib/auth/requirePageAccess"
import { canWriteModule } from "@/lib/auth/roles"
import { ModuleAccessProvider } from "@/components/layout/module-access-context"

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requirePageAccess("products", "read")
  const canWrite = canWriteModule(session.user, "products")

  return <ModuleAccessProvider canWrite={canWrite}>{children}</ModuleAccessProvider>
}
