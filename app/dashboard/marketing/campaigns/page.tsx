import { CalendarRange, Plus } from "lucide-react"
import Link from "next/link"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { PageToolbar } from "@/components/admin/page-toolbar"
import { MarketingSubnav } from "@/components/marketing/marketing-subnav"
import { MarketingCampaignsBoard } from "@/components/marketing/marketing-campaigns-board"
import { Button } from "@/components/ui/button"
import { getLiveMarketingCampaign, listMarketingCampaigns } from "@/lib/actions/marketing"

export default async function MarketingCampaignsPage() {
  let campaigns = [] as Awaited<ReturnType<typeof listMarketingCampaigns>>
  let live = null as Awaited<ReturnType<typeof getLiveMarketingCampaign>>
  let error: string | null = null

  try {
    ;[campaigns, live] = await Promise.all([listMarketingCampaigns(), getLiveMarketingCampaign()])
  } catch (err) {
    error = err instanceof Error ? err.message : "Não foi possível carregar as campanhas."
  }

  return (
    <>
      <DashboardHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Marketing", href: "/dashboard/marketing" },
          { label: "Campanhas" },
        ]}
      />
      <PageToolbar
        icon={CalendarRange}
        title="Campanhas"
        subtitle="O que está na loja esta semana"
      >
        <Button asChild size="sm" className="h-8 text-xs gap-1.5">
          <Link href="/dashboard/marketing/campaigns/new">
            <Plus className="h-3.5 w-3.5" />
            Nova campanha
          </Link>
        </Button>
      </PageToolbar>
      <MarketingSubnav />
      {error ? (
        <p className="p-4 text-sm text-destructive md:p-5">{error}</p>
      ) : (
        <MarketingCampaignsBoard campaigns={campaigns} live={live} />
      )}
    </>
  )
}
