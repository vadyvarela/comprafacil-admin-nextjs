import { MarketingContentBoard } from "@/components/marketing/marketing-content-board"
import { MarketingPageFrame } from "@/components/marketing/marketing-page-frame"
import { getLiveMarketingCampaign, getMarketingDesk } from "@/lib/actions/marketing"
import { storefrontCampaignUrl } from "@/lib/marketing/storefront"

export default async function MarketingContentPage() {
  const [desk, live] = await Promise.all([getMarketingDesk(), getLiveMarketingCampaign()])

  return (
    <MarketingPageFrame>
      <MarketingContentBoard
        desk={desk}
        campaignUrl={storefrontCampaignUrl(live)}
        headline={live?.headline || live?.name || desk.weeklyOffer?.headline}
        facebookPost={live?.facebookPost || desk.weeklyOffer?.facebookPost}
        instagramCaption={live?.instagramCaption || desk.weeklyOffer?.instagramCaption}
        whatsappText={live?.whatsappText || desk.weeklyOffer?.whatsappText}
      />
    </MarketingPageFrame>
  )
}
