import { FileText, LayoutDashboard, Lock, Shield, Users } from "lucide-react"

export const menuIcon = {
  dashboard: LayoutDashboard,
  "admin-users": Users,
  "admin-roles": Lock,
  "admin-permissions": Shield,
  "admin-audit": FileText,
} as const
