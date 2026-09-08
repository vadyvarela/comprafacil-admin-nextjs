import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/api/client";
import { falhaToken } from "../route";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => ({}));
    // A API emite sempre um token de loja pública, com os scopes dela e mais
    // nenhum — um token de serviço não se emite por HTTP.
    return NextResponse.json(
      await apiFetch("/api/security/tokens/generate", {
        method: "POST",
        body: JSON.stringify(body ?? {}),
      }),
      { status: 201 },
    );
  } catch (error) {
    return falhaToken(error, "POST generate");
  }
}
