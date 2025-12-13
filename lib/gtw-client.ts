"use client"

import { ApolloClient, InMemoryCache, createHttpLink, from } from "@apollo/client"
import { onError } from "@apollo/client/link/error"
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
      // Retry apenas para erros de rede ou erros JDBC temporários
      if (error?.networkError) {
        return true
      }
      // Retry para erros JDBC Connection
      if (error?.graphQLErrors?.some((err: any) => 
        err.message?.includes("JDBC Connection") || 
        err.message?.includes("Unable to commit")
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
  link: from([
    onError(({ graphQLErrors, networkError, operation, forward }) => {
      if (graphQLErrors) {
        graphQLErrors.forEach(({ message, locations, path }) => {
          console.error(
            `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
          )
        })
      }
      if (networkError) {
        console.error(`[Network error]: ${networkError}`)
      }
    }),
    retryLink,
    httpLink,
  ]),
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
