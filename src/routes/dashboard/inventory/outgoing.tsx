import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { products, stockTransactions } from "data/schema/inventory"
import { desc, eq, sql } from "drizzle-orm"
import { ArrowLeft, Plus } from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { db } from "@/lib/db"

// Server functions
const getProductsForSelect = createServerFn({ method: "GET" }).handler(
  async () => {
    return await db
      .select({
        id: products.id,
        sku: products.sku,
        name: products.name,
        unit: products.unit,
        sellingPrice: products.sellingPrice,
        currentStock: products.currentStock,
      })
      .from(products)
      .orderBy(products.name)
  }
)

const getOutgoingTransactions = createServerFn({ method: "GET" }).handler(
  async () => {
    return await db
      .select({
        id: stockTransactions.id,
        quantity: stockTransactions.quantity,
        unitPrice: stockTransactions.unitPrice,
        reference: stockTransactions.reference,
        notes: stockTransactions.notes,
        transactionDate: stockTransactions.transactionDate,
        product: {
          id: products.id,
          sku: products.sku,
          name: products.name,
          unit: products.unit,
        },
      })
      .from(stockTransactions)
      .leftJoin(products, eq(stockTransactions.productId, products.id))
      .where(eq(stockTransactions.type, "out"))
      .orderBy(desc(stockTransactions.transactionDate))
      .limit(50)
  }
)

const createOutgoingTransaction = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      productId: string
      quantity: number
      unitPrice?: number
      reference?: string
      notes?: string
    }) => data
  )
  .handler(async ({ data }) => {
    // Check stock availability
    const [product] = await db
      .select({ currentStock: products.currentStock })
      .from(products)
      .where(eq(products.id, data.productId))

    if (!product || product.currentStock < data.quantity) {
      throw new Error("Stok tidak mencukupi")
    }

    // Insert transaction
    const [transaction] = await db
      .insert(stockTransactions)
      .values({
        productId: data.productId,
        type: "out",
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        reference: data.reference,
        notes: data.notes,
      })
      .returning()

    // Update product stock
    await db
      .update(products)
      .set({
        currentStock: sql`${products.currentStock} - ${data.quantity}`,
      })
      .where(eq(products.id, data.productId))

    return transaction
  })

export const Route = createFileRoute("/dashboard/inventory/outgoing")({
  component: OutgoingPage,
})

function OutgoingPage() {
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<string>("")

  const { data: productList } = useQuery({
    queryKey: ["products", "select"],
    queryFn: () => getProductsForSelect(),
  })

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions", "outgoing"],
    queryFn: () => getOutgoingTransactions(),
  })

  const createMutation = useMutation({
    mutationFn: createOutgoingTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["inventory"] })
      setIsDialogOpen(false)
      setSelectedProduct("")
      toast.add({ title: "Barang keluar berhasil dicatat", type: "success" })
    },
    onError: (error) => {
      toast.add({
        title: error.message || "Gagal mencatat barang keluar",
        type: "error",
      })
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    createMutation.mutate({
      data: {
        productId: formData.get("productId") as string,
        quantity: Number(formData.get("quantity")),
        reference: (formData.get("reference") as string) || undefined,
        notes: (formData.get("notes") as string) || undefined,
      },
    })
  }

  const currentProduct = productList?.find((p) => p.id === selectedProduct)

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            render={<Link to="/dashboard/inventory" />}
            size="sm"
            variant="ghost"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-semibold text-2xl">Barang Keluar</h1>
            <p className="text-muted-foreground text-sm">
              Catat pengeluaran barang dari gudang
            </p>
          </div>
        </div>
        <Dialog onOpenChange={setIsDialogOpen} open={isDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Barang Keluar
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Catat Barang Keluar</DialogTitle>
              <DialogDescription>
                Masukkan detail pengeluaran barang
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="productId">Produk</Label>
                  <Select
                    name="productId"
                    onValueChange={(value) => setSelectedProduct(value ?? "")}
                    required
                    value={selectedProduct}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {productList?.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.sku} - {product.name} (Stok:{" "}
                          {product.currentStock})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {currentProduct && (
                    <p className="text-muted-foreground text-sm">
                      Stok tersedia: {currentProduct.currentStock}{" "}
                      {currentProduct.unit}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Jumlah</Label>
                  <Input
                    id="quantity"
                    max={currentProduct?.currentStock}
                    min="1"
                    name="quantity"
                    required
                    type="number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reference">Referensi (DO/Invoice)</Label>
                  <Input id="reference" name="reference" placeholder="DO-001" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Catatan</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Catatan tambahan"
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose
                  render={<Button type="button" variant="outline" />}
                >
                  Batal
                </DialogClose>
                <Button disabled={createMutation.isPending} type="submit">
                  {createMutation.isPending ? "Menyimpan..." : "Simpan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Barang Keluar</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <p className="text-center text-muted-foreground">Memuat...</p>
          )}
          {!isLoading && transactions && transactions.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead>Referensi</TableHead>
                  <TableHead>Catatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      {new Date(tx.transactionDate).toLocaleDateString("id-ID")}
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">{tx.product?.name}</span>
                        <span className="ml-2 text-muted-foreground text-xs">
                          {tx.product?.sku}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">
                        -{tx.quantity} {tx.product?.unit}
                      </Badge>
                    </TableCell>
                    <TableCell>{tx.reference || "-"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {tx.notes || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!isLoading && (!transactions || transactions.length === 0) && (
            <p className="text-center text-muted-foreground">
              Belum ada riwayat barang keluar
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
