import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import {
  payments,
  products,
  saleItems,
  sales,
  stockTransactions,
} from "data/schema/inventory"
import { eq, sql } from "drizzle-orm"
import { ArrowLeft, Ban, CreditCard } from "lucide-react"
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
import { Separator } from "@/components/ui/separator"
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
import { paymentMethods, saleStatuses } from "@/lib/inventory/validation"

// Server functions
const getSaleDetail = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const [sale] = await db.select().from(sales).where(eq(sales.id, data.id))

    if (!sale) {
      throw new Error("Penjualan tidak ditemukan")
    }

    const items = await db
      .select({
        id: saleItems.id,
        quantity: saleItems.quantity,
        unitPrice: saleItems.unitPrice,
        subtotal: saleItems.subtotal,
        product: {
          id: products.id,
          sku: products.sku,
          name: products.name,
          unit: products.unit,
        },
      })
      .from(saleItems)
      .leftJoin(products, eq(saleItems.productId, products.id))
      .where(eq(saleItems.saleId, sale.id))

    const paymentList = await db
      .select()
      .from(payments)
      .where(eq(payments.saleId, sale.id))
      .orderBy(payments.paymentDate)

    return { sale, items, payments: paymentList }
  })

const addPayment = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      saleId: string
      amount: number
      paymentMethod?: string
      notes?: string
    }) => data
  )
  .handler(async ({ data }) => {
    // Get current sale
    const [sale] = await db
      .select()
      .from(sales)
      .where(eq(sales.id, data.saleId))

    if (!sale) {
      throw new Error("Penjualan tidak ditemukan")
    }

    if (sale.status === "voided") {
      throw new Error("Penjualan sudah dibatalkan")
    }

    // Create payment
    const [payment] = await db
      .insert(payments)
      .values({
        saleId: data.saleId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
      })
      .returning()

    // Update sale
    const newPaidAmount = sale.paidAmount + data.amount
    let newStatus: string = sale.status

    if (newPaidAmount >= sale.totalAmount) {
      newStatus = "paid"
    } else if (newPaidAmount > 0) {
      newStatus = "partial"
    }

    await db
      .update(sales)
      .set({
        paidAmount: newPaidAmount,
        status: newStatus,
      })
      .where(eq(sales.id, data.saleId))

    return payment
  })

const voidSale = createServerFn({ method: "POST" })
  .inputValidator((data: { saleId: string }) => data)
  .handler(async ({ data }) => {
    // Get sale with items
    const [sale] = await db
      .select()
      .from(sales)
      .where(eq(sales.id, data.saleId))

    if (!sale) {
      throw new Error("Penjualan tidak ditemukan")
    }

    if (sale.status === "voided") {
      throw new Error("Penjualan sudah dibatalkan")
    }

    // Get sale items
    const items = await db
      .select()
      .from(saleItems)
      .where(eq(saleItems.saleId, sale.id))

    // Restore stock for each item
    for (const item of items) {
      // Create stock in transaction (restore)
      await db.insert(stockTransactions).values({
        productId: item.productId,
        type: "in",
        quantity: item.quantity,
        reference: sale.invoiceNumber,
        notes: `Pembatalan ${sale.invoiceNumber}`,
      })

      // Update product stock
      await db
        .update(products)
        .set({
          currentStock: sql`${products.currentStock} + ${item.quantity}`,
        })
        .where(eq(products.id, item.productId))
    }

    // Update sale status
    await db
      .update(sales)
      .set({ status: "voided" })
      .where(eq(sales.id, data.saleId))

    return { success: true }
  })

export const Route = createFileRoute("/dashboard/sales/$id")({
  component: SaleDetailPage,
})

