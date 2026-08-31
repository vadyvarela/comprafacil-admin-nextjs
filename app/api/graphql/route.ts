import { NextRequest, NextResponse } from "next/server"
import { requireStoreSession } from "@/lib/auth/requireRole"
import {
  canReadModule,
  canWriteModule,
  hasMinimumRole,
  type AccessModule,
  type StoreRole,
} from "@/lib/auth/roles"
import { rateLimit } from "@/lib/security/rate-limit"
import { getErrorMessage } from "@/lib/utils/errors"
import {
  getOperationAST,
  Kind,
  parse,
  type DefinitionNode,
  type FragmentDefinitionNode,
  type OperationDefinitionNode,
  type SelectionNode,
} from "graphql"

type GraphQLErrorPayload = {
  message?: string
}

type GraphQLProxyResponse = {
  errors?: GraphQLErrorPayload[]
}

type GraphQLBody = {
  query?: string
  operationName?: string
  variables?: unknown
}

type OperationAccess = {
  module: AccessModule
  mode: "read" | "write"
  minimumRole?: StoreRole
}

/** Limite por IP só depois de sessão: import JSON gera 1+N mutações por produto; 30/min rebentava o fluxo. */
const ADMIN_GRAPHQL_BURST: { maxRequests: number; windowMs: number } = {
  maxRequests: 800,
  windowMs: 60_000,
}

const ROOT_FIELD_ACCESS: Record<string, OperationAccess> = {
  salesSummary: { module: "analytics", mode: "read" },
  paymentStatusSummary: { module: "analytics", mode: "read" },
  weekPurchaseReport: { module: "analytics", mode: "read" },
  lastSixMonthsPurchaseReport: { module: "analytics", mode: "read" },
  productSalesReport: { module: "analytics", mode: "read" },
  customerPurchasesSummary: { module: "analytics", mode: "read" },
  countryPurchasesSummary: { module: "analytics", mode: "read" },
  successfulPaymentSummary: { module: "analytics", mode: "read" },

  checkoutSessionSearch: { module: "orders", mode: "read" },
  checkoutSessionDetails: { module: "orders", mode: "read" },
  updateOrderFulfillmentStatus: { module: "orders", mode: "write" },
  auditLogs: { module: "logs", mode: "read" },

  customers: { module: "customers", mode: "read" },
  customerDetails: { module: "customers", mode: "read" },
  customerDetailsByExternalId: { module: "customers", mode: "read" },

  paymentIntent: { module: "transactions", mode: "read" },
  paymentsSearch: { module: "transactions", mode: "read" },
  checkTransactionStatus: { module: "transactions", mode: "read" },
  deletePaymentIntent: { module: "transactions", mode: "write", minimumRole: "admin" },

  products: { module: "products", mode: "read" },
  productDetails: { module: "products", mode: "read" },
  createProduct: { module: "products", mode: "write" },
  updateProduct: { module: "products", mode: "write" },
  deleteProduct: { module: "products", mode: "write" },
  createProductVariant: { module: "products", mode: "write" },
  updateProductVariant: { module: "products", mode: "write" },
  deleteProductVariant: { module: "products", mode: "write" },
  createPrice: { module: "products", mode: "write" },
  updatePrice: { module: "products", mode: "write" },
  createStock: { module: "products", mode: "write" },
  updateStock: { module: "products", mode: "write" },

  categories: { module: "categories", mode: "read" },
  categoryList: { module: "categories", mode: "read" },
  category: { module: "categories", mode: "read" },
  createCategory: { module: "categories", mode: "write" },
  updateCategory: { module: "categories", mode: "write" },
  deleteCategory: { module: "categories", mode: "write" },

  brands: { module: "brands", mode: "read" },
  brandList: { module: "brands", mode: "read" },
  brandDetails: { module: "brands", mode: "read" },
  createBrand: { module: "brands", mode: "write" },
  updateBrand: { module: "brands", mode: "write" },
  deleteBrand: { module: "brands", mode: "write" },

  coupons: { module: "coupons", mode: "read" },
  couponsByStatus: { module: "coupons", mode: "read" },
  searchCoupons: { module: "coupons", mode: "read" },
  couponDetails: { module: "coupons", mode: "read" },
  createCoupon: { module: "coupons", mode: "write" },
  updateCoupon: { module: "coupons", mode: "write" },
  deleteCoupon: { module: "coupons", mode: "write" },
  createPromotionCode: { module: "coupons", mode: "write" },

  commercialRecoveryLeads: { module: "marketingLeads", mode: "read" },
  upsertCommercialLeadFollowUp: { module: "marketingLeads", mode: "write" },

  banners: { module: "banners", mode: "read" },
  banner: { module: "banners", mode: "read" },
  bannerDetails: { module: "banners", mode: "read" },
  activeBanners: { module: "banners", mode: "read" },

  createBanner: { module: "banners", mode: "write" },
  updateBanner: { module: "banners", mode: "write" },
  deleteBanner: { module: "banners", mode: "write" },

  storeSettings: { module: "settings", mode: "read" },
  updateStoreSettings: { module: "settings", mode: "write" },
  updateStoreTheme: { module: "settings", mode: "write" },
  storeMaintenance: { module: "settings", mode: "read" },
  updateStoreMaintenance: { module: "settings", mode: "write" },
  telegramNotificationSettings: { module: "settings", mode: "read" },
  updateTelegramNotificationSettings: { module: "settings", mode: "write" },
  storeHomeLayout: { module: "settings", mode: "read" },
  saveStoreHomeLayoutDraft: { module: "settings", mode: "write" },
  publishStoreHomeLayout: { module: "settings", mode: "write" },

  countries: { module: "settings", mode: "read" },
  locations: { module: "settings", mode: "read" },
  cities: { module: "settings", mode: "read" },
  states: { module: "settings", mode: "read" },
  shippingTiers: { module: "settings", mode: "read" },
  pickupPoints: { module: "settings", mode: "read" },
  upsertShippingTier: { module: "settings", mode: "write" },
  deleteShippingTier: { module: "settings", mode: "write" },
  upsertPickupPoint: { module: "settings", mode: "write" },
  deletePickupPoint: { module: "settings", mode: "write" },
}

