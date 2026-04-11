import { NextRequest, NextResponse } from "next/server";

/**
 * Auth error handler — quebra o loop de redirect quando o Auth0 callback falha.
 * Em vez de redirecionar para login de novo (causando loop eterno),
 * volta para a página inicial com um parâmetro de erro.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const error = searchParams.get("error") ?? "unknown";
  const errorDescription = searchParams.get("error_description") ?? "";

  console.error("[Auth0 Error]", { error, errorDescription });

  const homeUrl = new URL("/", request.url);
  homeUrl.searchParams.set("auth_error", error);

  return NextResponse.redirect(homeUrl);
}
