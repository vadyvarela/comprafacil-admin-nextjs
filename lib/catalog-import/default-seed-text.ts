import seed from "../../data/catalog-seed.json"

/** Texto JSON formatado do catálogo exemplo (repo `data/catalog-seed.json`). */
export function getDefaultCatalogSeedText(): string {
  return JSON.stringify(seed as object, null, 2)
}
