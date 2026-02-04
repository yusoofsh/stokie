import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Check, Search, X } from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { auth } from "@/lib/auth/client"
import { statement } from "@/lib/auth/permissions"

export const Route = createFileRoute("/dashboard/admin/permissions")({
  component: AdminPermissionsPage,
})

type Resource = keyof typeof statement

const RESOURCE_DESCRIPTIONS: Record<Resource, string> = {
  user: "Akun pengguna dan profil",
  audit: "Log audit sistem dan pelacakan aktivitas",
  role: "Definisi peran dan penetapan",
  organization: "Manajemen organisasi",
  member: "Keanggotaan organisasi",
  ac: "Konfigurasi kontrol akses",
  product: "Katalog produk dan item inventori",
  stock: "Tingkat stok dan penyesuaian",
  sale: "Transaksi penjualan",
  payment: "Pemrosesan pembayaran",
  report: "Laporan dan analitik",
}

function ResourceCard({
  resource,
  actions,
}: {
  resource: Resource
  actions: readonly string[]
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg capitalize">{resource}</CardTitle>
        <CardDescription>{RESOURCE_DESCRIPTIONS[resource]}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1.5">
          {actions.map((action) => (
            <Badge key={action} variant="outline">
              {action}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function UserPermissionLookup() {
  const [userId, setUserId] = useState("")
  const [searchedUserId, setSearchedUserId] = useState<string | null>(null)

  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["admin-users-list"],
    queryFn: async () => {
      const result = await auth.admin.listUsers({
        query: { limit: 100 },
      })
      return result.data?.users ?? []
    },
  })

  const { data: userPermissions, isLoading: isCheckingPermissions } = useQuery({
    queryKey: ["user-permissions", searchedUserId],
    queryFn: async () => {
      if (!searchedUserId) {
        return null
      }

      const permissions: Record<string, Record<string, boolean>> = {}

      for (const [resource, actions] of Object.entries(statement)) {
        permissions[resource] = {}
        for (const action of actions) {
          const result = await auth.admin.hasPermission({
            userId: searchedUserId,
            permission: { [resource]: [action] },
          })
          permissions[resource][action] = result.data?.success ?? false
        }
      }

      return permissions
    },
    enabled: !!searchedUserId,
  })

  const selectedUser = users?.find((u) => u.id === searchedUserId)

  const handleSearch = () => {
    if (userId.trim()) {
      setSearchedUserId(userId.trim())
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pencarian Perizinan Pengguna</CardTitle>
        <CardDescription>
          Periksa perizinan apa yang dimiliki pengguna tertentu
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label className="sr-only" htmlFor="userId">
              ID Pengguna
            </Label>
            <Input
              id="userId"
              list="user-suggestions"
              onChange={(e) => setUserId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Masukkan ID pengguna atau pilih dari daftar..."
              value={userId}
            />
            <datalist id="user-suggestions">
              {users?.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </datalist>
          </div>
          <Button
            disabled={isLoadingUsers || isCheckingPermissions}
            onClick={handleSearch}
          >
            <Search className="mr-2 h-4 w-4" />
            Periksa
          </Button>
        </div>

        {selectedUser && (
          <div className="rounded-lg border bg-muted/50 p-3">
            <div className="font-medium">{selectedUser.name}</div>
            <div className="text-muted-foreground text-sm">
              {selectedUser.email}
            </div>
            <Badge className="mt-1 capitalize" variant="secondary">
              {selectedUser.role || "pengguna"}
            </Badge>
          </div>
        )}

        {isCheckingPermissions && (
          <div className="py-4 text-center text-muted-foreground">
            Memeriksa perizinan...
          </div>
        )}

        {userPermissions && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sumber Daya</TableHead>
                  <TableHead>Tindakan</TableHead>
                  <TableHead className="text-center">Diizinkan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(statement).map(([resource, actions]) =>
                  actions.map((action, idx) => (
                    <TableRow key={`${resource}-${action}`}>
                      {idx === 0 && (
                        <TableCell
                          className="font-medium capitalize"
                          rowSpan={actions.length}
                        >
                          {resource}
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge variant="outline">{action}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {userPermissions[resource]?.[action] ? (
                          <Check className="mx-auto h-4 w-4 text-green-600" />
                        ) : (
                          <X className="mx-auto h-4 w-4 text-red-500" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const SYSTEM_ROLE_PERMISSIONS: Record<string, Record<string, string[]>> = {
  user: {
    user: ["read"],
    organization: ["read"],
  },
  editor: {
    user: ["read", "update"],
    organization: ["read", "update"],
    member: ["read", "invite"],
    audit: ["read"],
  },
  admin: {
    user: ["read", "create", "update", "delete", "ban", "impersonate"],
    organization: ["read", "create", "update", "delete"],
    member: ["read", "invite", "remove", "update-role"],
    audit: ["read", "export"],
    role: ["read", "create", "update", "delete", "assign"],
    ac: ["read", "create", "update", "delete"],
  },
}

function RoleQuickCheck() {
  const resources = Object.keys(statement) as Resource[]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Referensi Cepat Peran</CardTitle>
        <CardDescription>
          Ringkasan perizinan untuk setiap peran sistem
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {Object.entries(SYSTEM_ROLE_PERMISSIONS).map(
            ([roleName, rolePermissions]) => {
              const permCount = Object.values(rolePermissions).flat().length

              return (
                <div className="rounded-lg border p-3" key={roleName}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium capitalize">{roleName}</span>
                    <Badge variant="secondary">{permCount}</Badge>
                  </div>
                  <div className="space-y-1 text-sm">
                    {resources.map((resource) => {
                      const actions = rolePermissions[resource]
                      if (!actions) {
                        return null
                      }
                      return (
                        <div
                          className="flex items-center gap-2 text-muted-foreground"
                          key={resource}
                        >
                          <span className="capitalize">{resource}:</span>
                          <span className="font-mono text-xs">
                            {actions.length} actions
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            }
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function AdminPermissionsPage() {
  const resources = Object.entries(statement) as [Resource, readonly string[]][]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-bold text-3xl">Manajemen Perizinan</h2>
        <p className="text-muted-foreground">
          Lihat sumber daya sistem dan periksa perizinan pengguna
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {resources.map(([resource, actions]) => (
          <ResourceCard actions={actions} key={resource} resource={resource} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <UserPermissionLookup />
        <RoleQuickCheck />
      </div>
    </div>
  )
}
