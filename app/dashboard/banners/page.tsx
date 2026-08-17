import { BannerDesk } from "@/components/banners/banner-desk"
import { getMarketingPulse } from "@/lib/actions/marketing"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

export default async function BannersPage() {
  let pulse
  try {
    pulse = await getMarketingPulse()
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível abrir o estúdio de banners."
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-2 md:px-3">
          <SidebarTrigger className="-ml-0.5 size-8 shrink-0" />
          <Separator orientation="vertical" className="h-4" />
          <p className="text-[13px] font-medium">Banners</p>
        </header>
        <p className="p-4 text-sm text-destructive">{message}</p>
      </div>
    )
  }

  return <BannerDesk pulse={pulse} />
}
