import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { products, stockTransactions } from "data/schema/inventory"
import { desc, eq } from "drizzle-orm"
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Box,
  Package,
} from "lucide-react"
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
import { transactionTypes } from "@/lib/inventory/validation"

// Server functions
const getStockOverview = createServerFn({ method: "GET" }).handler(async () => {
  const allProducts = await db
    .select()
    .from(products)
    .orderBy(desc(products.updatedAt))

  const lowStockProducts = allProducts.filter(
    (p) => p.currentStock <= p.minStock
  )

  const totalValue = allProducts.reduce(
    (sum, p) => sum + p.currentStock * p.sellingPrice,
    0
  )

  const totalProducts = allProducts.length
  const totalStock = allProducts.reduce((sum, p) => sum + p.currentStock, 0)

  return {
    products: allProducts,
    lowStockProducts,
    totalValue,
    totalProducts,
    totalStock,
  }
})

const getRecentTransactions = createServerFn({ method: "GET" }).handler(
  async () => {
    const transactions = await db
      .select({
        id: stockTransactions.id,
        type: stockTransactions.type,
        quantity: stockTransactions.quantity,
        reference: stockTransactions.reference,
        transactionDate: stockTransactions.transactionDate,
        product: {
          id: products.id,
          name: products.name,
          sku: products.sku,
        },
      })
      .from(stockTransactions)
      .leftJoin(products, eq(stockTransactions.productId, products.id))
      .orderBy(desc(stockTransactions.transactionDate))
      .limit(10)

    return transactions
  }
)

export const Route = createFileRoute("/dashboard/inventory/")({
  component: InventoryOverview,
})

function InventoryOverview() {
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["inventory", "overview"],
    queryFn: () => getStockOverview(),
  })

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["inventory", "transactions", "recent"],
    queryFn: () => getRecentTransactions(),
  })

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl">Stok Barang</h1>
          <p className="text-muted-foreground text-sm">
            Ringkasan inventori dan stok barang
          </p>
        </div>
        <div className="flex gap-2">
          <Button render={<Link to="/dashboard/inventory/incoming" />}>
            <ArrowDownCircle className="mr-2 h-4 w-4" />
            Barang Masuk
          </Button>
          <Button
            render={<Link to="/dashboard/inventory/outgoing" />}
            variant="outline"
          >
            <ArrowUpCircle className="mr-2 h-4 w-4" />
            Barang Keluar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Produk</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {overviewLoading ? "-" : overview?.totalProducts}
            </div>
            <p className="text-muted-foreground text-xs">Jenis barang</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Stok</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {overviewLoading
                ? "-"
                : overview?.totalStock?.toLocaleString("id-ID")}
            </div>
            <p className="text-muted-foreground text-xs">Unit tersedia</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Nilai Stok</CardTitle>
            <span className="font-medium text-muted-foreground text-sm">
              Rp
            </span>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {overviewLoading ? "-" : formatRupiah(overview?.totalValue ?? 0)}
            </div>
            <p className="text-muted-foreground text-xs">
              Total nilai inventori
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Stok Menipis</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {overviewLoading ? "-" : overview?.lowStockProducts?.length}
            </div>
            <p className="text-muted-foreground text-xs">Perlu restock</p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {overview?.lowStockProducts && overview.lowStockProducts.length > 0 && (
        <Card className="border-warning">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Peringatan Stok Menipis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Nama Produk</TableHead>
                  <TableHead className="text-right">Stok Saat Ini</TableHead>
                  <TableHead className="text-right">Stok Minimum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.lowStockProducts.slice(0, 5).map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono text-sm">
                      {product.sku}
                    </TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="destructive">
                        {product.currentStock} {product.unit}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {product.minStock} {product.unit}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transaksi Terakhir</CardTitle>
          <div className="flex gap-2">
            <Button
              render={<Link to="/dashboard/inventory/incoming" />}
              size="sm"
              variant="ghost"
            >
              Barang Masuk
            </Button>
            <Button
              render={<Link to="/dashboard/inventory/outgoing" />}
              size="sm"
              variant="ghost"
            >
              Barang Keluar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {transactionsLoading && (
            <p className="text-center text-muted-foreground">Memuat...</p>
          )}
          {!transactionsLoading && transactions && transactions.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead>Referensi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      {new Date(tx.transactionDate).toLocaleDateString("id-ID")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={tx.type === "in" ? "default" : "secondary"}
                      >
                        {
                          transactionTypes[
                            tx.type as keyof typeof transactionTypes
                          ]?.label
                        }
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">{tx.product?.name}</span>
                        <span className="ml-2 text-muted-foreground text-xs">
                          {tx.product?.sku}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {tx.type === "in" ? "+" : "-"}
                      {tx.quantity}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {tx.reference || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!transactionsLoading &&
            (!transactions || transactions.length === 0) && (
              <p className="text-center text-muted-foreground">
                Belum ada transaksi
              </p>
            )}
        </CardContent>
      </Card>
    </div>
  )
}
