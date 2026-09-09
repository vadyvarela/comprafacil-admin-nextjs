import { NextResponse } from "next/server";
import { apiFetch, ApiError } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/utils/errors";

/**
 * Membros da equipa.
 *
 * Era a Management API do Auth0, com `sleep(550)` entre chamadas por causa do
 * limite do plano gratuito e uma cache de 30 s a disfarçar a lentidão. Agora é
 * uma consulta a uma tabela do outro lado, e este handler só reencaminha —
 * incluindo a autorização, que é decidida lá.
 */
export async function GET() {
  try {
    return NextResponse.json(await apiFetch("/api/team/members"));
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[team/members] GET:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
