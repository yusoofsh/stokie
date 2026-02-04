import { notifyManager } from "@tanstack/react-query"
import { createRouter } from "@tanstack/react-router"
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query"
import Loader from "@/components/loader"
import { getQueryClientContext } from "./components/provider"
import { routeTree } from "./route-tree"

export const getRouter = () => {
  if (typeof document !== "undefined") {
    notifyManager.setScheduler(window.requestAnimationFrame)
  }

  const { query } = getQueryClientContext()

  const router = createRouter({
    routeTree,
    context: { query },
    defaultPreload: "intent",
    defaultPreloadDelay: 500,
    scrollRestoration: true,
    defaultPendingComponent: () => <Loader />,
    defaultNotFoundComponent: () => <div>Not Found</div>,
  })

  setupRouterSsrQueryIntegration({
    queryClient: query,
    router,
  })

  return router
}

// declare module "@tanstack/react-router" {
//   interface Register {
//     router: ReturnType<typeof getRouter>
//   }
// }
