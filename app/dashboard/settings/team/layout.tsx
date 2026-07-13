import { redirect } from "next/navigation"
import { getValidSession } from "@/lib/auth0"
import { isOwner } from "@/lib/auth/config"

export default async function TeamSettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getValidSession()
  if (!session?.user || !isOwner(session.user)) {
    redirect("/unauthorized")
  }
  return children
}
