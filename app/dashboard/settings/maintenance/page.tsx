"use client"

import { useEffect, useState } from "react"
import { useMutation, useQuery } from "@apollo/client/react"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { SettingsSubnav } from "@/components/layout/settings-subnav"
import { PageHeader } from "@/components/admin/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { GET_STORE_MAINTENANCE } from "@/lib/graphql/store-maintenance/queries"
import { UPDATE_STORE_MAINTENANCE } from "@/lib/graphql/store-maintenance/mutations"
import type {
  StoreMaintenanceMutationData,
  StoreMaintenanceQueryData,
} from "@/lib/graphql/store-maintenance/types"
import { AlertTriangle, Construction, ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"

const DEFAULT_MESSAGE =
  "Estamos a melhorar a loja. Voltamos em breve — obrigado pela paciência."

export default function MaintenanceSettingsPage() {
  const { data, loading, error, refetch } = useQuery<StoreMaintenanceQueryData>(
    GET_STORE_MAINTENANCE
  )
  const [updateMaintenance, { loading: saving }] =
    useMutation<StoreMaintenanceMutationData>(UPDATE_STORE_MAINTENANCE, {
      refetchQueries: [{ query: GET_STORE_MAINTENANCE }],
    })

  const [enabled, setEnabled] = useState(false)
  const [message, setMessage] = useState("")
  const [dirty, setDirty] = useState(false)

  const row = data?.storeMaintenance

  useEffect(() => {
    if (!row || dirty) return
    setEnabled(Boolean(row.enabled))
    setMessage(row.message?.trim() ?? "")
  }, [row, dirty])

  async function handleSave() {
    try {
      await updateMaintenance({
        variables: {
          enabled,
          message: message.trim() || null,
        },
      })
      setDirty(false)
      toast.success("Manutenção actualizada", {
        description: enabled
          ? "A loja pública está em manutenção."
          : "A loja pública está aberta.",
      })
      await refetch()
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao guardar"
      toast.error("Não foi possível guardar", { description: msg })
    }
  }

  const storeUrl =
    process.env.NEXT_PUBLIC_TECHARENA_URL?.trim() ||
    process.env.NEXT_PUBLIC_STORE_URL?.trim() ||
    ""

  return (
    <>
      <DashboardHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Definições", href: "/dashboard/settings" },
          { label: "Manutenção" },
        ]}
      />
      <SettingsSubnav />
      <div className="flex flex-1 flex-col gap-5 p-4 md:p-5 bg-background">
        <PageHeader
          title="Manutenção da loja"
          description="Controla o acesso à loja pública (techarena). Checkout e APIs não são afectados."
        />

        {error ? (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="py-4 text-sm text-destructive">
              Erro ao carregar: {error.message}
            </CardContent>
          </Card>
        ) : null}

        {loading ? (
          <div className="space-y-3 max-w-xl">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : (
          <div className="grid gap-4 max-w-xl">
            <Card>
              <CardContent className="pt-5 space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="maintenance-enabled" className="text-sm font-medium">
                      Loja em manutenção
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Visitantes são redireccionados para a página de manutenção.
                    </p>
                  </div>
                  <input
                    id="maintenance-enabled"
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => {
                      setEnabled(e.target.checked)
                      setDirty(true)
                    }}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maintenance-message" className="text-sm font-medium">
                    Mensagem
                  </Label>
                  <Textarea
                    id="maintenance-message"
                    rows={4}
                    placeholder={DEFAULT_MESSAGE}
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value)
                      setDirty(true)
                    }}
                    className="text-sm resize-y min-h-[88px]"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Deixa vazio para usar a mensagem por defeito na loja.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !dirty}
                  className="w-full sm:w-auto"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden />
                  ) : null}
                  Guardar
                </Button>
              </CardContent>
            </Card>

            <Card className="border-amber-200/80 bg-amber-50/50">
              <CardContent className="pt-5 space-y-3">
                <div className="flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-800 shrink-0 mt-0.5" aria-hidden />
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-amber-950">Validar antes de abrir</p>
                    <p className="text-xs text-amber-900/90 leading-relaxed">
                      Com a manutenção activa, acede a{" "}
                      <code className="text-[11px] bg-amber-100/80 px-1 py-0.5 rounded">
                        /_preview
                      </code>{" "}
                      na loja com a credencial definida em{" "}
                      <code className="text-[11px] bg-amber-100/80 px-1 py-0.5 rounded">
                        TECHARENA_MAINTENANCE_PREVIEW_SECRET
                      </code>{" "}
                      (env do servidor techarena).
                    </p>
                    {storeUrl ? (
                      <a
                        href={`${storeUrl.replace(/\/$/, "")}/_preview`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-amber-950 hover:underline"
                      >
                        Abrir pré-visualização
                        <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
                    ) : (
                      <p className="text-[11px] text-amber-900/80">
                        Define{" "}
                        <code className="bg-amber-100/80 px-1 rounded">NEXT_PUBLIC_TECHARENA_URL</code>{" "}
                        no backoffice para o link directo.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {enabled ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Construction className="h-3.5 w-3.5" aria-hidden />
                Manutenção activa
                {row?.updatedAt ? (
                  <span>· actualizado {new Date(row.updatedAt).toLocaleString("pt-PT")}</span>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </>
  )
}
