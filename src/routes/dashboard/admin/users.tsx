import { queryOptions, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import type { UserWithRole } from "better-auth/plugins"
import { Ban, Shield, UserCog, UserPlus } from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useAdmin } from "@/hooks/use-admin"
import { auth } from "@/lib/auth/client"

const getListUser = async () => {
  const data = await auth.admin.listUsers({
    query: {
      limit: 10,
      sortBy: "createdAt",
      sortDirection: "desc",
    },
    fetchOptions: {
      throw: true,
    },
  })

  return {
    users: data.users as UserWithRole[],
    total: data.total,
    limit: "limit" in data ? data.limit : undefined,
    offset: "offset" in data ? data.offset : undefined,
  }
}

const getListUserQuery = queryOptions({
  queryKey: ["users"],
  queryFn: () => getListUser(),
})

export const Route = createFileRoute("/dashboard/admin/users")({
  component: AdminUsersPage,
})

function AdminUsersPage() {
  const { data, isLoading } = useQuery(getListUserQuery)

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)

  const {
    createUser,
    setRole,
    banUser: banUserMutation,
    unbanUser: unbanUserMutation,
    isCreating,
    isRoleChanging,
    isBanning,
    isUnbanning,
    changingRoleUserId,
  } = useAdmin()

  const handleCreateUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    createUser(
      {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        name: formData.get("name") as string,
      },
      {
        onSuccess: () => {
          setCreateDialogOpen(false)
        },
      }
    )
  }

  const handleBanUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedUser) {
      return
    }
    const formData = new FormData(e.currentTarget)
    const banReason = formData.get("banReason") as string
    const banDays = formData.get("banDays") as string
    banUserMutation(
      {
        userId: selectedUser,
        banReason: banReason || undefined,
        banExpiresIn: banDays
          ? Number.parseInt(banDays, 10) * 24 * 60 * 60
          : undefined,
      },
      {
        onSuccess: () => {
          setBanDialogOpen(false)
          setSelectedUser(null)
        },
      }
    )
  }

  if (isLoading || !data) {
    return null
  }

  if (data.users.length === 0) {
    return (
      <div className="container mx-auto py-8 text-center text-muted-foreground">
        No users found. Use the "Create User" button to add new users.
      </div>
    )
  }

  const { users } = data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-3xl">User Management</h2>
          <p className="text-muted-foreground">View and manage system users</p>
        </div>
        <Dialog onOpenChange={setCreateDialogOpen} open={createDialogOpen}>
          <DialogTrigger>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreateUser}>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to the system with specified role
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" required type="email" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    minLength={8}
                    name="password"
                    required
                    type="password"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select defaultValue="user" name="role">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button disabled={isCreating} type="submit">
                  {isCreating ? "Creating..." : "Create User"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No users found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <UserRow
                    changingRoleUserId={changingRoleUserId}
                    isRoleChanging={isRoleChanging}
                    isUnbanning={isUnbanning}
                    key={user.id}
                    onOpenBan={(id) => {
                      setSelectedUser(id)
                      setBanDialogOpen(true)
                    }}
                    onUnban={(id) => unbanUserMutation(id)}
                    setRole={setRole}
                    user={user}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog onOpenChange={setBanDialogOpen} open={banDialogOpen}>
        <DialogContent>
          <form onSubmit={handleBanUser}>
            <DialogHeader>
              <DialogTitle>Ban User</DialogTitle>
              <DialogDescription>
                Prevent this user from accessing the system
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="banReason">Reason (optional)</Label>
                <Textarea
                  id="banReason"
                  name="banReason"
                  placeholder="Enter reason for ban..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="banDays">
                  Ban Duration (days, leave empty for permanent)
                </Label>
                <Input
                  id="banDays"
                  min="1"
                  name="banDays"
                  placeholder="Leave empty for permanent ban"
                  type="number"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => setBanDialogOpen(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={isBanning} type="submit" variant="destructive">
                {isBanning ? "Banning..." : "Ban User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function UserRow({
  user,
  onOpenBan,
  onUnban,
  setRole,
  isRoleChanging,
  changingRoleUserId,
  isUnbanning,
}: {
  user: UserWithRole
  onOpenBan: (id: string) => void
  onUnban: (id: string) => void
  setRole: ReturnType<typeof useAdmin>["setRole"]
  isRoleChanging: boolean
  changingRoleUserId?: string | null
  isUnbanning: boolean
}) {
  const [currentRole, setCurrentRole] = useState<string>(user.role || "")
  const [selectedRole, setSelectedRole] = useState<string>(user.role || "")

  const handleAssignRole = () => {
    if (!selectedRole || selectedRole === currentRole) {
      return
    }

    setRole(
      { userId: user.id, role: selectedRole },
      {
        onSuccess: () => {
          setCurrentRole(selectedRole)
        },
      }
    )
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{user.name || "—"}</TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>
        <Badge variant={currentRole === "admin" ? "default" : "secondary"}>
          {currentRole || "user"}
        </Badge>
      </TableCell>
      <TableCell>
        {user.banned ? (
          <Badge variant="destructive">
            <Ban className="mr-1 h-3 w-3" />
            Banned
          </Badge>
        ) : (
          <Badge variant="outline">Active</Badge>
        )}
      </TableCell>
      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
      <TableCell className="space-x-2 text-right">
        <div className="flex items-center justify-end gap-2">
          <Select
            onValueChange={(value) => {
              if (value) {
                setSelectedRole(value)
              }
            }}
            value={selectedRole || currentRole || ""}
          >
            <SelectTrigger className="w-30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>

          {selectedRole && selectedRole !== currentRole && (
            <Button
              disabled={isRoleChanging && changingRoleUserId === user.id}
              onClick={handleAssignRole}
              size="sm"
              variant="outline"
            >
              <UserCog className="mr-1 h-4 w-4" />
              {isRoleChanging && changingRoleUserId === user.id
                ? "Updating..."
                : "Update"}
            </Button>
          )}

          {user.banned ? (
            <Button
              disabled={isUnbanning}
              onClick={() => onUnban(user.id)}
              size="sm"
              variant="outline"
            >
              <Shield className="mr-1 h-4 w-4" />
              Unban
            </Button>
          ) : (
            <Button
              onClick={() => onOpenBan(user.id)}
              size="sm"
              variant="destructive"
            >
              <Ban className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}
