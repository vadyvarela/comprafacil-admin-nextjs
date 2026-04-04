import { DashboardHeader } from "@/components/layout/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
} from "lucide-react"

const SETTINGS_SECTIONS = [
  {
    title: "Loja",
    description: "Nome, logo, moeda e informações gerais",
    icon: Store,
    color: "text-blue-600",
    bg: "bg-blue-500/10",
    badge: null,
  },
  {
    title: "Aparência",
    description: "Tema, cores e personalização visual",
    icon: Palette,
    color: "text-purple-600",
    bg: "bg-purple-500/10",
    badge: null,
  },
  {
    title: "Pagamentos",
    description: "Métodos de pagamento e gateway",
    icon: CreditCard,
    color: "text-emerald-600",
    bg: "bg-emerald-500/10",
    badge: null,
  },
  {
    title: "Envios",
    description: "Transportadoras, zonas e tarifas",
    icon: Truck,
    color: "text-amber-600",
    bg: "bg-amber-500/10",
    badge: null,
  },
  {
    title: "Notificações",
    description: "E-mails automáticos e alertas",
    icon: Bell,
    color: "text-rose-600",
    bg: "bg-rose-500/10",
    badge: null,
  },
  {
    title: "E-mails",
    description: "Templates e configurações de envio",
    icon: Mail,
    color: "text-cyan-600",
    bg: "bg-cyan-500/10",
    badge: null,
  },
  {
    title: "Domínio",
    description: "Configurar domínio personalizado",
    icon: Globe,
    color: "text-indigo-600",
    bg: "bg-indigo-500/10",
    badge: null,
  },
  {
    title: "Segurança",
    description: "Autenticação, 2FA e permissões",
    icon: Shield,
    color: "text-slate-600",
    bg: "bg-slate-500/10",
    badge: null,
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
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Definições</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configurações gerais da loja TechArena
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {SETTINGS_SECTIONS.map((section) => (
            <button
              key={section.title}
              className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left hover:border-primary/30 hover:shadow-sm transition-all cursor-not-allowed opacity-70"
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
              <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
            </button>
          ))}
        </div>

        <Card className="border-border shadow-sm border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <Store className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-semibold text-foreground mb-1">Definições em desenvolvimento</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              As configurações da loja estarão disponíveis em breve. Por agora podes gerir produtos, pedidos e clientes.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
