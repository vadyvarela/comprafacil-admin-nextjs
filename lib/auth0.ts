import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { ROLE_CLAIM } from "@/lib/auth/config";

const domain =
  process.env.AUTH0_ISSUER_BASE_URL?.replace(/^https?:\/\//, "").replace(/\/$/, "") ??
  process.env.AUTH0_DOMAIN;

const audience = process.env.AUTH0_AUDIENCE;

export const auth0 = new Auth0Client({
  domain,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  secret: process.env.AUTH0_SECRET,
  appBaseUrl: process.env.AUTH0_BASE_URL,
  /** Para que event.authorization.roles venha preenchido no Auth0, pedir audience de uma API com RBAC. Ver docs/ROLES-AUTH0.md. */
  ...(audience ? { authorizationParameters: { audience } } : {}),
  /** Rotas de auth: primeira página do admin é login. */
  routes: {
    callback: "/api/auth/callback",
    login: "/api/auth/login",
    logout: "/api/auth/logout",
  },
  /** Após login bem-sucedido, redirecionar para o dashboard. */
  signInReturnToPath: "/dashboard",
  /**
   * O SDK filtra custom claims do ID token por defeito; sem este hook as roles
   * não chegam a session.user. Também lemos do payload do JWT (fallback) caso
   * o claim venha no token mas não em session.user.
   */
  async beforeSessionSaved(session, idToken) {
    if (!session?.user) return session;

    let roles =
      (session.user[ROLE_CLAIM] as string[] | undefined) ??
      (session.user.app_metadata as { roles?: string[] } | undefined)?.roles;

    if (!Array.isArray(roles) && idToken) {
      try {
        const payload = JSON.parse(
          Buffer.from(idToken.split(".")[1], "base64url").toString("utf8")
        ) as Record<string, unknown>;
        const fromToken = payload[ROLE_CLAIM];
        if (Array.isArray(fromToken)) roles = fromToken;
      } catch {
        // ignorar se o token não for JWT válido
      }
    }

    return {
      ...session,
      user: {
        ...session.user,
        ...(Array.isArray(roles) && roles.length > 0 ? { [ROLE_CLAIM]: roles } : {}),
      },
    };
  },
});
