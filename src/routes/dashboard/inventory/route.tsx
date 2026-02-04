import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/dashboard/inventory")({
  component: InventoryLayout,
})

function InventoryLayout() {
  return <Outlet />
}
