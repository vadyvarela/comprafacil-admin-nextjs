"use client"

import { BannerFormModal } from "./banner-form-modal"

type CreateBannerModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateBannerModal({ open, onOpenChange }: CreateBannerModalProps) {
  return <BannerFormModal open={open} onOpenChange={onOpenChange} />
}
