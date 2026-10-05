import { NextResponse } from "next/server";
import { apiFetch, ApiError } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/utils/errors";

/**
 * Cargos que quem pergunta pode atribuir.
 *
 * O formulário de convite mostrava os cinco, `owner` incluído, e a API
 * recusava com 403 tudo o que estivesse acima de quem convida. Perguntar
 * evita oferecer o que vai ser recusado.
 */
export async function GET() {
  try {
    return NextResponse.json(await apiFetch("/api/team/roles"));
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[team/roles] GET:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
