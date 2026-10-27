"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { getPrincipal } from "@/lib/auth/principal"
import { ACTIVE_STORE_COOKIE } from "@/lib/auth/active-store-cookie"

const ONE_YEAR = 60 * 60 * 24 * 365

export type SwitchStoreResult = { ok: true } | { ok: false; error: string }

/**
 * Muda a loja onde a pessoa está a trabalhar.
 *
 * Só aceita lojas que a API já devolveu como sendo da pessoa. Não é isto que
 * protege os dados — a API recusa um `X-Store-Id` alheio —, mas evita gravar
 * um cookie que só ia dar erros a seguir.
 */
export async function switchActiveStore(storeId: string): Promise<SwitchStoreResult> {
  const principal = await getPrincipal()
  if (!principal) {
    return { ok: false, error: "Sessão inválida ou expirada." }
  }
  if (!principal.stores.some((store) => store.id === storeId)) {
    return { ok: false, error: "Não tens acesso a essa loja." }
  }

  ;(await cookies()).set(ACTIVE_STORE_COOKIE, storeId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR,
  })
  revalidatePath("/dashboard", "layout")
  return { ok: true }
}

/** Apaga uma escolha que deixou de valer (a pessoa saiu dessa loja). */
export async function clearActiveStore(): Promise<void> {
  ;(await cookies()).delete(ACTIVE_STORE_COOKIE)
  revalidatePath("/dashboard", "layout")
}
