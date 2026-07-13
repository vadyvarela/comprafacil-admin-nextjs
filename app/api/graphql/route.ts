import { NextRequest, NextResponse } from "next/server"
import { requireStoreSession } from "@/lib/auth/requireRole"
import { hasMinimumRole } from "@/lib/auth/roles"
import { rateLimit } from "@/lib/security/rate-limit"
import { getErrorMessage } from "@/lib/utils/errors"

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

/** Limite por IP só depois de sessão: import JSON gera 1+N mutações por produto; 30/min rebentava o fluxo. */
const ADMIN_GRAPHQL_BURST: { maxRequests: number; windowMs: number } = {
  maxRequests: 800,
  windowMs: 60_000,
}

function isGraphQLMutation(query: string | undefined): boolean {
  if (!query) return false
  return /^\s*mutation\b/i.test(query)
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

    const body = (await request.json()) as GraphQLBody

    // Viewers só podem fazer queries; mutações exigem pelo menos operator
    if (isGraphQLMutation(body.query) && !hasMinimumRole(session.user, "operator")) {
      return NextResponse.json(
        { error: "Insufficient permissions for mutations" },
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
      console.error("GraphQL errors:", JSON.stringify(data.errors, null, 2))

      const hasJdbcError = data.errors.some(
        (err) =>
          err.message?.includes("JDBC Connection") ||
          err.message?.includes("Unable to commit")
      )

      if (hasJdbcError) {
        console.log("JDBC Connection error detected, retrying once...")
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
            console.log("Retry succeeded")
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
