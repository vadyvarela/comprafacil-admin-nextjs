import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/api/client";
import { falhaToken } from "../route";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const url = new URL(request.url);
  // ?action=activate | deactivate — a API tem uma rota para cada.
  const action = url.searchParams.get("action") === "deactivate"
    ? "deactivate"
    : "activate";
  try {
    return NextResponse.json(
      await apiFetch(
        `/api/security/tokens/${encodeURIComponent(id)}/${action}`,
        { method: "PUT" },
      ),
    );
  } catch (error) {
    return falhaToken(error, "PUT");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    await apiFetch(`/api/security/tokens/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return falhaToken(error, "DELETE");
  }
}
