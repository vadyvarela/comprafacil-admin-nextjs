import "server-only"
import { print, type DocumentNode } from "graphql"
import { getValidSession } from "@/lib/auth0"

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

type RunGraphQLOptions = {
  /**
   * Reencaminha o access token de quem está autenticado em vez do token de
   * serviço. Obrigatório onde a API precisa de saber *quem* fez a coisa — com
   * o token de serviço, a auditoria só consegue gravar "master token (legado)".
   */
  asUser?: boolean
}

/**
 * Executa uma operação GraphQL no gateway (server-only).
 * Use em Server Components ou Server Actions.
 */
export async function runGraphQL<T = unknown>(
  document: DocumentNode | string,
  variables?: Record<string, unknown>,
  options: RunGraphQLOptions = {}
): Promise<GraphQLResponse<T>> {
  const config = getConfig()
  const url = config.url
  let token = config.token
  if (options.asUser) {
    const session = await getValidSession()
    const accessToken = session?.tokenSet?.accessToken
    if (!accessToken) {
      return { errors: [{ message: "Sessão inválida ou expirada." }] }
    }
    token = accessToken
  }
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
