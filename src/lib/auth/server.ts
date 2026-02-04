import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { type BetterAuthOptions, betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import {
  admin,
  haveIBeenPwned,
  multiSession,
  organization,
} from "better-auth/plugins"
import { tanstackStartCookies } from "better-auth/tanstack-start"
import { db } from "@/lib/db"
import { ac, orgRoles, systemRoles } from "./permissions"

export const auth = betterAuth({
  baseURL: process.env.APP_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
  }),
  advanced: {
    database: {
      generateId: false,
    },
  },
  emailAndPassword: {
    enabled: true,
  },
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
    multiSession(),
    haveIBeenPwned(),
    tanstackStartCookies(),
  ],
} satisfies BetterAuthOptions)

export const getSession = createServerFn({ method: "GET" }).handler(() =>
  auth.api.getSession({ headers: getRequestHeaders() })
)

export const checkPermission = createServerFn({ method: "GET" })
  .inputValidator(
    (data: { userId: string; permission: Record<string, string[]> }) => data
  )
  .handler(({ data: { userId, permission } }) =>
    auth.api.userHasPermission({
      body: {
        userId,
        permission,
      },
    })
  )
