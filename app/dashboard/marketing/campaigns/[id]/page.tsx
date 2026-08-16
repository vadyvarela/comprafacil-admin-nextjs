import { notFound } from "next/navigation"
import { CalendarRange } from "lucide-react"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { PageToolbar } from "@/components/admin/page-toolbar"
import { MarketingSubnav } from "@/components/marketing/marketing-subnav"
import { MarketingCampaignForm } from "@/components/marketing/marketing-campaign-form"
import { getMarketingCampaign } from "@/lib/actions/marketing"
import { runGraphQL } from "@/lib/actions/graphql"
import { GET_STORE_SETTINGS } from "@/lib/graphql/store-settings/queries"

export default async function MarketingCampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [campaign, settings] = await Promise.all([
    getMarketingCampaign(id),
    runGraphQL<{ storeSettings: { metaPixelId?: string | null } }>(GET_STORE_SETTINGS),
  ])
  if (!campaign) notFound()

  return (
    <>
      <DashboardHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Marketing", href: "/dashboard/marketing" },
          { label: "Campanhas", href: "/dashboard/marketing/campaigns" },
          { label: campaign.name },
        ]}
      />
      <PageToolbar icon={CalendarRange} title={campaign.name} subtitle="Editar copy, datas e estado" />
      <MarketingSubnav />
      <MarketingCampaignForm
        campaign={campaign}
        metaPixelId={settings.data?.storeSettings?.metaPixelId ?? null}
      />
    </>
  )
}
