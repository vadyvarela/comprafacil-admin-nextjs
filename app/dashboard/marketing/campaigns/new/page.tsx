import { MarketingPageFrame } from "@/components/marketing/marketing-page-frame"
import { MarketingCampaignForm } from "@/components/marketing/marketing-campaign-form"
import { runGraphQL } from "@/lib/actions/graphql"
import { GET_STORE_SETTINGS } from "@/lib/graphql/store-settings/queries"

export default async function NewMarketingCampaignPage() {
  const settings = await runGraphQL<{ storeSettings: { metaPixelId?: string | null } }>(
    GET_STORE_SETTINGS,
  )

  return (
    <MarketingPageFrame scroll>
      <MarketingCampaignForm metaPixelId={settings.data?.storeSettings?.metaPixelId ?? null} />
    </MarketingPageFrame>
  )
}
