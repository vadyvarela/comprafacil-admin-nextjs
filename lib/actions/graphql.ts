import "server-only"
import { print, type DocumentNode } from "graphql"

const GTW_URL = process.env.GTW_URL
const GTW_TOKEN = process.env.GTW_TOKEN
const CMS_ACCESS_TOKEN = process.env.CMS_ACCESS_TOKEN

function getConfig() {
  if (!GTW_URL || !GTW_TOKEN || !CMS_ACCESS_TOKEN) {
    throw new Error("Payment gateway configuration missing (GTW_URL, GTW_TOKEN, CMS_ACCESS_TOKEN)")
  }
  return {
    url: `${GTW_URL}/${GTW_TOKEN}`,
    token: CMS_ACCESS_TOKEN,
  }
}

export type GraphQLResponse<T> =
  | { data: T; errors?: never }
  | { data?: never; errors: { message: string }[] }

/**
 * Executa uma operação GraphQL no gateway (server-only).
 * Use em Server Components ou Server Actions.
 */
export async function runGraphQL<T = unknown>(
  document: DocumentNode | string,
  variables?: Record<string, unknown>
): Promise<GraphQLResponse<T>> {
  const { url, token } = getConfig()
  const query = typeof document === "string" ? document : print(document)

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(30000),
  })

  const json = (await res.json()) as { data?: T; errors?: { message: string }[] }

  if (json.errors?.length) {
    return { errors: json.errors }
  }

  return { data: json.data as T }
}
