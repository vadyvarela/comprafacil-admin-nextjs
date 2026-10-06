import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { SettingsSubnav } from "@/components/layout/settings-subnav"
import { PageHeader } from "@/components/admin/page-header"
import { getStoreBrand } from "@/lib/services/get-store-brand"
import { can, getPrincipal } from "@/lib/auth/principal"
import { SETTINGS_GROUPS, SETTINGS_TABS } from "@/lib/nav"

export default async function SettingsPage() {
  const storeBrand = await getStoreBrand()
  const principal = await getPrincipal()
  // A mesma tabela da sub-navegação: o que aparece aqui é o que se pode abrir.
  const groups = SETTINGS_GROUPS.map((group) => ({
    group,
    tabs: SETTINGS_TABS.filter((tab) => tab.group === group && can(principal, tab.permission)),
  })).filter(({ tabs }) => tabs.length > 0)

  return (
    <>
      <DashboardHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Definições" },
        ]}
      />
      <SettingsSubnav />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-5 bg-background">
        <div className="animate-enter">
          <PageHeader
            title="Definições"
            description={`Configurações da loja ${storeBrand.siteName}`}
          />
        </div>

        {groups.map(({ group, tabs }) => (
          <section key={group} className="space-y-2 animate-enter" aria-labelledby={`settings-${group}`}>
            <h2
              id={`settings-${group}`}
              className="text-xs font-semibold uppercase text-muted-foreground"
            >
              {group}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className="group flex min-h-20 items-center gap-3 rounded-lg border border-border/80 bg-card p-3.5 text-left shadow-xs transition-colors outline-none hover:border-border hover:bg-muted/25 focus-visible:ring-2 focus-visible:ring-ring/35 active:translate-y-px"
                  >
                    {Icon ? (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/40">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                    ) : null}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{tab.label}</p>
                      {tab.description ? (
                        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {tab.description}
                        </p>
                      ) : null}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0 group-hover:text-primary transition-colors" />
                  </Link>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
