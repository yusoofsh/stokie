import type { LucideIcon } from "lucide-react"
import {
  Box,
  CheckCircle,
  Clock,
  FileText,
  LayoutDashboard,
  Package,
  PackageMinus,
  PackagePlus,
  ShoppingCart,
  Users,
} from "lucide-react"

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
    label: "Utama",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: "inventory",
    label: "Inventori",
    items: [
      {
        title: "Stok",
        url: "/dashboard/inventory",
        icon: Package,
      },
      {
        title: "Produk",
        url: "/dashboard/inventory/products",
        icon: Box,
      },
      {
        title: "Barang Masuk",
        url: "/dashboard/inventory/incoming",
        icon: PackagePlus,
      },
      {
        title: "Barang Keluar",
        url: "/dashboard/inventory/outgoing",
        icon: PackageMinus,
      },
    ],
  },
  {
    id: "sales",
    label: "Penjualan",
    items: [
      {
        title: "Penjualan",
        url: "/dashboard/sales",
        icon: ShoppingCart,
      },
    ],
  },
  {
    id: "payments",
    label: "Pembayaran",
    items: [
      {
        title: "Sudah Bayar",
        url: "/dashboard/payments/paid",
        icon: CheckCircle,
      },
      {
        title: "Belum Bayar",
        url: "/dashboard/payments/unpaid",
        icon: Clock,
      },
    ],
  },
  {
    id: "admin",
    label: "Administrasi",
    items: [
      {
        title: "Pengguna",
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
