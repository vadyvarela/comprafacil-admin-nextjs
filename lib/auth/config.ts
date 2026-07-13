/**
 * Regras de permissão do admin.
 * Utilizadores com roles de loja (owner, manager, operator, viewer)
 * ou a role legada "admin" podem aceder ao backoffice.
 */

import {
  getPrimaryRole,
  getStoreRolesFromUser,
  LEGACY_ADMIN_ROLE,
  type StoreRole,
} from "@/lib/auth/roles";

/** Nome da role legada que mapeia para owner. */
export const ADMIN_ROLE = process.env.AUTH0_ADMIN_ROLE ?? LEGACY_ADMIN_ROLE;

/**
 * Claim onde o Auth0 envia as roles (ex.: custom claim no ID token).
 */
export const ROLE_CLAIM = process.env.AUTH0_ROLE_CLAIM ?? "https://Kumprafacil.com/roles";

export type SessionUser = {
  sub?: string | null;
  [key: string]: unknown;
};

/**
 * Obtém as roles brutas do utilizador (inclui admin legado).
 */
export function getUserRoles(user: SessionUser | null | undefined): string[] {
  if (!user) return [];

  const roles =
    (user[ROLE_CLAIM] as string[] | undefined) ??
    (user.app_metadata as { roles?: string[] } | undefined)?.roles;

  if (!Array.isArray(roles)) return [];
  return roles.filter((r): r is string => typeof r === "string");
}

/**
 * Verifica se o utilizador tem permissão de admin (legado).
 * Mantido para compatibilidade — equivalente a ter role owner.
 */
export function hasAdminRole(user: SessionUser | null | undefined): boolean {
  if (!user) return false;
  const roles = getUserRoles(user);
  if (roles.includes(ADMIN_ROLE)) return true;
  return getStoreRolesFromUser(user).length > 0;
}

/**
 * Qualquer membro da equipa com role de loja pode aceder ao backoffice.
 */
export function hasStoreAccess(user: SessionUser | null | undefined): boolean {
  return hasAdminRole(user);
}

/**
 * Verifica se o utilizador é owner ou admin (acesso total).
 */
export function isOwner(user: SessionUser | null | undefined): boolean {
  if (!user) return false;
  const roles = getStoreRolesFromUser(user);
  return roles.includes("owner") || roles.includes("admin");
}

export { getPrimaryRole, getStoreRolesFromUser, type StoreRole };
