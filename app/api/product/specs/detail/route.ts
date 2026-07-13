import { NextRequest, NextResponse } from "next/server"
import { requireModuleWriteSession } from "@/lib/auth/requireRole"
import {
  getMobileDeviceSpecifications,
  MobileApiError,
} from "@/lib/product-specs/mobileapi-client"

export async function GET(request: NextRequest) {
  const { error } = await requireModuleWriteSession("products")
  if (error) return error

  const idRaw = request.nextUrl.searchParams.get("id")?.trim()
  const deviceId = idRaw ? Number.parseInt(idRaw, 10) : NaN

  if (!Number.isFinite(deviceId) || deviceId <= 0) {
    return NextResponse.json({ error: "Parâmetro id é obrigatório." }, { status: 400 })
  }

  try {
    const detail = await getMobileDeviceSpecifications(deviceId)
    return NextResponse.json(detail)
  } catch (err) {
    if (err instanceof MobileApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: "Erro ao obter especificações." }, { status: 500 })
  }
}
