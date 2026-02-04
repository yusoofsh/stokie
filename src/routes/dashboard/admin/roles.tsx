import { createFileRoute } from "@tanstack/react-router"
import { Check, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { statement } from "@/lib/auth/permissions"

export const Route = createFileRoute("/dashboard/admin/roles")({
  component: AdminRolesPage,
})

type Resource = keyof typeof statement

// Define permissions inline to avoid type issues with Better Auth's internal types
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

const ORG_ROLE_PERMISSIONS: Record<string, Record<string, string[]>> = {
  owner: {
    organization: ["read", "update", "delete"],
    member: ["read", "invite", "remove", "update-role"],
  },
  admin: {
    organization: ["read", "update"],
    member: ["read", "invite", "remove"],
  },
  member: {
    organization: ["read"],
    member: ["read"],
  },
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  user: "Akses pengguna dasar dengan perizinan hanya baca",
  editor: "Manajemen konten dengan akses tulis terbatas",
  admin: "Akses sistem penuh dengan semua perizinan",
  owner: "Pemilik organisasi dengan kontrol organisasi penuh",
  member: "Anggota organisasi dengan akses dasar",
}

function hasPermission(
  permissions: Record<string, string[]> | undefined,
  resource: string,
  action: string
) {
  return permissions?.[resource]?.includes(action) ?? false
}

function RolePermissionMatrix({
  rolePermissions,
  title,
}: {
  rolePermissions: Record<string, Record<string, string[]>>
  title: string
}) {
  const roleNames = Object.keys(rolePermissions)
  const resources = Object.keys(statement) as Resource[]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Matriks perizinan menunjukkan kemampuan untuk setiap peran
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-background">
                  Sumber Daya
                </TableHead>
                <TableHead className="sticky left-[100px] bg-background">
                  Tindakan
                </TableHead>
                {roleNames.map((role) => (
                  <TableHead className="text-center capitalize" key={role}>
                    {role}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {resources.map((resource) => {
                const actions = statement[resource]
                return actions.map((action, idx) => (
                  <TableRow key={`${resource}-${action}`}>
                    {idx === 0 && (
                      <TableCell
                        className="sticky left-0 bg-background font-medium capitalize"
                        rowSpan={actions.length}
                      >
                        {resource}
                      </TableCell>
                    )}
                    <TableCell className="sticky left-[100px] bg-background">
                      <Badge variant="outline">{action}</Badge>
                    </TableCell>
                    {roleNames.map((role) => (
                      <TableCell className="text-center" key={role}>
                        {hasPermission(
                          rolePermissions[role],
                          resource,
                          action
                        ) ? (
                          <Check className="mx-auto h-4 w-4 text-green-600" />
                        ) : (
                          <X className="mx-auto h-4 w-4 text-muted-foreground/30" />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

function RoleCard({
  name,
  permissions,
}: {
  name: string
  permissions: Record<string, string[]>
}) {
  const permissionCount = Object.values(permissions).flat().length

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg capitalize">{name}</CardTitle>
          <Badge variant="secondary">{permissionCount} perizinan</Badge>
        </div>
        <CardDescription>
          {ROLE_DESCRIPTIONS[name] || "Peran khusus"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(permissions).map(([resource, actions]) =>
            actions.map((action) => (
              <Badge
                className="font-mono text-xs"
                key={`${resource}:${action}`}
                variant="outline"
              >
                {resource}:{action}
              </Badge>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function AdminRolesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-bold text-3xl">Manajemen Peran</h2>
        <p className="text-muted-foreground">
          Lihat dan kelola peran sistem dan organisasi
        </p>
      </div>

      <Tabs defaultValue="system">
        <TabsList>
          <TabsTrigger value="system">Peran Sistem</TabsTrigger>
          <TabsTrigger value="organization">Peran Organisasi</TabsTrigger>
          <TabsTrigger value="matrix">Matriks Perizinan</TabsTrigger>
        </TabsList>

        <TabsContent className="mt-4 space-y-4" value="system">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(SYSTEM_ROLE_PERMISSIONS).map(
              ([name, permissions]) => (
                <RoleCard key={name} name={name} permissions={permissions} />
              )
            )}
          </div>
        </TabsContent>

        <TabsContent className="mt-4 space-y-4" value="organization">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(ORG_ROLE_PERMISSIONS).map(([name, permissions]) => (
              <RoleCard key={name} name={name} permissions={permissions} />
            ))}
          </div>
        </TabsContent>

        <TabsContent className="mt-4 space-y-6" value="matrix">
          <RolePermissionMatrix
            rolePermissions={SYSTEM_ROLE_PERMISSIONS}
            title="Matriks Peran Sistem"
          />
          <RolePermissionMatrix
            rolePermissions={ORG_ROLE_PERMISSIONS}
            title="Matriks Peran Organisasi"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
