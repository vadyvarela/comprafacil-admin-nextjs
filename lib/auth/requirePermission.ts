import "server-only";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { getValidSession } from "@/lib/auth0";
import type { Permission } from "@/lib/auth/permissions";
import { can, getPrincipal, type Principal } from "@/lib/auth/principal";

/**
 * Guards de permissão.
 *
 * Substituem os sete de `requireRole.ts` mais os dois de `requirePageAccess.ts`
 * — que existiam porque cada um combinava sessão, acesso à loja e um par
 * módulo/modo de maneira ligeiramente diferente. Com permissões nomeadas, é
 * tudo a mesma pergunta.
 *
 * Isto é a segunda linha, não a primeira: quem decide é a API, que valida o
 * token do utilizador e nega por omissão. Aqui evita-se renderizar um ecrã que
 * ia rebentar à primeira chamada, e evita-se mostrar botões que não fazem nada.
 */

/**
 * Não ter sessão e não ter acesso são coisas diferentes.
 *
 * Mandar as duas para o login faz um ciclo infinito para quem está autenticado
 * mas ainda não é membro de nenhuma loja — que é exactamente a situação de
 * alguém no primeiro acesso, ou de quem foi removido da equipa. Essa pessoa
 * merece uma frase, não um redirect que se repete.
 */
async function exigirPrincipal(): Promise<Principal> {
  const principal = await getPrincipal();
  if (principal) {
    return principal;
  }
  const session = await getValidSession();
  redirect(session ? "/unauthorized" : "/auth/login?returnTo=/dashboard");
}

/** Páginas: redirecciona antes de renderizar, para não haver flash de UI. */
export async function requirePermissionPage(
  permission: Permission,
): Promise<Principal> {
  const principal = await exigirPrincipal();
  if (!can(principal, permission)) {
    redirect("/unauthorized");
  }
  return principal;
}

/** Páginas que só exigem sessão válida (o dashboard, o selector de loja). */
export async function requireSessionPage(): Promise<Principal> {
  return exigirPrincipal();
}

type ApiGuard =
  | { principal: Principal; error: null }
  | { principal: null; error: NextResponse };

/** Route handlers: devolve a resposta de erro em vez de a lançar. */
export async function requirePermissionApi(
  permission: Permission,
): Promise<ApiGuard> {
  const principal = await getPrincipal();
  if (!principal) {
    return {
      principal: null,
      error: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      ),
    };
  }
  if (!can(principal, permission)) {
    return {
      principal: null,
      error: NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      ),
    };
  }
  return { principal, error: null };
}

/** Server actions: lançar é a forma de as interromper. */
export async function requirePermissionOrThrow(
  permission: Permission,
): Promise<Principal> {
  const principal = await getPrincipal();
  if (!principal) {
    throw new Error("Authentication required");
  }
  if (!can(principal, permission)) {
    throw new Error("Insufficient permissions");
  }
  return principal;
}
