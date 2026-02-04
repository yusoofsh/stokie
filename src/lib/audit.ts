import type { NewAuditLog } from "data/schema"
import { auditLogs } from "data/schema"
import { db } from "./db"

export function logAudit(entry: NewAuditLog) {
  return db.insert(auditLogs).values(entry)
}

export function getAuditLogs(options?: { limit?: number; offset?: number }) {
  const { limit = 50, offset = 0 } = options ?? {}

  return db.query.auditLogs.findMany({
    with: {
      user: true,
    },
    orderBy: (logs, { desc }) => [desc(logs.createdAt)],
    limit,
    offset,
  })
}
