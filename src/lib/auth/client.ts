import {
  adminClient,
  multiSessionClient,
  organizationClient,
} from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import { ac, orgRoles, systemRoles } from "./permissions"

export const auth = createAuthClient({
  plugins: [
    adminClient({
      ac,
      roles: systemRoles,
    }),
    organizationClient({
      ac,
      roles: orgRoles,
    }),
    multiSessionClient(),
  ],
})
