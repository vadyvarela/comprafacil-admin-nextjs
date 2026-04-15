import Link from "next/link"
import { DashboardHeader } from "@/components/layout/dashboard-header"
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
} from "lucide-react"

const SETTINGS_SECTIONS = [
  {
    title: "Loja",
    description: "Nome, logo, moeda e informações gerais",
    icon: Store,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    href: null,
  },
  {
    title: "Aparência",
    description: "Tema, cores e personalização visual",
    icon: Palette,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    href: null,
  },
  {
    title: "Pagamentos",
    description: "Métodos de pagamento e gateway",
    icon: CreditCard,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    href: null,
  },
  {
    title: "Envios",
    description: "Transportadoras, zonas e tarifas",
    icon: Truck,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    href: null,
  },
  {
    title: "Notificações",
    description: "E-mails automáticos e alertas",
    icon: Bell,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    href: null,
  },
  {
    title: "E-mails",
    description: "Templates e configurações de envio",
    icon: Mail,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    href: null,
  },
  {
    title: "Domínio",
    description: "Configurar domínio personalizado",
    icon: Globe,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    href: null,
  },
  {
    title: "Segurança",
    description: "Tokens de API e autenticação",
    icon: Shield,
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    href: "/dashboard/settings/security",
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
      <div className="flex flex-1 flex-col gap-6 p-5 md:p-6 bg-grid">
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
                className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left hover:border-primary/20 hover:shadow-sm transition-all"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${section.bg}`}>
                  <section.icon className={`h-5 w-5 ${section.color}`} />
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
                className="group flex items-center gap-3 rounded-xl border border-border border-dashed bg-card/50 p-4 text-left cursor-not-allowed opacity-60"
                disabled
                title="Em breve"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${section.bg}`}>
                  <section.icon className={`h-5 w-5 ${section.color}`} />
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

        <div className="rounded-xl border border-dashed border-border bg-card/30 p-8 text-center animate-enter">
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
