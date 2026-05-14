"use client"

import { ApolloClient, InMemoryCache, from } from "@apollo/client"
import { BaseHttpLink } from "@apollo/client/link/http"
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
      retryIf: (error) => {
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

// BaseHttpLink em vez de createHttpLink/HttpLink: o HttpLink do Apollo 4 inclui
// ClientAwarenessLink, que acede a `operation.client` — em mutações sequenciais
// isso pode falhar intermitentemente ("Cannot read properties of undefined (reading 'client')").
const httpLink = new BaseHttpLink({
  uri: "/api/graphql",
})

export const gtwClient = new ApolloClient({
  ssrMode: false,
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
