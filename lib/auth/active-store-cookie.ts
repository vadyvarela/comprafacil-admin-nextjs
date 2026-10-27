import "server-only";
import { cookies } from "next/headers";

/**
 * A loja escolhida no seletor, guardada num cookie.
 *
 * Só guarda a escolha. Quem decide se a pessoa pode mesmo trabalhar nessa loja
 * é a API, ao receber o `X-Store-Id` — um cookie adulterado dá 401, não acesso.
 */
export const ACTIVE_STORE_COOKIE = "bo_active_store";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function readActiveStoreCookie(): Promise<string | null> {
  const value = (await cookies()).get(ACTIVE_STORE_COOKIE)?.value?.trim();
  return value && UUID.test(value) ? value : null;
}
