import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { checkPermission } from "@/lib/auth/server"

export const Route = createFileRoute("/dashboard/admin")({
  component: AdminLayout,
  beforeLoad: async ({ context }) => {
    const result = await checkPermission({
      data: {
        userId: context.user.id,
        permission: { user: ["read"], audit: ["read"] },
      },
    })

    if (!result.success) {
      throw redirect({
        to: "/dashboard",
      })
    }
  },
})

function AdminLayout() {
  return <Outlet />
}
