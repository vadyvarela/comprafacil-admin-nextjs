import { CalendarRange } from "lucide-react"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { PageToolbar } from "@/components/admin/page-toolbar"
import { MarketingSubnav } from "@/components/marketing/marketing-subnav"
import { MarketingCampaignForm } from "@/components/marketing/marketing-campaign-form"
import { runGraphQL } from "@/lib/actions/graphql"
import { GET_STORE_SETTINGS } from "@/lib/graphql/store-settings/queries"

export default async function NewMarketingCampaignPage() {
  const settings = await runGraphQL<{ storeSettings: { metaPixelId?: string | null } }>(
    GET_STORE_SETTINGS,
  )

  return (
    <>
      <DashboardHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Marketing", href: "/dashboard/marketing" },
          { label: "Campanhas", href: "/dashboard/marketing/campaigns" },
          { label: "Nova" },
        ]}
      />
      <PageToolbar
        icon={CalendarRange}
        title="Nova campanha"
        subtitle="Nome, datas e o mesmo gancho para a loja e as redes"
      />
      <MarketingSubnav />
      <MarketingCampaignForm metaPixelId={settings.data?.storeSettings?.metaPixelId ?? null} />
    </>
  )
}
