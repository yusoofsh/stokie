import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import {
  products,
  saleItems,
  sales,
  stockTransactions,
} from "data/schema/inventory"
import { eq, sql } from "drizzle-orm"
import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { formatRupiah } from "@/lib/currency"
import { db } from "@/lib/db"
import { generateInvoiceNumber } from "@/lib/inventory/invoice"

interface CartItem {
  productId: string
  productName: string
  sku: string
  unit: string
  quantity: number
  unitPrice: number
  availableStock: number
}

// Server functions
const getProductsForSale = createServerFn({ method: "GET" }).handler(
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

const createSale = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      customerName?: string
      customerPhone?: string
      notes?: string
      items: Array<{
        productId: string
        quantity: number
        unitPrice: number
      }>
    }) => data
  )
  .handler(async ({ data }) => {
    // Validate stock for all items
    for (const item of data.items) {
      const [product] = await db
        .select({ currentStock: products.currentStock, name: products.name })
        .from(products)
        .where(eq(products.id, item.productId))

      if (!product || product.currentStock < item.quantity) {
        throw new Error(`Stok ${product?.name || "produk"} tidak mencukupi`)
      }
    }

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber()

    // Calculate total
    const totalAmount = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    )

    // Create sale
    const [sale] = await db
      .insert(sales)
      .values({
        invoiceNumber,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        totalAmount,
        paidAmount: 0,
        status: "unpaid",
        notes: data.notes,
      })
      .returning()

    if (!sale) {
      // Create sale items and stock transactions
      throw new Error("Failed to create sale")
    }

    for (const item of data.items) {
      // Create sale item
      await db.insert(saleItems).values({
        saleId: sale.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.quantity * item.unitPrice,
      })

      // Create stock out transaction
      await db.insert(stockTransactions).values({
        productId: item.productId,
        type: "out",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        reference: invoiceNumber,
        notes: `Penjualan ${invoiceNumber}`,
      })

      // Update product stock
      await db
        .update(products)
        .set({
          currentStock: sql`${products.currentStock} - ${item.quantity}`,
        })
        .where(eq(products.id, item.productId))
    }

    return sale
  })

export const Route = createFileRoute("/dashboard/sales/new")({
  component: NewSalePage,
})

