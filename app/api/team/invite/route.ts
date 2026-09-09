import { NextResponse } from "next/server";
import { apiFetch, ApiError } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/utils/errors";

/**
 * Convidar alguém.
 *
 * A validação de email e de cargo, e a regra de não se poder atribuir um cargo
 * acima do próprio, vivem na API. Duplicá-las aqui só criaria duas versões da
 * mesma regra para divergirem com o tempo.
 */
export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const result = await apiFetch("/api/team/invitations", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[team/invite] POST:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
