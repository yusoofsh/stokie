import { useQuery } from "@tanstack/react-query"
import { auth } from "@/lib/auth/client"
import type { Statement } from "@/lib/auth/permissions"

type Permissions = {
  [K in keyof Statement]?: Statement[K][number][]
}

export function usePermission(permissions: Permissions) {
  const { data: session } = auth.useSession()

  return useQuery({
    queryKey: ["permission", session?.user?.id, permissions],
    queryFn: async () => {
      if (!session?.user?.id) {
        return false
      }

      const { data } = await auth.admin.hasPermission({
        permission: permissions,
      })
      return data?.success ?? false
    },
    enabled: !!session?.user,
  })
}

export function useCheckRolePermission(
  role: "user" | "editor" | "admin",
  permissions: Permissions
) {
  return auth.admin.checkRolePermission({
    role,
    permissions,
  })
}
