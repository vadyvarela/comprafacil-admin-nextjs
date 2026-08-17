import { MarketingDesk } from "@/components/marketing/marketing-desk"
import { MarketingPageFrame } from "@/components/marketing/marketing-page-frame"
import { getMarketingPulse } from "@/lib/actions/marketing"

export default async function MarketingPage() {
  let pulse
  try {
    pulse = await getMarketingPulse()
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível carregar o pulso de marketing."
    return (
      <MarketingPageFrame>
        <p className="p-4 text-sm text-destructive">{message}</p>
      </MarketingPageFrame>
    )
  }

  return (
    <MarketingPageFrame>
      <MarketingDesk pulse={pulse} />
    </MarketingPageFrame>
  )
}
