"use client"

import { useState } from "react"
import { useMutation, useQuery } from "@apollo/client/react"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { SettingsSubnav } from "@/components/layout/settings-subnav"
import { DataPanel, DataPanelContent } from "@/components/admin/data-panel"
import { FormField } from "@/components/admin/form-field"
import { PageHeader } from "@/components/admin/page-header"
import { Button } from "@/components/ui/button"
import { useConfirmDialog } from "@/components/ui/confirm-dialog"
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

type MaintenanceDraft = {
  enabled: boolean
  message: string
}

export default function MaintenanceSettingsPage() {
  const { data, loading, error, refetch } = useQuery<StoreMaintenanceQueryData>(
    GET_STORE_MAINTENANCE
  )
  const [updateMaintenance, { loading: saving }] =
    useMutation<StoreMaintenanceMutationData>(UPDATE_STORE_MAINTENANCE, {
      refetchQueries: [{ query: GET_STORE_MAINTENANCE }],
    })

  const [draft, setDraft] = useState<MaintenanceDraft | null>(null)
  const { confirm, confirmDialog } = useConfirmDialog()

  const row = data?.storeMaintenance
  const serverEnabled = Boolean(row?.enabled)
  const serverMessage = row?.message?.trim() ?? ""
  const enabled = draft?.enabled ?? serverEnabled
  const message = draft?.message ?? serverMessage
  const dirty = draft !== null

  async function handleSave() {
    if (enabled && !serverEnabled) {
      const confirmed = await confirm({
        title: "Activar manutenção?",
        description: "Está prestes a colocar a loja pública em modo manutenção.",
        impact: "Visitantes serão redireccionados para a página de manutenção até esta opção ser desactivada.",
        confirmText: "Activar manutenção",
        variant: "critical",
        requireText: "MANUTENCAO",
      })

      if (!confirmed) return
    }

    try {
      await updateMaintenance({
        variables: {
          enabled,
          message: message.trim() || null,
        },
      })
      setDraft(null)
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
          <DataPanel className="border-destructive/40 bg-destructive/5">
            <DataPanelContent className="p-4 text-sm text-destructive">
              Erro ao carregar: {error.message}
            </DataPanelContent>
          </DataPanel>
        ) : null}

        {loading ? (
          <DataPanel className="max-w-xl space-y-3 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-28 w-full" />
          </DataPanel>
        ) : (
          <div className="grid max-w-xl gap-4">
            <DataPanel>
              <DataPanelContent className="space-y-5 p-5">
                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-md border border-border/70 bg-muted/15 p-3 transition-colors hover:bg-muted/30">
                  <span className="space-y-0.5">
                    <span className="block text-sm font-medium text-foreground">Loja em manutenção</span>
                    <span className="block text-xs leading-relaxed text-muted-foreground">
                      Visitantes são redireccionados para a página de manutenção.
                    </span>
                  </span>
                  <input
                    id="maintenance-enabled"
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => {
                      setDraft({
                        enabled: e.target.checked,
                        message,
                      })
                    }}
                    className="sr-only"
                  />
                  <span
                    className={`relative h-5 w-9 shrink-0 rounded-full border transition-colors ${
                      enabled ? "border-primary bg-primary" : "border-border/80 bg-muted"
                    }`}
                  >
                    <span
                      className={`absolute left-0.5 top-0.5 h-3.5 w-3.5 rounded-full bg-background shadow-xs transition-transform ${
                        enabled ? "translate-x-4" : ""
                      }`}
                    />
                  </span>
                </label>

                <FormField
                  label="Mensagem"
                  htmlFor="maintenance-message"
                  description="Deixa vazio para usar a mensagem por defeito na loja."
                >
                  <Textarea
                    id="maintenance-message"
                    rows={4}
                    placeholder={DEFAULT_MESSAGE}
                    value={message}
                    onChange={(e) => {
                      setDraft({
                        enabled,
                        message: e.target.value,
                      })
                    }}
                    className="min-h-[88px] resize-y text-sm"
                  />
                </FormField>

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
              </DataPanelContent>
            </DataPanel>

            <DataPanel className="border-amber-200/80 bg-amber-50/50">
              <DataPanelContent className="space-y-3 p-5">
                <div className="flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-800 shrink-0 mt-0.5" aria-hidden />
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-amber-950">Validar antes de abrir</p>
                    <p className="text-xs text-amber-900/90 leading-relaxed">
                      Com a manutenção activa, acede a{" "}
                      <code className="rounded bg-amber-100/80 px-1 py-0.5 text-[11px]">
                        /_preview
                      </code>{" "}
                      na loja com a credencial definida em{" "}
                      <code className="rounded bg-amber-100/80 px-1 py-0.5 text-[11px]">
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
                        <code className="rounded bg-amber-100/80 px-1">NEXT_PUBLIC_TECHARENA_URL</code>{" "}
                        no backoffice para o link directo.
                      </p>
                    )}
                  </div>
                </div>
              </DataPanelContent>
            </DataPanel>

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
      {confirmDialog}
    </>
  )
}
