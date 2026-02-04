# RBAC Permissions Management Design

## Overview

Comprehensive RBAC system using Better Auth's built-in access control plugin integrated with the admin and organization plugins.

## Requirements

- **Scope**: System-level global roles
- **Granularity**: Full RBAC (roles + permissions + resource rules)
- **Resources**: Users, Organizations, Audit logs (extensible)
- **Ownership**: Creator, org membership, hierarchical roles
- **Admin UI**: Role management, permission assignment, audit trail
- **Checking**: Route guards + component hooks

## Architecture

### Permission Statement

```typescript
// src/lib/auth/permissions.ts
import { createAccessControl } from "better-auth/plugins/access"

export const statement = {
  // System resources
  user: ["read", "create", "update", "delete", "ban", "impersonate"],
  audit: ["read", "export"],
  role: ["read", "create", "update", "delete", "assign"],
  // Org resources
  organization: ["read", "create", "update", "delete"],
  member: ["read", "invite", "remove", "update-role"],
  // For dynamic role management
  ac: ["read", "create", "update", "delete"],
} as const

export const ac = createAccessControl(statement)
```

### System Roles (Admin Plugin)

```typescript
export const systemRoles = {
  user: ac.newRole({
    user: ["read"],
    organization: ["read"],
  }),
  editor: ac.newRole({
    user: ["read", "update"],
    organization: ["read", "update"],
    member: ["read", "invite"],
    audit: ["read"],
  }),
  admin: ac.newRole({
    user: ["read", "create", "update", "delete", "ban", "impersonate"],
    organization: ["read", "create", "update", "delete"],
    member: ["read", "invite", "remove", "update-role"],
    audit: ["read", "export"],
    role: ["read", "create", "update", "delete", "assign"],
    ac: ["read", "create", "update", "delete"],
  }),
}
```

### Organization Roles (Org Plugin)

```typescript
export const orgRoles = {
  owner: ac.newRole({
    organization: ["read", "update", "delete"],
    member: ["read", "invite", "remove", "update-role"],
  }),
  admin: ac.newRole({
    organization: ["read", "update"],
    member: ["read", "invite", "remove"],
  }),
  member: ac.newRole({
    organization: ["read"],
    member: ["read"],
  }),
}
```

### Server Configuration

```typescript
// src/lib/auth/server.ts
import { admin, organization } from "better-auth/plugins"
import { ac, systemRoles, orgRoles } from "./permissions"

export const auth = betterAuth({
  plugins: [
    admin({
      ac,
      roles: systemRoles,
      defaultRole: "user",
    }),
    organization({
      ac,
      roles: orgRoles,
    }),
  ],
})
```

### Client Configuration

```typescript
// src/lib/auth/client.ts
import { adminClient, organizationClient } from "better-auth/client/plugins"
import { ac, systemRoles, orgRoles } from "./permissions"

export const authClient = createAuthClient({
  plugins: [
    adminClient({
      ac,
      roles: systemRoles,
    }),
    organizationClient({
      ac,
      roles: orgRoles,
    }),
  ],
})
```

## Audit Trail

### Schema

```typescript
// data/schema/audit.ts
export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  targetId: text("target_id"),
  targetType: text("target_type"), // "user" | "role" | "member"
  action: text("action").notNull(), // "role.assign" | "user.ban"
  before: jsonb("before"),
  after: jsonb("after"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})
```

### Helper

```typescript
// src/lib/audit.ts
export async function logAudit(entry: AuditEntry) {
  await db.insert(auditLogs).values({
    ...entry,
    before: entry.before ? JSON.stringify(entry.before) : null,
    after: entry.after ? JSON.stringify(entry.after) : null,
  })
}
```

## Permission Checking

### Server-Side

```typescript
// Route guards in beforeLoad
beforeLoad: async ({ context }) => {
  const { data } = await auth.api.userHasPermission({
    body: {
      userId: context.user.id,
      permissions: { user: ["read"], audit: ["read"] },
    },
  })
  if (!data?.success) throw redirect({ to: "/dashboard" })
}
```

### Client-Side Hook

```typescript
// src/hooks/use-permission.ts
export function usePermission(permissions: Permissions) {
  const { data: session } = authClient.useSession()

  return useQuery({
    queryKey: ["permission", session?.user?.id, permissions],
    queryFn: async () => {
      const { data } = await authClient.admin.userHasPermission({
        userId: session?.user?.id,
        permissions,
      })
      return data?.success ?? false
    },
    enabled: !!session?.user,
  })
}
```

### PermissionGate Component

```typescript
// src/components/permission-gate.tsx
export function PermissionGate({ permissions, fallback, children }: Props) {
  const { data: allowed, isLoading } = usePermission(permissions)

  if (isLoading) return null
  if (!allowed) return fallback ?? null
  return children
}
```

## Admin UI Components

| Route | Features |
|-------|----------|
| `/dashboard/admin/roles` | List roles, permission matrix, create role |
| `/dashboard/admin/permissions` | Resource overview, user permission lookup |
| `/dashboard/admin/audit` | Real logs from DB, filters, export |
| `/dashboard/admin/users` | Enhanced role assignment dropdown |

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/lib/auth/permissions.ts` | Create - AC, roles |
| `src/lib/auth/server.ts` | Modify - add AC config |
| `src/lib/auth/client.ts` | Modify - add AC config |
| `src/lib/audit.ts` | Create - audit helper |
| `data/schema/audit.ts` | Create - audit table |
| `src/hooks/use-permission.ts` | Create - permission hook |
| `src/components/permission-gate.tsx` | Create - UI gate |
| `src/routes/dashboard/admin/roles.tsx` | Modify - full implementation |
| `src/routes/dashboard/admin/permissions.tsx` | Modify - full implementation |
| `src/routes/dashboard/admin/audit.tsx` | Modify - real data |
| `src/routes/dashboard/admin/users.tsx` | Modify - role assignment |
| `src/routes/dashboard/admin/route.tsx` | Modify - permission-based guard |
