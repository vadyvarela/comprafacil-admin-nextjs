import "server-only";
import { getPrincipal } from "@/lib/auth/principal";

/**
 * `X-Store-Id` da loja onde a pessoa está a trabalhar, para pedidos feitos
 * com o token de serviço (`CMS_ACCESS_TOKEN`).
 *
 * Vem do principal e não do cookie de propósito. O token de serviço entra em
 * qualquer loja que se lhe peça; o cookie é escrito pelo browser. Ler o cookie
 * directamente deixava qualquer pessoa da equipa apontar o token de serviço a
 * uma loja de que não é membro. O principal já passou pela API, que só o
 * resolve para lojas a que a pessoa pertence.
 *
 * Sem sessão não há cabeçalho, e a API usa a loja por defeito — o mesmo
 * comportamento de antes do seletor existir.
 */
export async function activeStoreHeader(): Promise<Record<string, string>> {
  const principal = await getPrincipal();
  return principal?.activeStoreId
    ? { "X-Store-Id": principal.activeStoreId }
    : {};
}
