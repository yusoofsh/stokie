import { createFileRoute } from "@tanstack/react-router"
import { SectionCards } from "@/components/dashboard/section-cards"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const Route = createFileRoute("/dashboard/")({
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <SectionCards />

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">John Doe</TableCell>
                <TableCell>Logged in</TableCell>
                <TableCell>2024-03-20</TableCell>
                <TableCell className="text-right">Success</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Jane Smith</TableCell>
                <TableCell>Updated profile</TableCell>
                <TableCell>2024-03-19</TableCell>
                <TableCell className="text-right">Success</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Bob Johnson</TableCell>
                <TableCell>Failed sign in</TableCell>
                <TableCell>2024-03-18</TableCell>
                <TableCell className="text-right text-destructive-foreground">
                  Failed
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
