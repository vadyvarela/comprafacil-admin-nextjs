import { Megaphone } from "lucide-react"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { PageToolbar } from "@/components/admin/page-toolbar"
import { MarketingDesk } from "@/components/marketing/marketing-desk"
import { MarketingSubnav } from "@/components/marketing/marketing-subnav"
import { getMarketingPulse } from "@/lib/actions/marketing"

export default async function MarketingPage() {
  let pulse
  try {
    pulse = await getMarketingPulse()
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível carregar o pulso de marketing."
    return (
      <>
        <DashboardHeader
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Marketing" },
          ]}
        />
        <PageToolbar icon={Megaphone} title="Marketing" subtitle="O agente sugere. Tu publicas." />
        <p className="p-4 text-sm text-destructive md:p-5">{message}</p>
      </>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DashboardHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Marketing" },
        ]}
      />
      <PageToolbar icon={Megaphone} title="Marketing" subtitle="O agente sugere. Tu publicas." />
      <MarketingSubnav />
      <MarketingDesk pulse={pulse} />
    </div>
  )
}
