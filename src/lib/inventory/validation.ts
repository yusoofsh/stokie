import { z } from "zod"

// Product validation schema
export const productSchema = z.object({
  sku: z
    .string()
    .min(3, "SKU minimal 3 karakter")
    .max(50, "SKU maksimal 50 karakter"),
  name: z
    .string()
    .min(2, "Nama produk minimal 2 karakter")
    .max(200, "Nama produk maksimal 200 karakter"),
  description: z
    .string()
    .max(1000, "Deskripsi maksimal 1000 karakter")
    .optional(),
  category: z.string().max(100, "Kategori maksimal 100 karakter").optional(),
  unit: z
    .string()
    .min(1, "Unit wajib diisi")
    .max(20, "Unit maksimal 20 karakter"),
  basePrice: z.number().int().positive("Harga dasar harus positif"),
  sellingPrice: z.number().int().positive("Harga jual harus positif"),
  minStock: z
    .number()
    .int()
    .nonnegative("Stok minimum tidak boleh negatif")
    .optional(),
})

export type ProductInput = z.infer<typeof productSchema>

// Stock transaction validation schema
export const stockTransactionSchema = z.object({
  productId: z.string().min(1, "Pilih produk"),
  type: z.enum(["in", "out"], {
    required_error: "Pilih tipe transaksi",
  }),
  quantity: z.number().int().positive("Jumlah harus lebih dari 0"),
  unitPrice: z.number().int().positive("Harga harus positif").optional(),
  reference: z.string().max(100, "Referensi maksimal 100 karakter").optional(),
  notes: z.string().max(500, "Catatan maksimal 500 karakter").optional(),
  transactionDate: z.date().optional(),
})

export type StockTransactionInput = z.infer<typeof stockTransactionSchema>

// Sale item schema (for individual items in a sale)
export const saleItemSchema = z.object({
  productId: z.string().min(1, "Pilih produk"),
  quantity: z.number().int().positive("Jumlah harus lebih dari 0"),
  unitPrice: z.number().int().positive("Harga harus positif"),
})

export type SaleItemInput = z.infer<typeof saleItemSchema>

// Sale validation schema
export const saleSchema = z.object({
  customerName: z
    .string()
    .max(200, "Nama pelanggan maksimal 200 karakter")
    .optional(),
  customerPhone: z
    .string()
    .max(20, "Nomor telepon maksimal 20 karakter")
    .optional(),
  items: z.array(saleItemSchema).min(1, "Minimal 1 item dalam penjualan"),
  dueDate: z.date().optional(),
  notes: z.string().max(500, "Catatan maksimal 500 karakter").optional(),
})

export type SaleInput = z.infer<typeof saleSchema>

// Payment validation schema
export const paymentSchema = z.object({
  saleId: z.string().min(1, "Pilih penjualan"),
  amount: z.number().int().positive("Jumlah pembayaran harus positif"),
  paymentMethod: z
    .string()
    .max(50, "Metode pembayaran maksimal 50 karakter")
    .optional(),
  paymentDate: z.date().optional(),
  notes: z.string().max(500, "Catatan maksimal 500 karakter").optional(),
})

export type PaymentInput = z.infer<typeof paymentSchema>

// Search/filter schemas
export const productFilterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  lowStock: z.boolean().optional(),
})

export type ProductFilter = z.infer<typeof productFilterSchema>

export const saleFilterSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["unpaid", "partial", "paid", "voided"]).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
})

export type SaleFilter = z.infer<typeof saleFilterSchema>

export const transactionFilterSchema = z.object({
  productId: z.string().optional(),
  type: z.enum(["in", "out"]).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
})

export type TransactionFilter = z.infer<typeof transactionFilterSchema>

// Payment methods constant
export const paymentMethods = [
  { value: "cash", label: "Tunai" },
  { value: "transfer", label: "Transfer Bank" },
  { value: "qris", label: "QRIS" },
  { value: "debit", label: "Kartu Debit" },
  { value: "credit", label: "Kartu Kredit" },
  { value: "other", label: "Lainnya" },
] as const

// Product units constant
export const productUnits = [
  { value: "pcs", label: "Pcs" },
  { value: "unit", label: "Unit" },
  { value: "box", label: "Box" },
  { value: "pack", label: "Pack" },
  { value: "kg", label: "Kg" },
  { value: "gram", label: "Gram" },
  { value: "liter", label: "Liter" },
  { value: "meter", label: "Meter" },
  { value: "roll", label: "Roll" },
  { value: "pair", label: "Pasang" },
  { value: "dozen", label: "Lusin" },
] as const

// Sale status for display
export const saleStatuses = {
  unpaid: { label: "Belum Bayar", variant: "destructive" as const },
  partial: { label: "Bayar Sebagian", variant: "warning" as const },
  paid: { label: "Lunas", variant: "success" as const },
  voided: { label: "Dibatalkan", variant: "secondary" as const },
}

// Transaction types for display
export const transactionTypes = {
  in: { label: "Barang Masuk", variant: "success" as const },
  out: { label: "Barang Keluar", variant: "destructive" as const },
}
