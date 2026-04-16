import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/auth/requireAdmin"
import { rateLimit } from "@/lib/security/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const rateLimited = rateLimit(request.headers.get("x-forwarded-for") ?? request.ip ?? null)
    if (rateLimited) return rateLimited

    const { error } = await requireAdminSession()
    if (error) return error

    const body = await request.json()

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
      // Adicionar timeout e retry para problemas de rede/conexão
      signal: AbortSignal.timeout(30000), // 30 segundos timeout
    })

    const data = await response.json()

    // Log errors for debugging
    if (data.errors) {
      console.error("GraphQL errors:", JSON.stringify(data.errors, null, 2))
      
      // Se for erro de JDBC Connection, tentar novamente uma vez
      const hasJdbcError = data.errors.some((err: any) => 
        err.message?.includes("JDBC Connection") || 
        err.message?.includes("Unable to commit")
      )
      
      if (hasJdbcError) {
        console.log("JDBC Connection error detected, retrying once...")
        // Aguardar um pouco antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 1000))
        
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
          
          const retryData = await retryResponse.json()
          
          // Se ainda tiver erro, retornar o erro original
          if (retryData.errors && retryData.errors.some((err: any) => 
            err.message?.includes("JDBC Connection")
          )) {
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
      status: data.errors ? 200 : response.status, // GraphQL returns 200 even with errors
    })
  } catch (error: any) {
    console.error("GraphQL API error:", error?.message)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

