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
import { formatRupiah, rupiahToCents } from "@/lib/currency"
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
        basePrice: products.basePrice,
        currentStock: products.currentStock,
      })
      .from(products)
      .orderBy(products.name)
  }
)

const getIncomingTransactions = createServerFn({ method: "GET" }).handler(
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
      .where(eq(stockTransactions.type, "in"))
      .orderBy(desc(stockTransactions.transactionDate))
      .limit(50)
  }
)

const createIncomingTransaction = createServerFn({ method: "POST" })
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
    // Insert transaction
    const [transaction] = await db
      .insert(stockTransactions)
      .values({
        productId: data.productId,
        type: "in",
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
        currentStock: sql`${products.currentStock} + ${data.quantity}`,
      })
      .where(eq(products.id, data.productId))

    return transaction
  })

export const Route = createFileRoute("/dashboard/inventory/incoming")({
  component: IncomingPage,
})

function IncomingPage() {
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { data: productList } = useQuery({
    queryKey: ["products", "select"],
    queryFn: () => getProductsForSelect(),
  })

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions", "incoming"],
    queryFn: () => getIncomingTransactions(),
  })

  const createMutation = useMutation({
    mutationFn: createIncomingTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["inventory"] })
      setIsDialogOpen(false)
      toast.add({ title: "Barang masuk berhasil dicatat", type: "success" })
    },
    onError: () => {
      toast.add({ title: "Gagal mencatat barang masuk", type: "error" })
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const unitPriceStr = formData.get("unitPrice") as string
    const unitPrice = unitPriceStr
      ? rupiahToCents(Number(unitPriceStr))
      : undefined

    createMutation.mutate({
      data: {
        productId: formData.get("productId") as string,
        quantity: Number(formData.get("quantity")),
        unitPrice,
        reference: (formData.get("reference") as string) || undefined,
        notes: (formData.get("notes") as string) || undefined,
      },
    })
  }

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
            <h1 className="font-semibold text-2xl">Barang Masuk</h1>
            <p className="text-muted-foreground text-sm">
              Catat penerimaan barang ke gudang
            </p>
          </div>
        </div>
        <Dialog onOpenChange={setIsDialogOpen} open={isDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Barang Masuk
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Catat Barang Masuk</DialogTitle>
              <DialogDescription>
                Masukkan detail penerimaan barang
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="productId">Produk</Label>
                  <Select name="productId" required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {productList?.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.sku} - {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Jumlah</Label>
                    <Input
                      id="quantity"
                      min="1"
                      name="quantity"
                      required
                      type="number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unitPrice">Harga Satuan (Rp)</Label>
                    <Input
                      id="unitPrice"
                      min="0"
                      name="unitPrice"
                      step="100"
                      type="number"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reference">Referensi (PO/Invoice)</Label>
                  <Input id="reference" name="reference" placeholder="PO-001" />
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
          <CardTitle>Riwayat Barang Masuk</CardTitle>
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
                  <TableHead className="text-right">Harga Satuan</TableHead>
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
                      <Badge variant="default">
                        +{tx.quantity} {tx.product?.unit}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {tx.unitPrice ? formatRupiah(tx.unitPrice) : "-"}
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
              Belum ada riwayat barang masuk
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
