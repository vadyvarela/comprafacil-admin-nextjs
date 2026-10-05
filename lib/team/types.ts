import type { StoreRole } from "@/lib/auth/roles";

/**
 * Um membro da equipa, tal como a API o devolve.
 *
 * Substitui o tipo que vinha de `lib/auth0/management.ts`, onde um membro era
 * um utilizador do Auth0 com as roles lidas por uma chamada à Management API
 * por cada role existente.
 */
export interface TeamMember {
  /** Id do utilizador na nossa base de dados, não o `sub` do Auth0. */
  userId: string;
  email: string;
  name: string | null;
  picture: string | null;
  role: StoreRole | null;
  /** ACTIVE | SUSPENDED — o estado do vínculo à loja, não da conta. */
  status: string;
  acceptedAt: string | null;
  /** A API marca a própria linha de quem pergunta. */
  isSelf: boolean;
}

/** Um convite por aceitar. O link não volta: a API só guarda o hash. */
export interface PendingInvitation {
  id: string;
  email: string;
  role: StoreRole | null;
  createdAt: string;
  expiresAt: string;
}

/** Ordem de privilégio, só para ordenar e para avisar em promoções. */
const ORDEM: StoreRole[] = ["viewer", "operator", "manager", "admin", "owner"];

export function isPromotion(
  from: StoreRole | null,
  to: StoreRole,
): boolean {
  return ORDEM.indexOf(to) > ORDEM.indexOf(from ?? "viewer");
}
