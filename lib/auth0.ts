import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { ROLE_CLAIM } from "@/lib/auth/config";

export const auth0 = new Auth0Client({
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  appBaseUrl: process.env.APP_BASE_URL,
  secret: process.env.AUTH0_SECRET,
  authorizationParameters: {
    scope: "openid profile email read:shows",
    audience: process.env.AUTH0_AUDIENCE,
  },
  signInReturnToPath: "/dashboard",
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
