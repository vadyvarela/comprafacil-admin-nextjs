import { Plus } from "lucide-react"
import Link from "next/link"
import { MarketingPageFrame } from "@/components/marketing/marketing-page-frame"
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
    <MarketingPageFrame
      action={
        <Button asChild size="sm" className="h-7 text-[11px] gap-1.5">
          <Link href="/dashboard/marketing/campaigns/new">
            <Plus className="h-3.5 w-3.5" />
            Nova campanha
          </Link>
        </Button>
      }
    >
      {error ? (
        <p className="p-4 text-sm text-destructive">{error}</p>
      ) : (
        <MarketingCampaignsBoard campaigns={campaigns} live={live} />
      )}
    </MarketingPageFrame>
  )
}
