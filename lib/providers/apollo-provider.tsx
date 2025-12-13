"use client"

import { ApolloProvider } from "@apollo/client/react"
import { gtwClient } from "@/lib/gtw-client"

export function ApolloClientProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return <ApolloProvider client={gtwClient}>{children}</ApolloProvider>
}

