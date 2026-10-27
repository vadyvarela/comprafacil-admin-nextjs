"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronsUpDown, Store } from "lucide-react"
import { toast } from "sonner"

import { clearActiveStore, switchActiveStore } from "@/lib/actions/active-store"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

type StoreOption = { id: string; name: string; active: boolean }

type StoreSwitcherProps = {
  stores: StoreOption[]
  /** O cookie apontava para uma loja a que a pessoa já não tem acesso. */
  stale?: boolean
}

/**
 * Seletor de loja. Só aparece a quem pertence a mais do que uma.
 */
export function StoreSwitcher({ stores, stale = false }: StoreSwitcherProps) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  React.useEffect(() => {
    if (!stale) return
    void clearActiveStore().then(() => router.refresh())
  }, [stale, router])

  if (stores.length < 2) return null

  const current = stores.find((store) => store.active) ?? stores[0]

  function choose(storeId: string) {
    if (storeId === current.id) return
    startTransition(async () => {
      const result = await switchActiveStore(storeId)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      router.push("/dashboard")
      router.refresh()
    })
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="h-9"
              tooltip={`Loja: ${current.name}`}
              disabled={pending}
            >
              <Store className="h-4 w-4 shrink-0" />
              <span className="truncate font-medium">{current.name}</span>
              <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-60" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-56">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Mudar de loja
            </DropdownMenuLabel>
            {stores.map((store) => (
              <DropdownMenuItem key={store.id} onSelect={() => choose(store.id)}>
                <span className="truncate">{store.name}</span>
                {store.id === current.id ? (
                  <Check className="ml-auto h-4 w-4" aria-label="Loja activa" />
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
