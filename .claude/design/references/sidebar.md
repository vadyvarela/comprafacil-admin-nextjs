# Sidebar Reference Implementation

Full production-ready sidebar for ecommerce backoffice.

## Component Code

```tsx
// components/dashboard/sidebar.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, ShoppingBag, Package, Users, BarChart3,
  Settings, ChevronLeft, Bell, Search, Store, Tag,
  Truck, MessageSquare, Star, Wallet, Menu
} from 'lucide-react'

const navGroups = [
  {
    label: 'Principal',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', badge: null },
      { href: '/dashboard/orders', icon: ShoppingBag, label: 'Pedidos', badge: '24' },
      { href: '/dashboard/products', icon: Package, label: 'Produtos', badge: null },
      { href: '/dashboard/customers', icon: Users, label: 'Clientes', badge: null },
    ]
  },
  {
    label: 'Operações',
    items: [
      { href: '/dashboard/inventory', icon: Store, label: 'Estoque', badge: '3' },
      { href: '/dashboard/shipping', icon: Truck, label: 'Entregas', badge: null },
      { href: '/dashboard/promotions', icon: Tag, label: 'Promoções', badge: null },
      { href: '/dashboard/payments', icon: Wallet, label: 'Financeiro', badge: null },
    ]
  },
  {
    label: 'Insights',
    items: [
      { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics', badge: null },
      { href: '/dashboard/reviews', icon: Star, label: 'Avaliações', badge: '7' },
      { href: '/dashboard/messages', icon: MessageSquare, label: 'Mensagens', badge: '2' },
    ]
  },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-screen bg-[#111118] border-r border-white/[0.06] flex flex-col z-50 overflow-hidden"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#4F6EF7] flex items-center justify-center shrink-0">
            <Store className="w-4 h-4 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="font-bold text-white text-sm tracking-tight whitespace-nowrap"
              >
                Minha Loja
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={onToggle}
          className="ml-auto p-1.5 rounded-md text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-colors shrink-0"
        >
          <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronLeft className="w-4 h-4" />
          </motion.div>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            <AnimatePresence>
              {!collapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[10px] font-semibold text-white/25 uppercase tracking-widest px-2 mb-1"
                >
                  {group.label}
                </motion.p>
              )}
            </AnimatePresence>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-2 py-2 rounded-lg transition-all duration-150 group relative',
                        isActive
                          ? 'bg-[#4F6EF7]/10 text-[#4F6EF7]'
                          : 'text-white/40 hover:text-white/80 hover:bg-white/[0.04]',
                        collapsed ? 'justify-center' : ''
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#4F6EF7] rounded-full"
                        />
                      )}
                      <item.icon className={cn('shrink-0', collapsed ? 'w-5 h-5' : 'w-4 h-4')} />
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-sm font-medium flex-1 whitespace-nowrap"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {!collapsed && item.badge && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#4F6EF7]/20 text-[#4F6EF7]">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-2 border-t border-white/[0.06] shrink-0">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 px-2 py-2 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.04] transition-all"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4F6EF7] to-purple-600 flex items-center justify-center shrink-0 text-xs font-bold text-white">
            A
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-xs font-medium text-white/80 truncate">Admin</p>
                <p className="text-[10px] text-white/30 truncate">admin@loja.com</p>
              </motion.div>
            )}
          </AnimatePresence>
          {!collapsed && <Settings className="w-3.5 h-3.5 shrink-0" />}
        </Link>
      </div>
    </motion.aside>
  )
}
```

## Dashboard Layout Shell

```tsx
// app/dashboard/layout.tsx
'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const sidebarWidth = collapsed ? 64 : 240

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main
        style={{ marginLeft: sidebarWidth }}
        className="transition-all duration-200 min-h-screen"
      >
        <DashboardHeader />
        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
```

## Header Component

```tsx
// components/dashboard/header.tsx
'use client'

import { Bell, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function DashboardHeader() {
  return (
    <header className="h-16 border-b border-white/[0.06] bg-[#0A0A0F]/80 backdrop-blur sticky top-0 z-40 flex items-center px-6 md:px-8 gap-4">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-white/30 hover:border-white/10 transition-colors cursor-pointer">
          <Search className="w-4 h-4" />
          <span className="text-sm">Buscar pedidos, produtos...</span>
          <kbd className="ml-auto text-[10px] bg-white/[0.06] px-1.5 py-0.5 rounded text-white/20">⌘K</kbd>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-auto">
        <button className="relative p-2 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.04] transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#4F6EF7] rounded-full" />
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4F6EF7] to-purple-600 flex items-center justify-center text-xs font-bold text-white cursor-pointer">
          A
        </div>
      </div>
    </header>
  )
}
```
