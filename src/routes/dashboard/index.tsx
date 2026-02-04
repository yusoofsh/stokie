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
          <CardTitle>Aktivitas Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pengguna</TableHead>
                <TableHead>Tindakan</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">John Doe</TableCell>
                <TableCell>Masuk</TableCell>
                <TableCell>2024-03-20</TableCell>
                <TableCell className="text-right">Berhasil</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Jane Smith</TableCell>
                <TableCell>Perbarui profil</TableCell>
                <TableCell>2024-03-19</TableCell>
                <TableCell className="text-right">Berhasil</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Bob Johnson</TableCell>
                <TableCell>Gagal masuk</TableCell>
                <TableCell>2024-03-18</TableCell>
                <TableCell className="text-right text-destructive-foreground">
                  Gagal
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
