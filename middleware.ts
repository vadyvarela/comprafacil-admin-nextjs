import type { NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";

/**
 * Middleware Auth0: trata login, logout, callback e renovação de sessão.
 * A proteção por role (admin) é feita no layout do dashboard (server-side).
 */
export async function middleware(request: NextRequest) {
  return await auth0.middleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
