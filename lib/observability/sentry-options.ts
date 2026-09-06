import type * as Sentry from "@sentry/nextjs"

/** Derivado da assinatura do SDK: um nome de opção errado é apanhado aqui. */
type SentryDataCollection = NonNullable<
  Parameters<typeof Sentry.init>[0]
>["dataCollection"]

/**
 * Recolha de dados do Sentry — partilhada pelos três `Sentry.init` (server,
 * edge, client).
 *
 * Os defaults do SDK são generosos e, num backoffice de comércio, apanham
 * dados de clientes: corpos de pedidos e respostas, cookies de sessão e
 * variáveis locais das stack frames. Nada disto é preciso para diagnosticar
 * erros, e sai da nossa infraestrutura para um terceiro.
 */
export const sentryDataCollection: SentryDataCollection = {
  // Default é false, mas fica explícito: o Sentry não deve popular `user.*`.
  userInfo: false,

  // Default recolhe pedidos e respostas, de entrada e de saída — moradas,
  // telefones, NIF, linhas de encomenda e payloads de pagamento.
  httpBodies: [],

  // Default é true. Aqui vive o cookie de sessão do Auth0.
  cookies: false,

  // Default é true, com filtragem só de nomes reconhecidos como sensíveis.
  // `dl` é o token HMAC de download de faturas e não seria reconhecido.
  urlQueryParams: {
    deny: ["dl", "token", "secret", "code", "state", "access_token", "id_token"],
  },

  // Default é true: capturaria variáveis locais das stack frames, incluindo
  // palavras-passe e tokens em funções de autenticação.
  stackFrameVariables: false,
}

/**
 * Amostragem de traces. 100% em produção é caro e multiplica os dados
 * enviados sem valor de diagnóstico proporcional.
 */
export function sentryTracesSampleRate(): number {
  const raw = Number.parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "")
  if (Number.isFinite(raw) && raw >= 0 && raw <= 1) return raw
  return process.env.NODE_ENV === "production" ? 0.1 : 1
}
