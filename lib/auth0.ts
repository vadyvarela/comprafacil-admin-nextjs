import { Auth0Client } from "@auth0/nextjs-auth0/server";

/**
 * Auth0: autenticação, e só.
 *
 * O `beforeSessionSaved` costumava extrair as roles do claim
 * `https://Kumprafacil.com/roles` — chegando a descodificar o ID token à mão
 * quando o claim não vinha — e guardá-las na sessão. Era daí que saíam as
 * permissões do backoffice inteiro.
 *
 * Deixou de ser preciso: quem tem que cargo em que loja é uma tabela da API, e
 * as permissões chegam resolvidas por `/api/me`. O que interessa desta sessão
 * é o access token, que é o que se reencaminha para a API provar quem somos.
 *
 * A Post-Login Action que injecta o claim pode ser removida do Auth0 — mas só
 * depois de os membros actuais estarem importados para `memberships`.
 */
export const auth0 = new Auth0Client({
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  appBaseUrl: process.env.APP_BASE_URL,
  secret: process.env.AUTH0_SECRET,
  authorizationParameters: {
    scope: "openid profile email",
    // Identificador da API no Auth0. Sem ele o access token não serve para
    // falar com a API — e é esse token que carrega a identidade.
    audience: process.env.AUTH0_AUDIENCE,
  },
  signInReturnToPath: "/dashboard",
});

/** Margem para o token não expirar a meio de um pedido já começado. */
const EXPIRY_BUFFER_SECONDS = 60;

export type ValidSession = NonNullable<
  Awaited<ReturnType<typeof auth0.getSession>>
>;

export async function getValidSession(): Promise<ValidSession | null> {
  const session = await auth0.getSession();
  if (!session?.user?.sub || !session?.tokenSet) return null;
  const expiresAt = session.tokenSet.expiresAt;
  if (typeof expiresAt !== "number") return null;
  const now = Math.floor(Date.now() / 1000);
  if (expiresAt <= now + EXPIRY_BUFFER_SECONDS) return null;
  return session;
}
