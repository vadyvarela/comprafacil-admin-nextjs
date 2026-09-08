/**
 * Os cargos, como se mostram a quem os lê.
 *
 * Isto é tudo o que resta do ficheiro que decidia permissões no backoffice.
 * Saíram daqui a matriz `MODULE_ACCESS` de 16 módulos × read/write, a escada
 * `ROLE_RANK`, os mapas `ROUTE_MODULES` e `NAV_MODULE_MAP`, e os predicados que
 * os liam — cerca de 200 linhas cuja única função era recalcular, mal e em
 * triplicado, uma decisão que agora vem resolvida da API.
 *
 * O que fica é copy: nomes e descrições em português para a UI de equipa.
 */

export const STORE_ROLES = [
  "viewer",
  "operator",
  "manager",
  "admin",
  "owner",
] as const;

export type StoreRole = (typeof STORE_ROLES)[number];

export const ROLE_LABELS: Record<StoreRole, string> = {
  viewer: "Visualizador",
  operator: "Operador",
  manager: "Gestor",
  admin: "Administrador",
  owner: "Proprietário",
};

/**
 * `admin` e `owner` deixaram de ser a mesma coisa.
 *
 * Antes tinham ambos rank 3 e poderes idênticos, o que fazia do cargo do meio
 * um rótulo sem conteúdo. Agora o proprietário é o único que transfere ou
 * apaga a loja; o administrador faz o resto, equipa e tokens incluídos.
 */
export const ROLE_DESCRIPTIONS: Record<StoreRole, string> = {
  viewer: "Vê o dashboard, produtos e pedidos. Sem dados pessoais de clientes.",
  operator: "Trata dos pedidos e vê a ficha de quem os fez.",
  manager: "Gere catálogo, marketing, vendas e definições da loja.",
  admin: "Tudo o que o gestor faz, mais equipa e tokens de API.",
  owner: "Detém a loja. Único que a pode transferir ou apagar.",
};

export function isStoreRole(value: string): value is StoreRole {
  return (STORE_ROLES as readonly string[]).includes(value);
}

export function roleLabel(role: string | null | undefined): string {
  return role && isStoreRole(role) ? ROLE_LABELS[role] : "Sem cargo";
}
