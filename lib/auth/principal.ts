import "server-only";
import { cache } from "react";
import { apiFetch, ApiError } from "@/lib/api/client";
import { isPermission, type Permission } from "@/lib/auth/permissions";

/**
 * Quem está autenticado e o que pode, segundo a API.
 *
 * O backoffice deixa de ter opinião própria sobre permissões. Antes mantinha
 * uma matriz de 16 módulos × read/write, um mapa de rotas e outro de navegação
 * — três tabelas a dizer a mesma coisa de maneiras diferentes, e já divergentes
 * entre si (`/dashboard/store-home` não constava de nenhuma). Agora recebe a
 * lista resolvida e desenha a partir dela.
 */

import type { StoreRole } from "@/lib/auth/roles";

export type { StoreRole };

export interface PrincipalStore {
  id: string;
  slug: string;
  name: string;
  role: StoreRole | null;
  active: boolean;
}

export interface Principal {
  kind: "user" | "machine" | "customer" | "legacy-admin";
  activeStoreId: string;
  permissions: Permission[];
  impersonating?: boolean;
  user: {
    id: string;
    email: string;
    name: string | null;
    picture: string | null;
    platformAdmin: boolean;
  } | null;
  stores: PrincipalStore[];
}

interface RawMe {
  kind?: string;
  activeStoreId?: string;
  permissions?: unknown;
  impersonating?: boolean;
  user?: Principal["user"];
  stores?: PrincipalStore[];
}

/**
 * Uma vez por pedido.
 *
 * `cache()` do React desduplica dentro do mesmo render, por isso um layout, uma
 * página e três componentes a perguntarem quem está autenticado custam uma
 * chamada só.
 */
export const getPrincipal = cache(async (): Promise<Principal | null> => {
  try {
    const me = await apiFetch<RawMe>("/api/me");
    if (!me?.activeStoreId) {
      return null;
    }
    return {
      kind: (me.kind as Principal["kind"]) ?? "user",
      activeStoreId: me.activeStoreId,
      // Uma permissão que este build não conhece é descartada em vez de
      // concedida: catálogo mais novo do lado da API não deve dar poderes que
      // esta UI não sabe desenhar.
      permissions: Array.isArray(me.permissions)
        ? me.permissions.filter(
            (value): value is Permission =>
              typeof value === "string" && isPermission(value),
          )
        : [],
      impersonating: me.impersonating ?? false,
      user: me.user ?? null,
      stores: me.stores ?? [],
    };
  } catch (error) {
    // Só falhas da API degradam para "sem principal". Tudo o resto sobe: o
    // Next sinaliza com um erro que uma rota tocou em `headers()` e por isso
    // não pode ser pré-renderizada — apanhá-lo aqui esconderia esse sinal e
    // baralharia a decisão de estático vs dinâmico.
    if (!(error instanceof ApiError)) {
      throw error;
    }
    // 401 é sessão expirada, o caso normal. Outro estado é a API em baixo, e
    // nesse caso também não há permissões para mostrar.
    if (error.status !== 401) {
      console.error("[auth] /api/me falhou:", error.status, error.message);
    }
    return null;
  }
});

export function can(
  principal: Principal | null | undefined,
  permission: Permission,
): boolean {
  return principal?.permissions.includes(permission) ?? false;
}

export function canAny(
  principal: Principal | null | undefined,
  permissions: readonly Permission[],
): boolean {
  return permissions.some((permission) => can(principal, permission));
}

/** A loja onde a pessoa está a trabalhar agora. */
export function activeStore(
  principal: Principal | null | undefined,
): PrincipalStore | null {
  return principal?.stores.find((store) => store.active) ?? null;
}
