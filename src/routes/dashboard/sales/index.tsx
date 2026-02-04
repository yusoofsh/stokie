import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { sales } from "data/schema/inventory"
import { desc } from "drizzle-orm"
import { Eye, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatRupiah } from "@/lib/currency"
import { db } from "@/lib/db"
import { saleStatuses } from "@/lib/inventory/validation"

// Server functions
const getSales = createServerFn({ method: "GET" }).handler(async () => {
  return await db.select().from(sales).orderBy(desc(sales.createdAt)).limit(100)
})

export const Route = createFileRoute("/dashboard/sales/")({
  component: SalesListPage,
})

function SalesListPage() {
  const { data: salesList, isLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: () => getSales(),
  })

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl">Penjualan</h1>
          <p className="text-muted-foreground text-sm">
            Daftar semua transaksi penjualan
          </p>
        </div>
        <Button render={<Link to="/dashboard/sales/new" />}>
          <Plus className="mr-2 h-4 w-4" />
          Penjualan Baru
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Penjualan</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <p className="text-center text-muted-foreground">Memuat...</p>
          )}
          {!isLoading && salesList && salesList.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Invoice</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Dibayar</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesList.map((sale) => {
                  const status =
                    saleStatuses[sale.status as keyof typeof saleStatuses]
                  return (
                    <TableRow key={sale.id}>
                      <TableCell className="font-mono text-sm">
                        {sale.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        {new Date(sale.createdAt).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell>{sale.customerName || "-"}</TableCell>
                      <TableCell className="text-right">
                        {formatRupiah(sale.totalAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatRupiah(sale.paidAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status?.variant || "secondary"}>
                          {status?.label || sale.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          render={
                            <Link
                              params={{ id: sale.id }}
                              to="/dashboard/sales/$id"
                            />
                          }
                          size="sm"
                          variant="ghost"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
          {!isLoading && (!salesList || salesList.length === 0) && (
            <p className="text-center text-muted-foreground">
              Belum ada penjualan. Klik "Penjualan Baru" untuk membuat
              transaksi.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