function SaleDetailPage() {
  const { id } = Route.useParams()
  const queryClient = useQueryClient()
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [paymentNotes, setPaymentNotes] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["sales", id],
    queryFn: () => getSaleDetail({ data: { id } }),
  })

  const paymentMutation = useMutation({
    mutationFn: addPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales", id] })
      queryClient.invalidateQueries({ queryKey: ["payments"] })
      setIsPaymentDialogOpen(false)
      setPaymentAmount("")
      setPaymentMethod("")
      setPaymentNotes("")
      toast.success("Pembayaran berhasil dicatat")
    },
    onError: (error) => {
      toast.error(error.message || "Gagal mencatat pembayaran")
    },
  })

  const voidMutation = useMutation({
    mutationFn: voidSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["inventory"] })
      toast.success("Penjualan berhasil dibatalkan")
    },
    onError: (error) => {
      toast.error(error.message || "Gagal membatalkan penjualan")
    },
  })

  const handleAddPayment = () => {
    const amount = Number(paymentAmount) * 100 // Convert to cents
    if (amount <= 0) {
      toast.error("Jumlah pembayaran harus lebih dari 0")
      return
    }

    paymentMutation.mutate({
      data: {
        saleId: id,
        amount,
        paymentMethod: paymentMethod || undefined,
        notes: paymentNotes || undefined,
      },
    })
  }

  if (isLoading) {
    return <p className="text-center text-muted-foreground">Memuat...</p>
  }

  if (!data) {
    return (
      <p className="text-center text-muted-foreground">
        Penjualan tidak ditemukan
      </p>
    )
  }

  const { sale, items, payments: paymentList } = data
  const status = saleStatuses[sale.status as keyof typeof saleStatuses]
  const remainingAmount = sale.totalAmount - sale.paidAmount

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            render={<Link to="/dashboard/sales" />}
            size="sm"
            variant="ghost"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-semibold text-2xl">{sale.invoiceNumber}</h1>
            <p className="text-muted-foreground text-sm">
              {new Date(sale.createdAt).toLocaleDateString("id-ID", {
                dateStyle: "long",
              })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {sale.status !== "voided" && sale.status !== "paid" && (
            <Dialog
              onOpenChange={setIsPaymentDialogOpen}
              open={isPaymentDialogOpen}
            >
              <DialogTrigger render={<Button />}>
                <CreditCard className="mr-2 h-4 w-4" />
                Tambah Pembayaran
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Pembayaran</DialogTitle>
                  <DialogDescription>
                    Sisa tagihan: {formatRupiah(remainingAmount)}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Jumlah (Rp)</Label>
                    <Input
                      id="amount"
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="Jumlah pembayaran"
                      type="number"
                      value={paymentAmount}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="method">Metode Pembayaran</Label>
                    <Select
                      onValueChange={setPaymentMethod}
                      value={paymentMethod}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Catatan</Label>
                    <Textarea
                      id="notes"
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      placeholder="Catatan pembayaran"
                      rows={2}
                      value={paymentNotes}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose
                    render={<Button type="button" variant="outline" />}
                  >
                    Batal
                  </DialogClose>
                  <Button
                    disabled={paymentMutation.isPending}
                    onClick={handleAddPayment}
                  >
                    {paymentMutation.isPending ? "Menyimpan..." : "Simpan"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {sale.status !== "voided" && (
            <Button
              disabled={voidMutation.isPending}
              onClick={() => voidMutation.mutate({ data: { saleId: id } })}
              variant="destructive"
            >
              <Ban className="mr-2 h-4 w-4" />
              {voidMutation.isPending ? "Membatalkan..." : "Batalkan"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Sale Info */}
        <Card>
          <CardHeader>
            <CardTitle>Info Penjualan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={status?.variant || "secondary"}>
                {status?.label || sale.status}
              </Badge>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pelanggan</span>
              <span>{sale.customerName || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Telepon</span>
              <span>{sale.customerPhone || "-"}</span>
            </div>
            {sale.notes && (
              <>
                <Separator />
                <div>
                  <span className="text-muted-foreground">Catatan:</span>
                  <p className="mt-1 text-sm">{sale.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Payment Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ringkasan Pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-muted p-4">
                <p className="text-muted-foreground text-sm">Total</p>
                <p className="font-bold text-xl">
                  {formatRupiah(sale.totalAmount)}
                </p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-muted-foreground text-sm">Dibayar</p>
                <p className="font-bold text-green-600 text-xl">
                  {formatRupiah(sale.paidAmount)}
                </p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-muted-foreground text-sm">Sisa</p>
                <p className="font-bold text-red-600 text-xl">
                  {formatRupiah(remainingAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle>Item Penjualan</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead className="text-right">Harga</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <span className="font-medium">{item.product?.name}</span>
                      <span className="ml-2 text-muted-foreground text-xs">
                        {item.product?.sku}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatRupiah(item.unitPrice)}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.quantity} {item.product?.unit}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatRupiah(item.subtotal)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payments History */}
      {paymentList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead>Catatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentList.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {new Date(payment.paymentDate).toLocaleDateString(
                        "id-ID"
                      )}
                    </TableCell>
                    <TableCell>
                      {paymentMethods.find(
                        (m) => m.value === payment.paymentMethod
                      )?.label ||
                        payment.paymentMethod ||
                        "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      +{formatRupiah(payment.amount)}
                    </TableCell>
                    <TableCell>{payment.notes || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
