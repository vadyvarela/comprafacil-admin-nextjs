"use server";

import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api/client";

/**
 * Aceitar um convite.
 *
 * É um POST atrás de um botão, e não algo que corre ao abrir o link: um GET
 * com efeitos aceitava o convite com a conta que estivesse aberta no browser,
 * sem a pessoa ver qual era.
 */
export async function acceptInvitation(formData: FormData): Promise<void> {
  const token = formData.get("token");
  if (typeof token !== "string" || !token) {
    redirect("/convite?erro=invalido");
  }

  try {
    await apiFetch("/api/team/invitations/accept", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
    console.error("[convite] aceitar falhou:", error.status, error.message);
    redirect(
      `/convite?token=${encodeURIComponent(token)}&erro=${motivo(error.status)}`,
    );
  }

  redirect("/dashboard");
}

/**
 * O código vai no URL, a mensagem não: o texto que se mostra é o da página,
 * não algo que qualquer link pudesse escrever.
 */
function motivo(status: number): string {
  if (status === 401) return "sessao";
  if (status === 404) return "invalido";
  if (status === 409) return "conta";
  return "falha";
}
