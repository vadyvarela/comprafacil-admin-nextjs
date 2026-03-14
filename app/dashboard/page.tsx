import Link from "next/link"
import { CreditCard, Package, Receipt, ShoppingCart, TrendingUp } from "lucide-react"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { getOrdersPage } from "@/lib/actions/orders"
import { getTransactions } from "@/lib/actions/transactions"

async function getDashboardCounts() {
  const [ordersRes, transactionsRes] = await Promise.all([
    getOrdersPage({ page: 0 }),
    getTransactions({ page: { page: 0, size: 1 } }),
  ])
  return {
    orders: ordersRes.ok ? ordersRes.data.totalElements ?? 0 : 0,
    transactions: transactionsRes.ok ? transactionsRes.data.totalElements ?? 0 : 0,
  }
}

const cards = [
  {
    title: "Pedidos",
    href: "/dashboard/orders",
    icon: ShoppingCart,
    key: "orders" as const,
    description: "Pedidos pagos",
  },
  {
    title: "Transações",
    href: "/dashboard/transactions",
    icon: CreditCard,
    key: "transactions" as const,
    description: "Pagamentos",
  },
  {
    title: "Produtos",
    href: "/dashboard/products",
    icon: Package,
    key: "products" as const,
    description: "Catálogo",
  },
]

export default async function DashboardPage() {
  const counts = await getDashboardCounts()

  return (
    <>
      <DashboardHeader items={[{ label: "Dashboard" }]} />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Visão geral</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Resumo da loja e acesso rápido.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ title, href, icon: Icon, key, description }) => {
            const value =
              key === "orders"
                ? counts.orders
                : key === "transactions"
                  ? counts.transactions
                  : null
            return (
              <Link key={href} href={href} className="block transition-opacity hover:opacity-90">
                <Card className="overflow-hidden border-border py-4 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 pb-1 pt-0">
                    <span className="text-xs font-medium text-muted-foreground">
                      {description}
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-0 pt-0">
                    <p className="text-xl font-semibold tabular-nums text-foreground">
                      {value !== null ? value : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{title}</p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-medium">Acesso rápido</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/dashboard/orders"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
            >
              <Receipt className="h-3.5 w-3.5" />
              Pedidos
            </Link>
            <Link
              href="/dashboard/transactions"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
            >
              <CreditCard className="h-3.5 w-3.5" />
              Transações
            </Link>
            <Link
              href="/dashboard/products"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
            >
              <Package className="h-3.5 w-3.5" />
              Produtos
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
