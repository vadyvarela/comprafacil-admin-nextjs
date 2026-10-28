"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  BadgeCheck,
  Check,
  CornerDownRight,
  Loader2,
  MessageSquareReply,
  Package,
  Star,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  deleteProductReview,
  moderateProductReview,
  replyProductReview,
} from "@/lib/actions/reviews"
import type { AdminProductReview, ReviewModerationStatus } from "@/lib/graphql/reviews/types"
import { cn } from "@/lib/utils"

const STATUS_STYLE: Record<ReviewModerationStatus, string> = {
  PENDING: "border-warning-border bg-warning-soft text-warning-strong",
  APPROVED: "border-success-border bg-success-soft text-success-strong",
  REJECTED: "border-danger-border bg-danger-soft text-danger-strong",
}

function formatDate(value: string | null) {
  if (!value) return ""
  return new Date(value).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          aria-hidden
          className={cn(
            "h-3.5 w-3.5",
            i <= rating ? "fill-warning text-warning" : "fill-muted text-muted"
          )}
        />
      ))}
    </span>
  )
}

type Props = {
  review: AdminProductReview
  canModerate: boolean
}

export function ReviewCard({ review, canModerate }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busy, setBusy] = useState<string | null>(null)
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyDraft, setReplyDraft] = useState(review.replyText ?? "")
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const { confirm, confirmDialog } = useConfirmDialog()

  const status = review.moderationStatus.code

  async function run(key: string, action: () => Promise<{ ok: boolean; error?: string }>, done: string) {
    setBusy(key)
    try {
      const result = await action()
      if (!result.ok) {
        toast.error(result.error ?? "Não foi possível guardar.")
        return false
      }
      toast.success(done)
      startTransition(() => router.refresh())
      return true
    } finally {
      setBusy(null)
    }
  }

  async function approve() {
    await run("approve", () => moderateProductReview(review.id, "APPROVED"), "Avaliação aprovada e publicada.")
  }

  async function reject() {
    const ok = await run(
      "reject",
      () => moderateProductReview(review.id, "REJECTED", rejectReason),
      "Avaliação rejeitada."
    )
    if (ok) {
      setRejectOpen(false)
      setRejectReason("")
    }
  }

  async function saveReply() {
    const ok = await run(
      "reply",
      () => replyProductReview(review.id, replyDraft),
      replyDraft.trim() ? "Resposta publicada." : "Resposta removida."
    )
    if (ok) setReplyOpen(false)
  }

  async function remove() {
    const confirmed = await confirm({
      title: "Apagar avaliação?",
      description: "A avaliação deixa de aparecer aqui e na loja.",
      impact: "A média de estrelas do produto é recalculada. Prefira rejeitar se só quer escondê-la.",
      confirmText: "Apagar",
      variant: "destructive",
    })
    if (!confirmed) return
    await run("delete", () => deleteProductReview(review.id), "Avaliação apagada.")
  }

  const disabled = busy !== null || pending

  return (
    <article className="rounded-lg border border-border/80 bg-card p-4 shadow-xs">
      <div className="flex flex-col gap-4 md:flex-row">
        <Link
          href={review.product ? `/dashboard/products/${review.product.id}` : "#"}
          className="flex shrink-0 items-center gap-3 md:w-56 md:flex-col md:items-start"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/70 bg-muted/40">
            {review.product?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={review.product.image} alt="" className="h-full w-full object-cover" />
            ) : (
              <Package className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <p className="line-clamp-2 text-xs font-semibold text-foreground hover:underline">
            {review.product?.title ?? "Produto removido"}
          </p>
        </Link>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Stars rating={review.rating} />
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                STATUS_STYLE[status]
              )}
            >
              {review.moderationStatus.description}
            </span>
            {review.verifiedPurchase ? (
              <span className="flex items-center gap-1 text-[11px] font-medium text-success-strong">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                Compra verificada
              </span>
            ) : null}
            <span className="text-[11px] text-muted-foreground">{formatDate(review.createdAt)}</span>
          </div>

          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{review.authorFullName}</span>
            {review.authorEmail ? <> · {review.authorEmail}</> : null}
            <span className="ml-1">(na loja aparece como “{review.authorName}”)</span>
          </p>

          {review.title ? <p className="text-sm font-semibold text-foreground">{review.title}</p> : null}
          {review.comment ? (
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">{review.comment}</p>
          ) : (
            <p className="text-xs italic text-muted-foreground">Só estrelas, sem comentário.</p>
          )}

          {review.images.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {review.images.map((image) => (
                <a
                  key={image.id}
                  href={image.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block h-20 w-20 overflow-hidden rounded-md border border-border/70 bg-muted/40 hover:opacity-90"
                  title="Abrir foto"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.url} alt="Foto do cliente" className="h-full w-full object-cover" />
                </a>
              ))}
            </div>
          ) : null}

          {status === "REJECTED" && review.rejectionReason ? (
            <p className="text-xs text-destructive">Motivo da rejeição: {review.rejectionReason}</p>
          ) : null}
          {review.moderatedBy && status !== "PENDING" ? (
            <p className="text-[11px] text-muted-foreground">
              {status === "APPROVED" ? "Aprovada" : "Rejeitada"} por {review.moderatedBy} em{" "}
              {formatDate(review.moderatedAt)}
            </p>
          ) : null}

          {review.replyText && !replyOpen ? (
            <div className="mt-2 flex gap-2 rounded-md border border-border/70 bg-muted/30 p-3">
              <CornerDownRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-foreground">Resposta da loja</p>
                <p className="whitespace-pre-line text-xs leading-relaxed text-foreground/90">
                  {review.replyText}
                </p>
              </div>
            </div>
          ) : null}

          {replyOpen ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={replyDraft}
                onChange={(e) => setReplyDraft(e.target.value)}
                placeholder="Obrigado pela avaliação! …"
                maxLength={2000}
                aria-label="Resposta pública da loja"
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground">
                A resposta é pública e aparece por baixo da avaliação na loja.
              </p>
              <div className="flex gap-2">
                <Button size="sm" className="h-8 text-xs" onClick={saveReply} disabled={disabled}>
                  {busy === "reply" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  Publicar resposta
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs"
                  onClick={() => {
                    setReplyDraft(review.replyText ?? "")
                    setReplyOpen(false)
                  }}
                  disabled={disabled}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        {canModerate ? (
          <div className="flex shrink-0 flex-row flex-wrap gap-2 md:w-36 md:flex-col">
            {status !== "APPROVED" ? (
              <Button size="sm" className="h-8 justify-start text-xs" onClick={approve} disabled={disabled}>
                {busy === "approve" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Aprovar
              </Button>
            ) : null}
            {status !== "REJECTED" ? (
              <Button
                size="sm"
                variant="outline"
                className="h-8 justify-start text-xs"
                onClick={() => setRejectOpen(true)}
                disabled={disabled}
              >
                <X className="h-3.5 w-3.5" />
                {status === "APPROVED" ? "Despublicar" : "Rejeitar"}
              </Button>
            ) : null}
            {!replyOpen ? (
              <Button
                size="sm"
                variant="outline"
                className="h-8 justify-start text-xs"
                onClick={() => setReplyOpen(true)}
                disabled={disabled}
              >
                <MessageSquareReply className="h-3.5 w-3.5" />
                {review.replyText ? "Editar resposta" : "Responder"}
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="ghost"
              className="h-8 justify-start text-xs text-destructive hover:text-destructive"
              onClick={remove}
              disabled={disabled}
            >
              {busy === "delete" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Apagar
            </Button>
          </div>
        ) : null}
      </div>

      <Dialog open={rejectOpen} onOpenChange={(open) => !disabled && setRejectOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{status === "APPROVED" ? "Despublicar avaliação?" : "Rejeitar avaliação?"}</DialogTitle>
            <DialogDescription>
              A avaliação não aparece na loja. O cliente não é avisado.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Motivo (opcional, só a equipa vê): spam, linguagem ofensiva, fala de outro produto…"
            maxLength={300}
            aria-label="Motivo da rejeição"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectOpen(false)} disabled={disabled}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={reject} disabled={disabled}>
              {busy === "reject" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {status === "APPROVED" ? "Despublicar" : "Rejeitar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {confirmDialog}
    </article>
  )
}
