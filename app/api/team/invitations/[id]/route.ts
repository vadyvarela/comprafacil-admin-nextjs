import { NextResponse } from "next/server";
import { apiFetch, ApiError } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/utils/errors";

type RouteContext = { params: Promise<{ id: string }> };

/** Revogar um convite: o link deixa de servir, mesmo dentro dos 7 dias. */
export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    await apiFetch(`/api/team/invitations/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[team/invitations] DELETE:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
