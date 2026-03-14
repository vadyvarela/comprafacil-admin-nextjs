import Link from "next/link"
import { CreditCard, Package, Receipt, LayoutDashboard } from "lucide-react"
import { DashboardHeader } from "@/components/layout/dashboard-header"

const links = [
  { href: "/dashboard/orders", label: "Pedidos", icon: Receipt },
  { href: "/dashboard/transactions", label: "Transações", icon: CreditCard },
  { href: "/dashboard/products", label: "Produtos", icon: Package },
]

export default function DashboardPage() {
  return (
    <>
      <DashboardHeader items={[{ label: "Dashboard" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <LayoutDashboard className="h-4 w-4" />
          <p className="text-sm">Acesso rápido</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-md border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              {label}
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
