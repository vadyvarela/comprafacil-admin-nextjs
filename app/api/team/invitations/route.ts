import { NextResponse } from "next/server";
import { apiFetch, ApiError } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/utils/errors";

/** Convites por aceitar da loja activa. A API já esconde o hash do token. */
export async function GET() {
  try {
    return NextResponse.json(await apiFetch("/api/team/invitations"));
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[team/invitations] GET:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
