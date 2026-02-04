import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/dashboard/payments")({
  component: PaymentsLayout,
})

function PaymentsLayout() {
  return <Outlet />
}
