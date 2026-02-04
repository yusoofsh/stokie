import { queryOptions, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { Download, RefreshCw } from "lucide-react"
import { useState } from "react"
import { PermissionGate } from "@/components/permission-gate"
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
import { getAuditLogs } from "@/lib/audit"

interface AuditLog {
  id: string
  userId: string | null
  targetId: string | null
  targetType: string | null
  action: string
  before: Record<string, object> | null
  after: Record<string, object> | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
  user: {
    id: string
    name: string
    email: string
  } | null
}

const fetchAuditLogs = createServerFn({ method: "GET" }).handler(async () => {
  const logs = await getAuditLogs({ limit: 100 })
  return logs as unknown as AuditLog[]
})

const auditLogsQuery = queryOptions({
  queryKey: ["audit-logs"],
  queryFn: () => fetchAuditLogs(),
})

export const Route = createFileRoute("/dashboard/admin/audit")({
  component: AdminAuditPage,
})

const ACTION_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  create: "default",
  update: "secondary",
  delete: "destructive",
  ban: "destructive",
  assign: "secondary",
  read: "outline",
  export: "outline",
}

function getActionVariant(action: string) {
  const actionLower = action.toLowerCase()
  for (const [key, variant] of Object.entries(ACTION_VARIANTS)) {
    if (actionLower.includes(key)) {
      return variant
    }
  }
  return "outline"
}

function formatTimestamp(date: Date | string) {
  return new Date(date).toLocaleString()
}

function formatJson(value: unknown) {
  if (!value) {
    return null
  }
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value
    return JSON.stringify(parsed, null, 2)
  } catch {
    return String(value)
  }
}

function AuditLogTable({ logs }: { logs: AuditLog[] }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Target</TableHead>
            <TableHead>Changes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="whitespace-nowrap text-xs">
                {formatTimestamp(log.createdAt)}
              </TableCell>
              <TableCell>
                {log.user ? (
                  <div>
                    <div className="font-medium">{log.user.name || "—"}</div>
                    <div className="text-muted-foreground text-xs">
                      {log.user.email}
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">System</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={getActionVariant(log.action)}>
                  {log.action.replace(/[._]/g, " ")}
                </Badge>
              </TableCell>
              <TableCell>
                {log.targetType && (
                  <div>
                    <div className="font-medium capitalize">
                      {log.targetType}
                    </div>
                    {log.targetId && (
                      <div className="font-mono text-muted-foreground text-xs">
                        {log.targetId.slice(0, 12)}...
                      </div>
                    )}
                  </div>
                )}
              </TableCell>
              <TableCell>
                {log.before || log.after ? (
                  <details className="cursor-pointer">
                    <summary className="text-muted-foreground text-xs">
                      View changes
                    </summary>
                    <div className="mt-2 space-y-2">
                      {log.before && (
                        <div>
                          <div className="font-medium text-xs">Before:</div>
                          <pre className="max-h-24 max-w-xs overflow-auto rounded bg-muted p-2 text-xs">
                            {formatJson(log.before) ?? ""}
                          </pre>
                        </div>
                      )}
                      {log.after && (
                        <div>
                          <div className="font-medium text-xs">After:</div>
                          <pre className="max-h-24 max-w-xs overflow-auto rounded bg-muted p-2 text-xs">
                            {formatJson(log.after) ?? ""}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function AdminAuditPage() {
  const {
    data: logs = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery(auditLogsQuery)

  const [actionFilter, setActionFilter] = useState<string>("all")
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const uniqueActions = [...new Set(logs.map((log) => log.action))]
  const uniqueTargetTypes = [
    ...new Set(logs.map((log) => log.targetType).filter(Boolean)),
  ] as string[]

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== "all" && log.action !== actionFilter) {
      return false
    }
    if (targetTypeFilter !== "all" && log.targetType !== targetTypeFilter) {
      return false
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesUser =
        log.user?.name?.toLowerCase().includes(query) ||
        log.user?.email?.toLowerCase().includes(query)
      const matchesTarget = log.targetId?.toLowerCase().includes(query)
      const matchesAction = log.action.toLowerCase().includes(query)
      if (!(matchesUser || matchesTarget || matchesAction)) {
        return false
      }
    }
    return true
  })

  const handleExport = () => {
    const csv = [
      [
        "Timestamp",
        "User",
        "Action",
        "Target Type",
        "Target ID",
        "Before",
        "After",
        "IP Address",
        "User Agent",
      ],
      ...filteredLogs.map((log) => [
        new Date(log.createdAt).toISOString(),
        log.user?.email || "System",
        log.action,
        log.targetType || "",
        log.targetId || "",
        formatJson(log.before) || "",
        formatJson(log.after) || "",
        log.ipAddress || "",
        log.userAgent || "",
      ]),
    ]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="py-8 text-center text-muted-foreground">
          Loading audit logs...
        </div>
      )
    }
    if (filteredLogs.length === 0) {
      const message =
        logs.length === 0
          ? "No audit logs recorded yet"
          : "No logs match your filters"
      return (
        <div className="py-8 text-center text-muted-foreground">{message}</div>
      )
    }
    return <AuditLogTable logs={filteredLogs} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-3xl">Audit Logs</h2>
          <p className="text-muted-foreground">
            View system activity and changes
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            disabled={isRefetching}
            onClick={() => refetch()}
            size="sm"
            variant="outline"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <PermissionGate permissions={{ audit: ["export"] }}>
            <Button
              disabled={filteredLogs.length === 0}
              onClick={handleExport}
              size="sm"
              variant="outline"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </PermissionGate>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter audit logs by action, target type, or search
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-48">
              <Select
                onValueChange={(value) => {
                  if (value) {
                    setActionFilter(value)
                  }
                }}
                value={actionFilter}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {uniqueActions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select
                onValueChange={(value) => {
                  if (value) {
                    setTargetTypeFilter(value)
                  }
                }}
                value={targetTypeFilter}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Targets</SelectItem>
                  {uniqueTargetTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Input
                className="max-w-sm"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by user, target, or action..."
                value={searchQuery}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity ({filteredLogs.length})</CardTitle>
        </CardHeader>
        <CardContent>{renderContent()}</CardContent>
      </Card>
    </div>
  )
}
