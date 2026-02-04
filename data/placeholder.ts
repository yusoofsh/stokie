import type { LucideIcon } from "lucide-react"
import { FileText, LayoutDashboard, Users } from "lucide-react"

// Placeholder audit logs
export const auditLogs = [
  {
    _id: "log_1",
    timestamp: Date.now() - 3_600_000,
    user: { name: "Demo User", email: "demo@example.com" },
    action: "LOGIN",
    resource: "auth",
    resourceId: null,
    changes: null,
  },
  {
    _id: "log_2",
    timestamp: Date.now() - 7_200_000,
    user: { name: "Demo User", email: "demo@example.com" },
    action: "UPDATE_ROLE",
    resource: "user",
    resourceId: "user_2",
    changes: "role: user → editor",
  },
  {
    _id: "log_3",
    timestamp: Date.now() - 86_400_000,
    user: { name: "Test User", email: "test@example.com" },
    action: "CREATE",
    resource: "document",
    resourceId: "doc_1",
    changes: null,
  },
]

// Menu types and data
export interface NavSubItem {
  title: string
  url: string
  icon?: LucideIcon
  comingSoon?: boolean
  newTab?: boolean
}

export interface NavMainItem {
  title: string
  url: string
  icon?: LucideIcon
  comingSoon?: boolean
  newTab?: boolean
  subItems?: NavSubItem[]
}

export interface NavGroup {
  id: string
  label?: string
  items: NavMainItem[]
}

export const sidebarMenu: NavGroup[] = [
  {
    id: "main",
    label: "Main",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: "admin",
    label: "Administration",
    items: [
      {
        title: "Users",
        url: "/dashboard/admin/users",
        icon: Users,
      },
      {
        title: "Audit",
        url: "/dashboard/admin/audit",
        icon: FileText,
      },
    ],
  },
]
