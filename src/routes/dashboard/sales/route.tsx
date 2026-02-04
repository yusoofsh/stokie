import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/dashboard/sales")({
  component: SalesLayout,
})

function SalesLayout() {
  return <Outlet />
}
