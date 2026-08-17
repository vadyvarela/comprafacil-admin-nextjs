import { FileText } from "lucide-react"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { PageToolbar } from "@/components/admin/page-toolbar"
import { getLiveMarketingCampaign, getMarketingDesk } from "@/lib/actions/marketing"
import { MarketingContentBoard } from "@/components/marketing/marketing-content-board"
import { MarketingSubnav } from "@/components/marketing/marketing-subnav"
import { storefrontCampaignUrl } from "@/lib/marketing/storefront"

export default async function MarketingContentPage() {
  const [desk, live] = await Promise.all([getMarketingDesk(), getLiveMarketingCampaign()])
  const campaignUrl = storefrontCampaignUrl(live)

  return (
    <>
      <DashboardHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Marketing", href: "/dashboard/marketing" },
          { label: "Posts" },
        ]}
      />
      <PageToolbar
        icon={FileText}
        title="Posts"
        subtitle="Texto e imagens para colar no Facebook e no Instagram"
      />
      <MarketingSubnav />
      <MarketingContentBoard desk={desk} campaignUrl={campaignUrl} />
    </>
  )
}
