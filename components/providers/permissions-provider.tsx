"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Permission } from "@/lib/auth/permissions";

/**
 * As permissões da pessoa autenticada, disponíveis no cliente.
 *
 * Substitui `module-access-context` e `settings-access-context`, que eram dois
 * contextos a carregar um booleano pré-calculado cada um (`canWrite`,
 * `isOwner`). Sempre que fizesse falta uma terceira distinção nascia um
 * terceiro contexto; com a lista inteira, deixa de fazer falta.
 *
 * Isto decide o que se **mostra**. O que se **pode** é decidido pela API, e
 * esconder um botão nunca foi proteger uma acção.
 */

const PermissionsContext = createContext<ReadonlySet<Permission>>(new Set());

export function PermissionsProvider({
  permissions,
  children,
}: {
  permissions: Permission[];
  children: ReactNode;
}) {
  const value = useMemo(() => new Set(permissions), [permissions]);
  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

/** `can("products.write")` — o nome não compila se não existir no catálogo. */
export function useCan(): (permission: Permission) => boolean {
  const permissions = useContext(PermissionsContext);
  return useMemo(
    () => (permission: Permission) => permissions.has(permission),
    [permissions],
  );
}

export function usePermissions(): ReadonlySet<Permission> {
  return useContext(PermissionsContext);
}
