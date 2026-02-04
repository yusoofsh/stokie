import { TanStackDevtools } from "@tanstack/react-devtools"
import type { QueryClient } from "@tanstack/react-query"
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools"
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
  useRouteContext,
} from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { QueryClientProvider } from "@/components/provider"
import { ThemeProvider } from "@/components/theme/provider"
import { AnchoredToastProvider, ToastProvider } from "@/components/ui/toast"
import appCss from "../app.css?url"

interface RootRouteContext {
  query: QueryClient
}

export const Route = createRootRouteWithContext<RootRouteContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Scaffoe",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShellComponent,
  component: RootComponent,
})

function RootShellComponent({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
            {
              name: "Tanstack Query",
              render: <ReactQueryDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}

function RootComponent() {
  const context = useRouteContext({ from: Route.id })

  return (
    <QueryClientProvider client={context.query}>
      <ThemeProvider>
        <ToastProvider>
          <AnchoredToastProvider>
            <Outlet />
          </AnchoredToastProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
