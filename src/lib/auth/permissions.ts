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
  // Inventory resources
  product: ["read", "create", "update", "delete"],
  stock: ["read", "create", "adjust"],
  // Sales resources
  sale: ["read", "create", "update", "delete", "void"],
  payment: ["read", "create", "refund"],
  // Reporting
  report: ["read", "export"],
} as const

export const ac = createAccessControl(statement)

// System Roles (Admin Plugin)
export const systemRoles = {
  user: ac.newRole({
    user: ["read"],
    organization: ["read"],
    // Inventory: read-only access
    product: ["read"],
    stock: ["read"],
    sale: ["read"],
    payment: ["read"],
  }),
  editor: ac.newRole({
    user: ["read", "update"],
    organization: ["read", "update"],
    member: ["read", "invite"],
    audit: ["read"],
    // Inventory: full operational access
    product: ["read", "create", "update"],
    stock: ["read", "create", "adjust"],
    sale: ["read", "create", "update"],
    payment: ["read", "create"],
    report: ["read"],
  }),
  admin: ac.newRole({
    user: ["read", "create", "update", "delete", "ban", "impersonate"],
    organization: ["read", "create", "update", "delete"],
    member: ["read", "invite", "remove", "update-role"],
    audit: ["read", "export"],
    role: ["read", "create", "update", "delete", "assign"],
    ac: ["read", "create", "update", "delete"],
    // Inventory: full access including delete and void
    product: ["read", "create", "update", "delete"],
    stock: ["read", "create", "adjust"],
    sale: ["read", "create", "update", "delete", "void"],
    payment: ["read", "create", "refund"],
    report: ["read", "export"],
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
