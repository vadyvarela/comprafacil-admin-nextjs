import { NextResponse } from "next/server";
import { apiFetch, ApiError } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/utils/errors";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Mudar o cargo de alguém, ou removê-lo.
 *
 * As protecções contra ficar sem quem administre a loja — não despromover o
 * proprietário, não se remover a si próprio, não atribuir acima do próprio
 * nível — estão na API, do lado que tem os dados para as verificar sem uma
 * segunda ida à rede.
 */
export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const body: unknown = await request.json();
    await apiFetch(`/api/team/members/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return falha(error, "PATCH");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    await apiFetch(`/api/team/members/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return falha(error, "DELETE");
  }
}

function falha(error: unknown, metodo: string) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error(`[team/members] ${metodo}:`, error);
  return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
}
