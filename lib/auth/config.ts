/**
 * Regras de permissão do admin.
 * Apenas utilizadores com role "admin" podem aceder ao backoffice.
 * Utilizadores do front (role "customer" ou sem role) não devem conseguir aceder.
 */

/** Nome da role que permite acesso ao admin. */
export const ADMIN_ROLE = process.env.AUTH0_ADMIN_ROLE ?? "admin";

/**
 * Claim onde o Auth0 envia as roles (ex.: app_metadata.roles ou custom claim).
 * No Auth0, configurar uma Action que adicione ao token:
 * - namespace: https://Kumprafacil.com (ou o seu domínio)
 * - claim: roles (array, ex.: ["admin"] ou ["customer"])
 */
export const ROLE_CLAIM = process.env.AUTH0_ROLE_CLAIM ?? "https://Kumprafacil.com/roles";

export type SessionUser = {
  sub?: string | null;
  [key: string]: unknown;
};

/**
 * Verifica se o utilizador da sessão tem permissão de admin.
 * As roles podem vir em:
 * - session.user[ROLE_CLAIM] (array de strings)
 * - session.user.app_metadata?.roles (array)
 */
export function hasAdminRole(user: SessionUser | null | undefined): boolean {
  if (!user) return false;

  const roles =
    (user[ROLE_CLAIM] as string[] | undefined) ??
    (user.app_metadata as { roles?: string[] } | undefined)?.roles;

  if (!Array.isArray(roles)) return false;
  return roles.includes(ADMIN_ROLE);
}
