import { NextRequest, NextResponse } from "next/server"
import { requireModuleWriteSession } from "@/lib/auth/requireRole"
import { MobileApiError, searchMobileDevices } from "@/lib/product-specs/mobileapi-client"

export async function GET(request: NextRequest) {
  const { error } = await requireModuleWriteSession("products")
  if (error) return error

  const q = request.nextUrl.searchParams.get("q")?.trim() || ""
  const manufacturer = request.nextUrl.searchParams.get("manufacturer")?.trim()

  if (!q) {
    return NextResponse.json({ error: "Parâmetro q é obrigatório." }, { status: 400 })
  }

  try {
    const results = await searchMobileDevices(q, manufacturer)
    return NextResponse.json({ results })
  } catch (err) {
    if (err instanceof MobileApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: "Erro ao pesquisar dispositivos." }, { status: 500 })
  }
}
