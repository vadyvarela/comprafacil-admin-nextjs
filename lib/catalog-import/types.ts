export interface CatalogSeedVariant {
  /**
   * Obrigatório se não existir «attributes».
   * Se existir «attributes», pode omitir-se; o título da variante no GTW será o join dos valores.
   */
  title?: string
  price: number
  quantity: number
  sku?: string
  /** Dimensões da variante (ex.: { "Cor": "Azul", "Capacidade": "128GB" }). Se omitido, usa-se «variantOptionTitle» + «title». */
  attributes?: Record<string, string>
}

export interface CatalogSeedProduct {
  title: string
  summary?: string | null
  condition: string
  categorySlug?: string
  brandSlug?: string
  /** Alternativas aceites na importação: «category», «categoria», ou objeto { slug, name }. */
  category?: string | { slug?: string; name?: string }
  brand?: string | { slug?: string; name?: string }
  categoryName?: string
  brandName?: string
  discount?: number | null
  sku?: string
  /**
   * Nome do eixo único quando cada variante só tem «title» (ex.: "Armazenamento", "Configuração").
   * Por omissão: "Modelo".
   */
  variantOptionTitle?: string
  variants: CatalogSeedVariant[]
}

export interface CatalogSeedFile {
  meta?: unknown
  products: CatalogSeedProduct[]
}

export interface CatalogImportRowIssue {
  productIndex: number
  title: string
  messages: string[]
}

export interface CatalogResolvedIds {
  categoryId: string | null
  brandId: string | null
  categoryHint: string
  brandHint: string
}
