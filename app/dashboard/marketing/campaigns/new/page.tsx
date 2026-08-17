import { MarketingPageFrame } from "@/components/marketing/marketing-page-frame"
import { MarketingCampaignStudio } from "@/components/marketing/marketing-campaign-studio"
import { getMarketingPulse } from "@/lib/actions/marketing"

export default async function NewMarketingCampaignPage() {
  let pulse
  try {
    pulse = await getMarketingPulse()
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível abrir o estúdio."
    return (
      <MarketingPageFrame>
        <p className="p-4 text-sm text-destructive">{message}</p>
      </MarketingPageFrame>
    )
  }

  return (
    <MarketingPageFrame>
      <MarketingCampaignStudio pulse={pulse} />
    </MarketingPageFrame>
  )
}
