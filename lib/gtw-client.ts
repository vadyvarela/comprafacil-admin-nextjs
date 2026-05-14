"use client"

import { ApolloClient, InMemoryCache, createHttpLink, from } from "@apollo/client"
import { RetryLink } from "@apollo/client/link/retry"

// Link de retry configurado para tentar novamente em caso de erros temporários
const retryLink = new RetryLink({
  delay: {
    initial: 500,
    max: Infinity,
    jitter: true,
  },
  attempts: {
    max: 3,
      retryIf: (error, _operation) => {
      const err = error as { networkError?: unknown; graphQLErrors?: { message?: string }[] }
      // Retry apenas para erros de rede ou erros JDBC temporários
      if (err?.networkError) {
        return true
      }
      // Retry para erros JDBC Connection
      if (err?.graphQLErrors?.some((e) =>
        e.message?.includes("JDBC Connection") ||
        e.message?.includes("Unable to commit")
      )) {
        return true
      }
      return false
    },
  },
})

// Cliente Apollo que usa API routes do Next.js
// As variáveis de ambiente ficam no servidor (API routes)
const httpLink = createHttpLink({
  uri: "/api/graphql", // API route que faz proxy para o gateway
})

export const gtwClient = new ApolloClient({
  ssrMode: false,
  // Não usar ErrorLink/onError aqui: no Apollo 4 o link de erro acede a `operation.client`
  // antes de estar definido em algumas operações, o que rebenta o `mutate` (ex.: import JSON).
  link: from([retryLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "cache-and-network", // Usar cache quando disponível, mas sempre buscar atualizações
      errorPolicy: "all", // Retornar dados mesmo com erros parciais
    },
    query: {
      fetchPolicy: "network-only", // Sempre buscar do servidor
      errorPolicy: "all",
    },
  },
})
