"use client"

import { Banner } from "@/lib/graphql/banners/types"
import { BannerFormModal } from "./banner-form-modal"

type EditBannerModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  banner: Banner
}

export function EditBannerModal({
  open,
  onOpenChange,
  banner,
}: EditBannerModalProps) {
  return (
    <BannerFormModal open={open} onOpenChange={onOpenChange} banner={banner} />
  )
}
