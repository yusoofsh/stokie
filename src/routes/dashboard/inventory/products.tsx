import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { type NewProduct, type Product, products } from "data/schema/inventory"
import { desc, eq } from "drizzle-orm"
import { Pencil, Plus, Trash2 } from "lucide-react"
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
import { productUnits } from "@/lib/inventory/validation"

// Server functions
const getProducts = createServerFn({ method: "GET" }).handler(async () => {
  return await db.select().from(products).orderBy(desc(products.createdAt))
})

const createProduct = createServerFn({ method: "POST" })
  .inputValidator(
    (data: Omit<NewProduct, "id" | "createdAt" | "updatedAt">) => data
  )
  .handler(async ({ data }) => {
    const [product] = await db.insert(products).values(data).returning()
    return product
  })

const updateProduct = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string } & Partial<NewProduct>) => data)
  .handler(async ({ data }) => {
    const { id, ...updates } = data
    const [product] = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning()
    return product
  })

const deleteProduct = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await db.delete(products).where(eq(products.id, data.id))
    return { success: true }
  })

export const Route = createFileRoute("/dashboard/inventory/products")({
  component: ProductsPage,
})

function getButtonLabel(editingProduct: Product | null): string {
  return editingProduct ? "Simpan Perubahan" : "Tambah Produk"
}

function ProductsPage() {
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const { data: productList, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts(),
  })

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      setIsDialogOpen(false)
      toast.success("Produk berhasil ditambahkan")
    },
    onError: () => {
      toast.error("Gagal menambahkan produk")
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      setEditingProduct(null)
      toast.success("Produk berhasil diperbarui")
    },
    onError: () => {
      toast.error("Gagal memperbarui produk")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success("Produk berhasil dihapus")
    },
    onError: () => {
      toast.error("Gagal menghapus produk")
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const data = {
      sku: formData.get("sku") as string,
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
      category: (formData.get("category") as string) || undefined,
      unit: formData.get("unit") as string,
      basePrice: rupiahToCents(Number(formData.get("basePrice"))),
      sellingPrice: rupiahToCents(Number(formData.get("sellingPrice"))),
      minStock: Number(formData.get("minStock")) || 0,
      currentStock: editingProduct?.currentStock ?? 0,
    }

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, ...data })
    } else {
      createMutation.mutate(data)
    }
  }

  const openEditDialog = (product: Product) => {
    setEditingProduct(product)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingProduct(null)
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl">Produk</h1>
          <p className="text-muted-foreground text-sm">
            Kelola daftar produk dan harga barang
          </p>
        </div>
        <Dialog
          onOpenChange={(open) => {
            if (open) {
              setIsDialogOpen(true)
            } else {
              closeDialog()
            }
          }}
          open={isDialogOpen || !!editingProduct}
        >
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Produk
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Edit Produk" : "Tambah Produk Baru"}
              </DialogTitle>
              <DialogDescription>
                {editingProduct
                  ? "Perbarui informasi produk"
                  : "Isi informasi produk baru"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      defaultValue={editingProduct?.sku}
                      id="sku"
                      name="sku"
                      placeholder="SKU-001"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Select
                      defaultValue={editingProduct?.unit}
                      name="unit"
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {productUnits.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Produk</Label>
                  <Input
                    defaultValue={editingProduct?.name}
                    id="name"
                    name="name"
                    placeholder="Nama produk"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Input
                    defaultValue={editingProduct?.category ?? undefined}
                    id="category"
                    name="category"
                    placeholder="Kategori produk"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    defaultValue={editingProduct?.description ?? undefined}
                    id="description"
                    name="description"
                    placeholder="Deskripsi produk (opsional)"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="basePrice">Harga Dasar (Rp)</Label>
                    <Input
                      defaultValue={
                        editingProduct
                          ? editingProduct.basePrice / 100
                          : undefined
                      }
                      id="basePrice"
                      min="0"
                      name="basePrice"
                      placeholder="10000"
                      required
                      step="100"
                      type="number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sellingPrice">Harga Jual (Rp)</Label>
                    <Input
                      defaultValue={
                        editingProduct
                          ? editingProduct.sellingPrice / 100
                          : undefined
                      }
                      id="sellingPrice"
                      min="0"
                      name="sellingPrice"
                      placeholder="15000"
                      required
                      step="100"
                      type="number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minStock">Stok Minimum</Label>
                    <Input
                      defaultValue={editingProduct?.minStock ?? 0}
                      id="minStock"
                      min="0"
                      name="minStock"
                      placeholder="10"
                      type="number"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose
                  render={<Button type="button" variant="outline" />}
                >
                  Batal
                </DialogClose>
                <Button
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  type="submit"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Menyimpan..."
                    : getButtonLabel(editingProduct)}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Produk</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <p className="text-center text-muted-foreground">Memuat...</p>
          )}
          {!isLoading && productList && productList.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Nama Produk</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Harga Dasar</TableHead>
                  <TableHead className="text-right">Harga Jual</TableHead>
                  <TableHead className="text-right">Stok</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productList.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono text-sm">
                      {product.sku}
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">{product.name}</span>
                        {product.description && (
                          <p className="text-muted-foreground text-xs">
                            {product.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{product.category || "-"}</TableCell>
                    <TableCell className="text-right">
                      {formatRupiah(product.basePrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatRupiah(product.sellingPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          product.currentStock <= product.minStock
                            ? "destructive"
                            : "default"
                        }
                      >
                        {product.currentStock} {product.unit}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => openEditDialog(product)}
                          size="sm"
                          variant="ghost"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          disabled={deleteMutation.isPending}
                          onClick={() =>
                            deleteMutation.mutate({ id: product.id })
                          }
                          size="sm"
                          variant="ghost"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!isLoading && (!productList || productList.length === 0) && (
            <p className="text-center text-muted-foreground">
              Belum ada produk. Klik "Tambah Produk" untuk menambahkan.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