function isFragmentDefinition(definition: DefinitionNode): definition is FragmentDefinitionNode {
  return definition.kind === Kind.FRAGMENT_DEFINITION
}

function collectRootFields(
  operation: OperationDefinitionNode,
  fragments: Map<string, FragmentDefinitionNode>,
  visitedFragments = new Set<string>()
): string[] {
  const fields = new Set<string>()

  function visitSelection(selection: SelectionNode) {
    if (selection.kind === Kind.FIELD) {
      fields.add(selection.name.value)
      return
    }

    if (selection.kind === Kind.INLINE_FRAGMENT) {
      selection.selectionSet.selections.forEach(visitSelection)
      return
    }

    const fragmentName = selection.name.value
    if (visitedFragments.has(fragmentName)) return
    visitedFragments.add(fragmentName)
    const fragment = fragments.get(fragmentName)
    if (fragment) {
      fragment.selectionSet.selections.forEach(visitSelection)
    }
  }

  operation.selectionSet.selections.forEach(visitSelection)
  return [...fields]
}

function getRequestedAccess(body: GraphQLBody): OperationAccess[] {
  if (typeof body.query !== "string" || !body.query.trim()) {
    throw new Error("GraphQL query is required")
  }

  const document = parse(body.query)
  const operation = getOperationAST(document, body.operationName)

  if (!operation) {
    throw new Error("GraphQL operation not found")
  }

  const fragments = new Map(
    document.definitions
      .filter(isFragmentDefinition)
      .map((fragment) => [fragment.name.value, fragment])
  )

  return collectRootFields(operation, fragments)
    .filter((fieldName) => fieldName !== "__typename")
    .map((fieldName) => {
      const access = ROOT_FIELD_ACCESS[fieldName]
      if (!access) {
        throw new Error(`GraphQL field not allowed: ${fieldName}`)
      }
      return access
    })
}

function canAccessOperation(
  user: Parameters<typeof canReadModule>[0],
  access: OperationAccess
): boolean {
  if (access.minimumRole && !hasMinimumRole(user, access.minimumRole)) {
    return false
  }

  return access.mode === "write"
    ? canWriteModule(user, access.module)
    : canReadModule(user, access.module)
}

export async function POST(request: NextRequest) {
  try {
    const { session, error } = await requireStoreSession()
    if (error) return error

    const rateLimited = rateLimit(
      request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? null,
      ADMIN_GRAPHQL_BURST
    )
    if (rateLimited) return rateLimited

    const body = (await request.json().catch(() => null)) as GraphQLBody | null
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    let requestedAccess: OperationAccess[]
    try {
      requestedAccess = getRequestedAccess(body)
    } catch (error) {
      return NextResponse.json(
        { error: getErrorMessage(error) },
        { status: 400 }
      )
    }

    const denied = requestedAccess.find((access) => !canAccessOperation(session.user, access))
    if (denied) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    const gtwUrl = process.env.GTW_URL
    const gtwToken = process.env.GTW_TOKEN
    const cmsAccessToken = process.env.CMS_ACCESS_TOKEN

    if (!gtwUrl || !gtwToken || !cmsAccessToken) {
      return NextResponse.json(
        { error: "Payment gateway configuration missing" },
        { status: 500 }
      )
    }

    const response = await fetch(`${gtwUrl}/${gtwToken}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cmsAccessToken}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    })

    const data = (await response.json()) as GraphQLProxyResponse

    if (data.errors) {
      console.error(
        "GraphQL errors:",
        data.errors.map((err) => err.message).filter(Boolean).join("; ")
      )

      const hasJdbcError = data.errors.some(
        (err) =>
          err.message?.includes("JDBC Connection") ||
          err.message?.includes("Unable to commit")
      )

      if (hasJdbcError) {
        await new Promise((resolve) => setTimeout(resolve, 1000))

        try {
          const retryResponse = await fetch(`${gtwUrl}/${gtwToken}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${cmsAccessToken}`,
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(30000),
          })

          const retryData = (await retryResponse.json()) as GraphQLProxyResponse

          if (
            retryData.errors &&
            retryData.errors.some((err) => err.message?.includes("JDBC Connection"))
          ) {
            console.error("Retry also failed with JDBC error")
          } else {
            return NextResponse.json(retryData)
          }
        } catch (retryError) {
          console.error("Retry failed:", retryError)
        }
      }
    }

    return NextResponse.json(data, {
      status: data.errors ? 200 : response.status,
    })
  } catch (error: unknown) {
    console.error("GraphQL API error:", getErrorMessage(error))
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
