/**
 * Server Actions e data fetchers.
 * Tudo aqui roda apenas no servidor (server-only).
 *
 * - graphql: runner para chamadas ao gateway
 * - orders: getOrdersPage, getOrderById
 * - transactions: getTransactions (paymentsSearch)
 *
 * Outros domínios (coupons, products, etc.) devem seguir o mesmo padrão.
 */

export { runGraphQL } from "./graphql"
export type { GraphQLResponse } from "./graphql"
export {
  getOrdersPage,
  getOrderById,
} from "./orders"
export type {
  OrdersPageParams,
  OrdersPageResult,
  OrderByIdResult,
} from "./orders"
export { getTransactions } from "./transactions"
export type { GetTransactionsParams, GetTransactionsResult } from "./transactions"
export { getCommercialRecoveryLeads } from "./commercial-leads"
export type {
  GetCommercialRecoveryLeadsParams,
  GetCommercialRecoveryLeadsResult,
} from "./commercial-leads"
export { upsertCommercialLeadFollowUp } from "./commercial-lead-follow-up"
export type { UpsertCommercialLeadFollowUpResult } from "./commercial-lead-follow-up"
export {
  getCustomers,
  getCustomerDetails,
  getCustomerDetailsByExternalId,
} from "./customers"
export type {
  GetCustomersResult,
  GetCustomerDetailsResult,
} from "./customers"
export { getProducts, getProductFilterOptions } from "./products"
export type { GetProductsResult, GetProductsParams } from "./products"
