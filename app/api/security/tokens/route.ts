import { NextResponse } from "next/server";
import { apiFetch, ApiError } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/utils/errors";

/**
 * Tokens de API da loja.
 *
 * Passa a ir com a identidade de quem pede, em vez do token de serviço: a API
 * exige `security.tokens.read` e é ela que decide. Antes bastava chegar aqui
 * com sessão de owner e o pedido seguia com poderes totais.
 */
export async function GET() {
  try {
    return NextResponse.json(await apiFetch("/api/security/tokens"));
  } catch (error) {
    return falhaToken(error, "GET");
  }
}

export function falhaToken(error: unknown, metodo: string) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error(`[security/tokens] ${metodo}:`, error);
  return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
}
