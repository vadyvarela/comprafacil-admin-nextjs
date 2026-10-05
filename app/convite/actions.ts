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
    const erro = error.status === 401 ? "sessao" : "invalido";
    redirect(`/convite?token=${encodeURIComponent(token)}&erro=${erro}`);
  }

  redirect("/dashboard");
}
