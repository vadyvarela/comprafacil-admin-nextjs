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

/** Lê a URL da imagem de hover no card da loja. */
export function parseHoverImageUrl(metadataJson?: string | null): string | null {
  if (!metadataJson) return null
  try {
    const meta = JSON.parse(metadataJson) as { hoverImageUrl?: unknown }
    const url = typeof meta.hoverImageUrl === "string" ? meta.hoverImageUrl.trim() : ""
    return url || null
  } catch {
    return null
  }
}

function parseMetadataBase(metadataJson?: string | null): Record<string, unknown> {
  if (!metadataJson) return {}
  try {
    return JSON.parse(metadataJson) as Record<string, unknown>
  } catch {
    return {}
  }
}

/** Atualiza metadata JSON com array `images` (galeria completa). */
export function metadataWithGallery(
  metadataJson: string | null | undefined,
  galleryUrls: string[],
  hoverImageUrl?: string | null,
): string {
  const base = parseMetadataBase(metadataJson)

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

  const cover = clean[0] ?? null
  const explicitHover =
    hoverImageUrl !== undefined
      ? hoverImageUrl?.trim() || null
      : parseHoverImageUrl(JSON.stringify(base))

  if (explicitHover && clean.includes(explicitHover) && explicitHover !== cover) {
    base.hoverImageUrl = explicitHover
  } else {
    delete base.hoverImageUrl
  }

  return JSON.stringify(base)
}

/** Define ou remove `hoverImageUrl` no metadata. */
export function metadataWithHoverImage(
  metadataJson: string | null | undefined,
  url: string | null,
): string {
  const base = parseMetadataBase(metadataJson)
  const trimmed = url?.trim() || null
  if (trimmed) {
    base.hoverImageUrl = trimmed
  } else {
    delete base.hoverImageUrl
  }
  return JSON.stringify(base)
}
