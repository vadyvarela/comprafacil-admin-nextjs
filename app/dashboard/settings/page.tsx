import Link from "next/link"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { SettingsSubnav } from "@/components/layout/settings-subnav"
import { PageHeader } from "@/components/admin/page-header"
import {
  Store,
  Globe,
  Bell,
  Shield,
  CreditCard,
  Truck,
  Mail,
  Palette,
  ChevronRight,
  Construction,
  LayoutGrid,
} from "lucide-react"

const SETTINGS_SECTIONS = [
  {
    title: "Manutenção",
    description: "Modo manutenção da loja pública e mensagem",
    icon: Construction,
    color: "text-amber-900",
    bg: "bg-amber-50 border border-border/60",
    href: "/dashboard/settings/maintenance",
  },
  {
    title: "Loja",
    description: "Nome, logo, moeda e informações gerais",
    icon: Store,
    color: "text-blue-800",
    bg: "bg-blue-50 border border-border/60",
    href: "/dashboard/settings/store",
  },
  {
    title: "Aparência",
    description: "Tema, cores e personalização visual",
    icon: Palette,
    color: "text-violet-800",
    bg: "bg-violet-50 border border-border/60",
    href: null,
  },
  {
    title: "Pagamentos",
    description: "Métodos de pagamento e gateway",
    icon: CreditCard,
    color: "text-emerald-800",
    bg: "bg-emerald-50 border border-border/60",
    href: null,
  },
  {
    title: "Envios",
    description: "Tarifas por ilha e valor de compra",
    icon: Truck,
    color: "text-amber-900",
    bg: "bg-amber-50 border border-border/60",
    href: "/dashboard/settings/shipping",
  },
  {
    title: "Notificações",
    description: "E-mails automáticos e alertas",
    icon: Bell,
    color: "text-rose-800",
    bg: "bg-rose-50 border border-border/60",
    href: null,
  },
  {
    title: "E-mails",
    description: "Templates e configurações de envio",
    icon: Mail,
    color: "text-sky-800",
    bg: "bg-sky-50 border border-border/60",
    href: null,
  },
  {
    title: "Domínio",
    description: "Configurar domínio personalizado",
    icon: Globe,
    color: "text-indigo-800",
    bg: "bg-indigo-50 border border-border/60",
    href: null,
  },
  {
    title: "Segurança",
    description: "Tokens de API e autenticação",
    icon: Shield,
    color: "text-primary",
    bg: "bg-primary/10 border border-primary/20",
    href: "/dashboard/settings/security",
  },
  {
    title: "Page Builder",
    description: "Home da loja, menu do header e publicação",
    icon: LayoutGrid,
    color: "text-fuchsia-800",
    bg: "bg-fuchsia-50 border border-border/60",
    href: "/dashboard/settings/page-builder",
  },
]

export default function SettingsPage() {
  return (
    <>
      <DashboardHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Definições" },
        ]}
      />
      <SettingsSubnav />
      <div className="flex flex-1 flex-col gap-5 p-4 md:p-5 bg-background">
        <div className="animate-enter">
          <PageHeader
            title="Definições"
            description="Configurações gerais da loja KumpraFacil"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-enter">
          {SETTINGS_SECTIONS.map((section) =>
            section.href ? (
              <Link
                key={section.title}
                href={section.href}
                className="group flex items-center gap-3 rounded-lg border border-border/80 bg-card p-3.5 text-left shadow-none transition-colors hover:border-border hover:bg-muted/25"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${section.bg}`}
                >
                  <section.icon className={`h-4 w-4 ${section.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{section.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{section.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0 group-hover:text-primary transition-colors" />
              </Link>
            ) : (
              <button
                key={section.title}
                className="group flex items-center gap-3 rounded-lg border border-dashed border-border/80 bg-muted/20 p-3.5 text-left cursor-not-allowed opacity-[0.65]"
                disabled
                title="Em breve"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${section.bg}`}
                >
                  <section.icon className={`h-4 w-4 ${section.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{section.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{section.description}</p>
                </div>
                <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                  Em breve
                </span>
              </button>
            )
          )}
        </div>

        <div className="rounded-lg border border-dashed border-border/80 bg-muted/15 p-7 text-center animate-enter">
          <Construction className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground mb-1">Definições em desenvolvimento</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            As configurações da loja estarão disponíveis em breve. Por agora podes gerir produtos, pedidos e clientes.
          </p>
        </div>
      </div>
    </>
  )
}
