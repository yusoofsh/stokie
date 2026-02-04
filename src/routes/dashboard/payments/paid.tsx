import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { sales } from "data/schema/inventory"
import { desc, eq } from "drizzle-orm"
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
const getPaidSales = createServerFn({ method: "GET" }).handler(async () => {
  return await db
    .select()
    .from(sales)
    .where(eq(sales.status, "paid"))
    .orderBy(desc(sales.updatedAt))
    .limit(100)
})

export const Route = createFileRoute("/dashboard/payments/paid")({
  component: PaidSalesPage,
})

function PaidSalesPage() {
  const { data: salesList, isLoading } = useQuery({
    queryKey: ["payments", "paid"],
    queryFn: () => getPaidSales(),
  })

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="font-semibold text-2xl">Sudah Bayar</h1>
        <p className="text-muted-foreground text-sm">
          Daftar penjualan yang sudah lunas
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Penjualan Lunas</CardTitle>
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
              Belum ada penjualan yang lunas
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
