import { TeamSettingsClient } from "./team-settings-client"

export default function TeamSettingsPage() {
  // Quem é o próprio já vem marcado em cada membro pela API (`isSelf`), por
  // isso a página não precisa de passar o id para baixo.
  return <TeamSettingsClient />
}
