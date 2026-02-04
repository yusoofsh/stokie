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

// System Roles (Admin Plugin)
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

// Organization Roles (Org Plugin)
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

export type Statement = typeof statement
export type SystemRole = keyof typeof systemRoles
export type OrgRole = keyof typeof orgRoles
