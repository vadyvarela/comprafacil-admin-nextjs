// GERADO — não editar à mão.
//
// Fonte: kumprahub-api/src/authz/permissions.ts
// Regenerar: node scripts/sync-permissions.mjs
//
// O backoffice não decide permissões: recebe-as de /api/me e desenha a partir
// delas. Isto existe só para o TypeScript saber os nomes válidos, de forma a
// que um `can("prodcuts.write")` não compile.

export const STORE_PERMISSIONS = [
  "dashboard.read",
  "analytics.read",
  "orders.read",
  "orders.fulfill",
  "orders.write",
  "orders.reconcile",
  "customers.read",
  "customers.pii.read",
  "customers.write",
  "transactions.read",
  "transactions.documents.read",
  "transactions.documents.write",
  "products.read",
  "products.write",
  "products.delete",
  "products.import",
  "categories.read",
  "categories.write",
  "brands.read",
  "brands.write",
  "coupons.read",
  "coupons.write",
  "promotions.read",
  "promotions.write",
  "banners.read",
  "banners.write",
  "media.read",
  "media.write",
  "media.delete",
  "marketing.leads.read",
  "marketing.leads.write",
  "marketing.analytics.read",
  "settings.read",
  "settings.write",
  "settings.pagebuilder.publish",
  "settings.notifications.write",
  "audit.read",
  "audit.write",
  "team.read",
  "team.invite",
  "team.role.write",
  "team.remove",
  "security.tokens.read",
  "security.tokens.write",
  "store.read",
  "store.write",
  "store.transfer",
  "store.delete",
] as const;

export const STOREFRONT_PERMISSIONS = [
  "storefront.catalog.read",
  "storefront.settings.read",
  "storefront.shipping.quote",
  "storefront.cart.write",
  "storefront.customer.self",
  "storefront.checkout.write",
  "storefront.order.status",
  "storefront.analytics.write",
  "storefront.documents.read",
] as const;

export const PLATFORM_PERMISSIONS = [
  "platform.stores.read",
  "platform.stores.write",
  "platform.impersonate",
] as const;

export const ALL_PERMISSIONS = [
  ...STORE_PERMISSIONS,
  ...STOREFRONT_PERMISSIONS,
  ...PLATFORM_PERMISSIONS,
] as const;

export type StorePermission = (typeof STORE_PERMISSIONS)[number];
export type Permission = (typeof ALL_PERMISSIONS)[number];

const KNOWN: ReadonlySet<string> = new Set(ALL_PERMISSIONS);

export function isPermission(value: string): value is Permission {
  return KNOWN.has(value);
}
