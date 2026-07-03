"use client"

import { useState } from "react"
import { useMutation, useQuery } from "@apollo/client/react"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { SettingsSubnav } from "@/components/layout/settings-subnav"
import { PageHeader } from "@/components/admin/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { GET_TELEGRAM_NOTIFICATION_SETTINGS } from "@/lib/graphql/telegram-notifications/queries"
import { UPDATE_TELEGRAM_NOTIFICATION_SETTINGS } from "@/lib/graphql/telegram-notifications/mutations"
import type {
  TelegramNotificationSettingsGql,
  TelegramNotificationSettingsMutationData,
  TelegramNotificationSettingsQueryData,
} from "@/lib/graphql/telegram-notifications/types"
import { Bell, Eye, EyeOff, Info, Loader2 } from "lucide-react"
import { toast } from "sonner"

const TOKEN_UNCHANGED = "__UNCHANGED__"

type TelegramDraft = {
  botToken: string
  chatIdsText: string
}

function chatIdsToText(chatIds: string[]): string {
  return chatIds.join("\n")
}

function textToChatIds(text: string): string[] {
  return text
    .split(/[\n,;]+/)
    .map((id) => id.trim())
    .filter(Boolean)
}

function rowToDraft(row: TelegramNotificationSettingsGql): TelegramDraft {
  return {
    botToken: row.botTokenConfigured ? TOKEN_UNCHANGED : "",
    chatIdsText: chatIdsToText(row.chatIds ?? []),
  }
}

export default function NotificationsSettingsPage() {
  const { data, loading, error, refetch } = useQuery<TelegramNotificationSettingsQueryData>(
    GET_TELEGRAM_NOTIFICATION_SETTINGS
  )
  const [updateSettings, { loading: saving }] =
    useMutation<TelegramNotificationSettingsMutationData>(UPDATE_TELEGRAM_NOTIFICATION_SETTINGS, {
      refetchQueries: [{ query: GET_TELEGRAM_NOTIFICATION_SETTINGS }],
    })

  const [draft, setDraft] = useState<TelegramDraft | null>(null)
  const [showToken, setShowToken] = useState(false)

  const row = data?.telegramNotificationSettings
  const serverDraft = row ? rowToDraft(row) : null
  const values = draft ?? serverDraft ?? { botToken: "", chatIdsText: "" }
  const dirty = draft !== null
  const tokenConfigured = Boolean(row?.botTokenConfigured)
  const enabled = Boolean(row?.enabled)

  async function handleSave() {
    const chatIds = textToChatIds(values.chatIdsText)
    const variables: { chatIds: string[]; botToken?: string | null } = { chatIds }

    if (values.botToken === TOKEN_UNCHANGED) {
      // não envia botToken — mantém o existente
    } else if (values.botToken.trim() === "") {
      variables.botToken = ""
    } else {
      variables.botToken = values.botToken.trim()
    }

    try {
      await updateSettings({ variables })
      setDraft(null)
      setShowToken(false)
      toast.success("Notificações Telegram guardadas", {
        description:
          chatIds.length > 0 && (tokenConfigured || variables.botToken)
            ? "Alertas de compra activos."
            : "Configuração incompleta — alertas desactivados.",
      })
      await refetch()
    } catch (e) {
      toast.error("Não foi possível guardar", {
        description: e instanceof Error ? e.message : "Erro desconhecido",
      })
    }
  }

  return (
    <>
      <DashboardHeader
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Definições", href: "/dashboard/settings" },
          { label: "Notificações" },
        ]}
      />
      <SettingsSubnav />
      <div className="flex flex-1 flex-col gap-5 p-4 md:p-5 bg-background">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <PageHeader
            title="Notificações Telegram"
            description="Alertas internos quando uma compra é concluída com sucesso."
          />
          {!loading && row ? (
            <Badge
              variant={enabled ? "default" : "secondary"}
              className="text-[11px] font-medium"
            >
              {enabled ? "Activo" : "Inactivo"}
            </Badge>
          ) : null}
        </div>

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
            <Card className="border-border/80">
              <CardContent className="pt-5 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="telegram-bot-token" className="text-sm font-medium">
                    Token do bot
                  </Label>
                  <div className="relative">
                    <Input
                      id="telegram-bot-token"
                      type={showToken ? "text" : "password"}
                      autoComplete="off"
                      spellCheck={false}
                      placeholder={
                        tokenConfigured
                          ? `${row?.botTokenMasked ?? "••••"} — deixa em branco para remover`
                          : "123456789:AAH…"
                      }
                      value={values.botToken === TOKEN_UNCHANGED ? "" : values.botToken}
                      onChange={(e) => {
                        setDraft({
                          botToken: e.target.value,
                          chatIdsText: values.chatIdsText,
                        })
                      }}
                      className="pr-10 font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                      aria-label={showToken ? "Ocultar token" : "Mostrar token"}
                    >
                      {showToken ? (
                        <EyeOff className="h-4 w-4" aria-hidden />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Obtém o token em{" "}
                    <a
                      href="https://t.me/BotFather"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      @BotFather
                    </a>{" "}
                    com <code className="text-[10px] bg-muted px-1 rounded">/newbot</code>.
                    {tokenConfigured ? (
                      <>
                        {" "}
                        <button
                          type="button"
                          className="text-primary hover:underline"
                          onClick={() =>
                            setDraft({
                              botToken: "",
                              chatIdsText: values.chatIdsText,
                            })
                          }
                        >
                          Remover token actual
                        </button>
                      </>
                    ) : null}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telegram-chat-ids" className="text-sm font-medium">
                    Chat IDs
                  </Label>
                  <Textarea
                    id="telegram-chat-ids"
                    rows={4}
                    placeholder={"-1001234567890\n987654321"}
                    value={values.chatIdsText}
                    onChange={(e) => {
                      setDraft({
                        botToken: values.botToken,
                        chatIdsText: e.target.value,
                      })
                    }}
                    className="text-xs font-mono resize-y min-h-[96px]"
                  />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Um ID por linha (ou separados por vírgula). Grupos usam IDs negativos. Para
                    descobrir o teu ID, envia qualquer mensagem ao bot e abre{" "}
                    <code className="text-[10px] bg-muted px-1 rounded">
                      api.telegram.org/bot&lt;TOKEN&gt;/getUpdates
                    </code>
                    .
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

            <Card className="border-sky-200/70 bg-sky-50/40">
              <CardContent className="pt-5">
                <div className="flex gap-2">
                  <Info className="h-4 w-4 text-sky-800 shrink-0 mt-0.5" aria-hidden />
                  <div className="space-y-2 text-sm text-sky-950">
                    <p className="font-medium">Como funciona</p>
                    <ul className="text-xs leading-relaxed space-y-1.5 list-disc pl-4 text-sky-900/90">
                      <li>
                        <strong>Token</strong> — credencial do bot que envia as mensagens.
                      </li>
                      <li>
                        <strong>Chat ID</strong> — destino (teu utilizador, grupo ou canal) que
                        recebe o alerta de cada compra paga.
                      </li>
                      <li>
                        Fica activo quando existem token e pelo menos um chat ID válido.
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {enabled ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Bell className="h-3.5 w-3.5" aria-hidden />
                Telegram configurado
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
