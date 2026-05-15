/** Extrai URLs de galeria (sem duplicados, ordem preservada). */
export function parseProductGalleryUrls(
  primaryImage?: string | null,
  metadataJson?: string | null,
): string[] {
  const seen = new Set<string>()
  const out: string[] = []

  const add = (url?: string | null) => {
    const u = url?.trim()
    if (!u || seen.has(u)) return
    seen.add(u)
    out.push(u)
  }

  add(primaryImage)

  if (metadataJson) {
    try {
      const meta = JSON.parse(metadataJson) as { images?: unknown }
      if (Array.isArray(meta.images)) {
        for (const item of meta.images) {
          if (typeof item === "string") add(item)
        }
      }
    } catch {
      /* ignore */
    }
  }

  return out
}

/** Atualiza metadata JSON com array `images` (galeria completa). */
export function metadataWithGallery(
  metadataJson: string | null | undefined,
  galleryUrls: string[],
): string {
  let base: Record<string, unknown> = {}
  if (metadataJson) {
    try {
      base = JSON.parse(metadataJson) as Record<string, unknown>
    } catch {
      base = {}
    }
  }

  const seen = new Set<string>()
  const clean: string[] = []
  for (const url of galleryUrls) {
    const u = url?.trim()
    if (u && !seen.has(u)) {
      seen.add(u)
      clean.push(u)
    }
  }
  if (clean.length > 0) {
    base.images = clean
  } else {
    delete base.images
  }

  return JSON.stringify(base)
}
