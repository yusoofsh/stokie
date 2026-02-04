import { relations } from "drizzle-orm"
import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { v7 } from "uuid"
import { users } from "./auth"

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id")
      .primaryKey()
      .$default(() => v7()),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    targetId: text("target_id"),
    targetType: text("target_type"), // "user" | "role" | "member" | "organization"
    action: text("action").notNull(), // "role.assign" | "user.ban" | "user.create" etc
    before: jsonb("before"),
    after: jsonb("after"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("audit_logs_userId_idx").on(table.userId),
    index("audit_logs_createdAt_idx").on(table.createdAt),
  ]
)

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}))

export type AuditLog = typeof auditLogs.$inferSelect
export type NewAuditLog = typeof auditLogs.$inferInsert
