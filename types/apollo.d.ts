import "@apollo/client"

declare module "@apollo/client" {
  export namespace ApolloClient {
    export namespace DeclareDefaultOptions {
      interface WatchQuery {
        errorPolicy?: "all"
      }

      interface Query {
        errorPolicy?: "all"
      }
    }
  }
}
