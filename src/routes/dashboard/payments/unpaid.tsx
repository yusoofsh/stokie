import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { sales } from "data/schema/inventory"
import { desc, inArray } from "drizzle-orm"
import { Eye } from "lucide-react"
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
const getUnpaidSales = createServerFn({ method: "GET" }).handler(async () => {
  return await db
    .select()
    .from(sales)
    .where(inArray(sales.status, ["unpaid", "partial"]))
    .orderBy(desc(sales.createdAt))
    .limit(100)
})

export const Route = createFileRoute("/dashboard/payments/unpaid")({
  component: UnpaidSalesPage,
})

function UnpaidSalesPage() {
  const { data: salesList, isLoading } = useQuery({
    queryKey: ["payments", "unpaid"],
    queryFn: () => getUnpaidSales(),
  })

  // Calculate totals
  const totalUnpaid =
    salesList?.reduce(
      (sum, sale) => sum + (sale.totalAmount - sale.paidAmount),
      0
    ) ?? 0

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl">Belum Bayar</h1>
          <p className="text-muted-foreground text-sm">
            Daftar penjualan yang belum lunas
          </p>
        </div>
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-sm">Total Piutang</p>
            <p className="font-bold text-2xl text-destructive">
              {formatRupiah(totalUnpaid)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Penjualan Belum Lunas</CardTitle>
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
                  <TableHead className="text-right">Sisa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesList.map((sale) => {
                  const status =
                    saleStatuses[sale.status as keyof typeof saleStatuses]
                  const remaining = sale.totalAmount - sale.paidAmount
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
                      <TableCell className="text-right font-medium text-destructive">
                        {formatRupiah(remaining)}
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
              Tidak ada penjualan yang belum lunas 🎉
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
