import type { ReactNode } from "react"
import { usePermission } from "@/hooks/use-permission"
import type { Statement } from "@/lib/auth/permissions"

type Permissions = {
  [K in keyof Statement]?: Statement[K][number][]
}

interface PermissionGateProps {
  permissions: Permissions
  fallback?: ReactNode
  children: ReactNode
}

export function PermissionGate({
  permissions,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { data: allowed, isLoading } = usePermission(permissions)

  if (isLoading) {
    return null
  }
  if (!allowed) {
    return fallback
  }

  return children
}
