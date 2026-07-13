import { getValidSession } from "@/lib/auth0"
import { TeamSettingsClient } from "./team-settings-client"

export default async function TeamSettingsPage() {
  const session = await getValidSession()
  return <TeamSettingsClient currentUserId={session?.user?.sub ?? null} />
}
