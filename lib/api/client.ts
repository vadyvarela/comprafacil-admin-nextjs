import "server-only";
import { getValidSession } from "@/lib/auth0";

/**
 * Cliente da API, com a identidade do utilizador por cima.
 *
 * A diferença face ao `runGraphQL` de sempre é quem faz o pedido. Até aqui o
 * backoffice inteiro falava com a API através de um único token `ADMIN`
 * partilhado, o que tornava os 5 roles decorativos: quem chegasse à API por
 * outra via tinha exactamente os mesmos poderes que o proprietário.
 *
 * Agora reencaminha-se o access token da pessoa. A API valida-o por JWKS,
 * resolve o membership e decide — e uma falha aqui deixa de ser escalada de
 * privilégio, porque a decisão já não é nossa.
 */

const API_BASE_URL =
  process.env.API_BASE_URL ?? process.env.GTW_URL ?? "http://localhost:8081";

/** Token de serviço, para o que corre sem pessoa (cron, revalidação). */
const SERVICE_TOKEN = process.env.CMS_ACCESS_TOKEN;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiFetchOptions = RequestInit & {
  /** Loja em cujo âmbito o pedido corre. Omitir usa a loja activa da sessão. */
  storeId?: string;
  /**
   * Usa o token de serviço em vez da identidade de quem está autenticado.
   * Só para trabalho sem pessoa por trás — nunca para servir um pedido do
   * browser, onde perder a identidade é perder a autorização.
   */
  asService?: boolean;
};

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { storeId, asService, headers, ...init } = options;

  const authorization = asService
    ? SERVICE_TOKEN && `Bearer ${SERVICE_TOKEN}`
    : await bearerFromSession();

  if (!authorization) {
    throw new ApiError(401, "Sessão inválida ou expirada.");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: authorization,
      ...(storeId ? { "X-Store-Id": storeId } : {}),
      ...headers,
    },
    cache: "no-store",
    signal: init.signal ?? AbortSignal.timeout(30_000),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const body = (await response.json().catch(() => null)) as
    | { error?: string; message?: string; data?: T }
    | null;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      body?.message ?? body?.error ?? `A API respondeu ${response.status}.`,
    );
  }

  // A API embrulha respostas REST em { success, data }; o /api/me não.
  return (body && "data" in body ? body.data : body) as T;
}

async function bearerFromSession(): Promise<string | null> {
  const session = await getValidSession();
  const accessToken = session?.tokenSet?.accessToken;
  return accessToken ? `Bearer ${accessToken}` : null;
}
