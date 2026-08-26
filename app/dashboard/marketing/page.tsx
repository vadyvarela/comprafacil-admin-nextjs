import Link from "next/link"
import { Plus } from "lucide-react"
import { MarketingDesk } from "@/components/marketing/marketing-desk"
import { MarketingPageFrame } from "@/components/marketing/marketing-page-frame"
import { Button } from "@/components/ui/button"
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
    <MarketingPageFrame
      action={
        <Button asChild size="sm" className="h-7 gap-1.5 text-[11px]">
          <Link href="/dashboard/marketing/campaigns/new">
            <Plus className="h-3.5 w-3.5" />
            Nova campanha
          </Link>
        </Button>
      }
    >
      <MarketingDesk pulse={pulse} />
    </MarketingPageFrame>
  )
}
