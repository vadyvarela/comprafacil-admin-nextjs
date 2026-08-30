import type { SessionUser } from "@/lib/auth/config";
import { getUserRoles } from "@/lib/auth/config";

/** Roles de acesso à loja no backoffice. */
export const STORE_ROLES = ["owner", "admin", "manager", "operator", "viewer"] as const;
export type StoreRole = (typeof STORE_ROLES)[number];

/** Alias — `admin` é role de acesso total (equivalente a owner). */
export const LEGACY_ADMIN_ROLE = "admin";

/** Roles com acesso total (equipa, tokens API, etc.). */
export const PRIVILEGED_ROLES = ["owner", "admin"] as const;
export type PrivilegedRole = (typeof PRIVILEGED_ROLES)[number];

export const ROLE_LABELS: Record<StoreRole, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  manager: "Gestor",
  operator: "Operador",
  viewer: "Visualizador",
};

export const ROLE_DESCRIPTIONS: Record<StoreRole, string> = {
  owner: "Acesso total, incluindo equipa e tokens de API",
  admin: "Acesso total, incluindo equipa e tokens de API",
  manager: "Catálogo, vendas, marketing, analytics e definições",
  operator: "Pedidos e clientes (leitura/actualização)",
  viewer: "Apenas visualização de dashboard, produtos e pedidos",
};

/** Hierarquia: índice maior = mais permissões. */
export const ROLE_RANK: Record<StoreRole, number> = {
  viewer: 0,
  operator: 1,
  manager: 2,
  owner: 3,
  admin: 3,
};

export type AccessModule =
  | "dashboard"
  | "analytics"
  | "orders"
  | "customers"
  | "transactions"
  | "products"
  | "categories"
  | "brands"
  | "coupons"
  | "banners"
  | "media"
  | "logs"
  | "settings"
  | "settings.team"
  | "settings.security";

type AccessRule = {
  read: StoreRole;
  write: StoreRole;
};

const MODULE_ACCESS: Record<AccessModule, AccessRule> = {
  dashboard: { read: "viewer", write: "viewer" },
  analytics: { read: "manager", write: "manager" },
  orders: { read: "viewer", write: "operator" },
  customers: { read: "viewer", write: "manager" },
  transactions: { read: "manager", write: "manager" },
  products: { read: "viewer", write: "manager" },
  categories: { read: "manager", write: "manager" },
  brands: { read: "manager", write: "manager" },
  coupons: { read: "manager", write: "manager" },
  banners: { read: "manager", write: "manager" },
  media: { read: "manager", write: "manager" },
  logs: { read: "manager", write: "manager" },
  settings: { read: "manager", write: "manager" },
  "settings.team": { read: "owner", write: "owner" },
  "settings.security": { read: "owner", write: "owner" },
};

const ROUTE_MODULES: { prefix: string; module: AccessModule }[] = [
  { prefix: "/dashboard/settings/team", module: "settings.team" },
  { prefix: "/dashboard/settings/security", module: "settings.security" },
  { prefix: "/dashboard/settings", module: "settings" },
  { prefix: "/dashboard/analytics", module: "analytics" },
  { prefix: "/dashboard/orders", module: "orders" },
  { prefix: "/dashboard/customers", module: "customers" },
  { prefix: "/dashboard/transactions", module: "transactions" },
  { prefix: "/dashboard/logs", module: "logs" },
  { prefix: "/dashboard/products", module: "products" },
  { prefix: "/dashboard/categories", module: "categories" },
  { prefix: "/dashboard/brands", module: "brands" },
  { prefix: "/dashboard/coupons", module: "coupons" },
  { prefix: "/dashboard/banners", module: "banners" },
  { prefix: "/dashboard/media", module: "media" },
  { prefix: "/dashboard", module: "dashboard" },
];

const NAV_MODULE_MAP: Record<string, AccessModule> = {
  "/dashboard": "dashboard",
  "/dashboard/analytics": "analytics",
  "/dashboard/orders": "orders",
  "/dashboard/customers": "customers",
  "/dashboard/transactions": "transactions",
  "/dashboard/logs": "logs",
  "/dashboard/products": "products",
  "/dashboard/categories": "categories",
  "/dashboard/brands": "brands",
  "/dashboard/coupons": "coupons",
  "/dashboard/banners": "banners",
  "/dashboard/media": "media",
  "/dashboard/settings/page-builder": "settings",
  "/dashboard/settings": "settings",
};

export function isStoreRole(value: string): value is StoreRole {
  return (STORE_ROLES as readonly string[]).includes(value);
}

export function isPrivilegedRole(role: StoreRole): role is PrivilegedRole {
  return (PRIVILEGED_ROLES as readonly string[]).includes(role);
}

export function normalizeToStoreRole(role: string): StoreRole | null {
  return isStoreRole(role) ? role : null;
}

export function getStoreRolesFromUser(user: SessionUser | null | undefined): StoreRole[] {
  const raw = getUserRoles(user);
  const normalized = raw
    .map(normalizeToStoreRole)
    .filter((r): r is StoreRole => r !== null);
  return [...new Set(normalized)];
}

export function getPrimaryRole(user: SessionUser | null | undefined): StoreRole | null {
  const roles = getStoreRolesFromUser(user);
  if (roles.length === 0) return null;
  return roles.reduce((best, role) =>
    ROLE_RANK[role] > ROLE_RANK[best] ? role : best
  );
}

export function hasMinimumRole(
  user: SessionUser | null | undefined,
  minimum: StoreRole
): boolean {
  const primary = getPrimaryRole(user);
  if (!primary) return false;
  return ROLE_RANK[primary] >= ROLE_RANK[minimum];
}

export function hasRole(
  user: SessionUser | null | undefined,
  role: StoreRole
): boolean {
  return getStoreRolesFromUser(user).includes(role);
}

export function canReadModule(
  user: SessionUser | null | undefined,
  accessModule: AccessModule
): boolean {
  const rule = MODULE_ACCESS[accessModule];
  return hasMinimumRole(user, rule.read);
}

export function canWriteModule(
  user: SessionUser | null | undefined,
  accessModule: AccessModule
): boolean {
  const rule = MODULE_ACCESS[accessModule];
  return hasMinimumRole(user, rule.write);
}

export function getModuleForPath(pathname: string): AccessModule {
  const match = ROUTE_MODULES.find((r) => pathname.startsWith(r.prefix));
  return match?.module ?? "dashboard";
}

export function canAccessPath(
  user: SessionUser | null | undefined,
  pathname: string,
  mode: "read" | "write" = "read"
): boolean {
  const accessModule = getModuleForPath(pathname);
  return mode === "write" ? canWriteModule(user, accessModule) : canReadModule(user, accessModule);
}

export function canAccessNavItem(
  user: SessionUser | null | undefined,
  url: string
): boolean {
  const accessModule = NAV_MODULE_MAP[url];
  if (!accessModule) return true;
  return canReadModule(user, accessModule);
}

export function isWritePath(pathname: string): boolean {
  return (
    /\/(create|new|edit)(\/|$)/.test(pathname) ||
    pathname.includes("/settings/") && !pathname.endsWith("/settings")
  );
}
