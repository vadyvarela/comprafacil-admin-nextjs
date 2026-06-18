import "server-only"

import { cache } from "react"
import { runGraphQL } from "@/lib/actions/graphql"
import {
  DEFAULT_STORE_BRAND,
  normalizeStoreBrand,
  type StoreBrandSummary,
} from "@/lib/store-brand"

const GET_STORE_BRAND = `
  query GetStoreBrand {
    storeSettings {
      siteName
      logoUrl
      faviconUrl
    }
  }
`

type StoreBrandQueryData = {
  storeSettings: {
    siteName?: string | null
    logoUrl?: string | null
    faviconUrl?: string | null
  } | null
}

export const getStoreBrand = cache(async (): Promise<StoreBrandSummary> => {
  try {
    const result = await runGraphQL<StoreBrandQueryData>(GET_STORE_BRAND)

    if (result.errors?.length) {
      console.error("getStoreBrand GraphQL errors:", result.errors.map((e) => e.message).join("; "))
      return DEFAULT_STORE_BRAND
    }

    return normalizeStoreBrand(result.data?.storeSettings)
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown"
    console.error("getStoreBrand failed:", message)
    return DEFAULT_STORE_BRAND
  }
})
