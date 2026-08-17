import { notFound } from "next/navigation"
import { MarketingPageFrame } from "@/components/marketing/marketing-page-frame"
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
    <MarketingPageFrame scroll>
      <MarketingCampaignForm
        campaign={campaign}
        metaPixelId={settings.data?.storeSettings?.metaPixelId ?? null}
      />
    </MarketingPageFrame>
  )
}
