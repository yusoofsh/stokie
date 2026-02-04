import {
  QueryClient,
  QueryClientProvider as TanStackQueryClientProvider,
} from "@tanstack/react-query"

export function getQueryClientContext() {
  const query = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
      },
    },
  })

  return {
    query,
  }
}

export function QueryClientProvider({
  children,
  client,
}: {
  children: React.ReactNode
  client: QueryClient
}) {
  return (
    <TanStackQueryClientProvider client={client}>
      {children}
    </TanStackQueryClientProvider>
  )
}