function NewSalePage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedProductId, setSelectedProductId] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [notes, setNotes] = useState("")

  const { data: productList } = useQuery({
    queryKey: ["products", "sale"],
    queryFn: () => getProductsForSale(),
  })

  const createMutation = useMutation({
    mutationFn: createSale,
    onSuccess: (sale) => {
      queryClient.invalidateQueries({ queryKey: ["sales"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["inventory"] })
      if (sale) {
        toast.add({
          title: `Penjualan ${sale.invoiceNumber} berhasil dibuat`,
          type: "success",
        })
        navigate({ to: "/dashboard/sales/$id", params: { id: sale.id } })
      }
    },
    onError: (error) => {
      toast.add({
        title: error.message || "Gagal membuat penjualan",
        type: "error",
      })
    },
  })

  const selectedProduct = productList?.find((p) => p.id === selectedProductId)

  const addToCart = () => {
    if (!selectedProduct || quantity < 1) {
      return
    }

    const existingIndex = cart.findIndex(
      (item) => item.productId === selectedProduct.id
    )

    if (existingIndex >= 0) {
      const updated = [...cart]
      const existingItem = updated[existingIndex]
      if (!existingItem) {
        return
      }
      const newQty = existingItem.quantity + quantity
      if (newQty > selectedProduct.currentStock) {
        toast.add({ title: "Jumlah melebihi stok tersedia", type: "error" })
        return
      }
      existingItem.quantity = newQty
      setCart(updated)
    } else {
      if (quantity > selectedProduct.currentStock) {
        toast.add({ title: "Jumlah melebihi stok tersedia", type: "error" })
        return
      }
      setCart([
        ...cart,
        {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          sku: selectedProduct.sku,
          unit: selectedProduct.unit,
          quantity,
          unitPrice: selectedProduct.sellingPrice,
          availableStock: selectedProduct.currentStock,
        },
      ])
    }

    setSelectedProductId("")
    setQuantity(1)
  }

  const updateCartQuantity = (index: number, newQty: number) => {
    if (newQty < 1) {
      return
    }
    const cartItem = cart[index]
    if (!cartItem || newQty > cartItem.availableStock) {
      toast.add({ title: "Jumlah melebihi stok tersedia", type: "error" })
      return
    }
    const updated = [...cart]
    const itemToUpdate = updated[index]
    if (itemToUpdate) {
      itemToUpdate.quantity = newQty
    }
    setCart(updated)
  }

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index))
  }

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  )

  const handleSubmit = () => {
    if (cart.length === 0) {
      toast.add({ title: "Keranjang kosong", type: "error" })
      return
    }

    createMutation.mutate({
      data: {
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        notes: notes || undefined,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      },
    })
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex items-center gap-4">
        <Button
          render={<Link to="/dashboard/sales" />}
          size="sm"
          variant="ghost"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-semibold text-2xl">Penjualan Baru</h1>
          <p className="text-muted-foreground text-sm">
            Buat transaksi penjualan baru
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Product Selection */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tambah Produk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Select
                  onValueChange={(value) => setSelectedProductId(value ?? "")}
                  value={selectedProductId}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {productList?.map((product) => (
                      <SelectItem
                        disabled={product.currentStock < 1}
                        key={product.id}
                        value={product.id}
                      >
                        {product.sku} - {product.name} ({product.currentStock}{" "}
                        {product.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                className="w-24"
                max={selectedProduct?.currentStock || 999}
                min="1"
                onChange={(e) => setQuantity(Number(e.target.value))}
                type="number"
                value={quantity}
              />
              <Button disabled={!selectedProduct} onClick={addToCart}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah
              </Button>
            </div>

            {selectedProduct && (
              <p className="mt-2 text-muted-foreground text-sm">
                Harga: {formatRupiah(selectedProduct.sellingPrice)} /{" "}
                {selectedProduct.unit}
                {" • "}
                Stok: {selectedProduct.currentStock} {selectedProduct.unit}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle>Info Pelanggan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Nama Pelanggan</Label>
              <Input
                id="customerName"
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nama pelanggan (opsional)"
                value={customerName}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone">No. Telepon</Label>
              <Input
                id="customerPhone"
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="08xxx (opsional)"
                value={customerPhone}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea
                id="notes"
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan tambahan"
                rows={2}
                value={notes}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cart */}
      <Card>
        <CardHeader>
          <CardTitle>Keranjang</CardTitle>
        </CardHeader>
        <CardContent>
          {cart.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead className="text-right">Harga</TableHead>
                    <TableHead className="text-center">Jumlah</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.map((item, index) => (
                    <TableRow key={item.productId}>
                      <TableCell>
                        <div>
                          <span className="font-medium">
                            {item.productName}
                          </span>
                          <span className="ml-2 text-muted-foreground text-xs">
                            {item.sku}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatRupiah(item.unitPrice)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            onClick={() =>
                              updateCartQuantity(index, item.quantity - 1)
                            }
                            size="sm"
                            variant="outline"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-12 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            onClick={() =>
                              updateCartQuantity(index, item.quantity + 1)
                            }
                            size="sm"
                            variant="outline"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatRupiah(item.quantity * item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          onClick={() => removeFromCart(index)}
                          size="sm"
                          variant="ghost"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <span className="font-semibold text-lg">Total</span>
                <span className="font-bold text-2xl">
                  {formatRupiah(totalAmount)}
                </span>
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  disabled={createMutation.isPending}
                  onClick={handleSubmit}
                  size="lg"
                >
                  {createMutation.isPending ? "Memproses..." : "Buat Penjualan"}
                </Button>
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground">
              Keranjang kosong. Tambahkan produk untuk membuat penjualan.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
