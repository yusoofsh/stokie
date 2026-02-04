import { relations } from "drizzle-orm"
import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { v7 } from "uuid"
import { users } from "./auth"

// Products table (Barang)
export const products = pgTable(
  "products",
  {
    id: text("id")
      .primaryKey()
      .$default(() => v7()),
    sku: text("sku").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    category: text("category"),
    unit: text("unit").notNull(), // pcs, kg, box, etc.
    basePrice: integer("base_price").notNull(), // Harga dasar (in cents/sen)
    sellingPrice: integer("selling_price").notNull(), // Harga jual (in cents/sen)
    minStock: integer("min_stock").default(0).notNull(),
    currentStock: integer("current_stock").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("products_sku_idx").on(table.sku),
    index("products_category_idx").on(table.category),
  ]
)

// Stock Transactions (Barang Masuk/Keluar)
export const stockTransactions = pgTable(
  "stock_transactions",
  {
    id: text("id")
      .primaryKey()
      .$default(() => v7()),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // "in" (masuk) | "out" (keluar)
    quantity: integer("quantity").notNull(),
    unitPrice: integer("unit_price"), // price at transaction time (in cents)
    reference: text("reference"), // PO number, invoice number, sale ID, etc.
    notes: text("notes"),
    transactionDate: timestamp("transaction_date").defaultNow().notNull(),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("stock_transactions_product_idx").on(table.productId),
    index("stock_transactions_type_idx").on(table.type),
    index("stock_transactions_date_idx").on(table.transactionDate),
  ]
)

// Sales (Penjualan)
export const sales = pgTable(
  "sales",
  {
    id: text("id")
      .primaryKey()
      .$default(() => v7()),
    invoiceNumber: text("invoice_number").notNull().unique(),
    customerName: text("customer_name"),
    customerPhone: text("customer_phone"),
    totalAmount: integer("total_amount").notNull(), // in cents
    paidAmount: integer("paid_amount").default(0).notNull(), // in cents
    status: text("status").default("unpaid").notNull(), // "unpaid" | "partial" | "paid" | "voided"
    dueDate: timestamp("due_date"),
    notes: text("notes"),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("sales_invoice_idx").on(table.invoiceNumber),
    index("sales_status_idx").on(table.status),
    index("sales_date_idx").on(table.createdAt),
  ]
)

// Sale Items (Detail Penjualan)
export const saleItems = pgTable(
  "sale_items",
  {
    id: text("id")
      .primaryKey()
      .$default(() => v7()),
    saleId: text("sale_id")
      .notNull()
      .references(() => sales.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull(),
    unitPrice: integer("unit_price").notNull(), // in cents
    subtotal: integer("subtotal").notNull(), // in cents
  },
  (table) => [
    index("sale_items_sale_idx").on(table.saleId),
    index("sale_items_product_idx").on(table.productId),
  ]
)

// Payments (Pembayaran)
export const payments = pgTable(
  "payments",
  {
    id: text("id")
      .primaryKey()
      .$default(() => v7()),
    saleId: text("sale_id")
      .notNull()
      .references(() => sales.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(), // in cents
    paymentMethod: text("payment_method"), // cash, transfer, etc.
    paymentDate: timestamp("payment_date").defaultNow().notNull(),
    notes: text("notes"),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("payments_sale_idx").on(table.saleId),
    index("payments_date_idx").on(table.paymentDate),
  ]
)

// Relations
export const productsRelations = relations(products, ({ many }) => ({
  stockTransactions: many(stockTransactions),
  saleItems: many(saleItems),
}))

export const stockTransactionsRelations = relations(
  stockTransactions,
  ({ one }) => ({
    product: one(products, {
      fields: [stockTransactions.productId],
      references: [products.id],
    }),
    user: one(users, {
      fields: [stockTransactions.userId],
      references: [users.id],
    }),
  })
)

export const salesRelations = relations(sales, ({ one, many }) => ({
  items: many(saleItems),
  payments: many(payments),
  user: one(users, {
    fields: [sales.userId],
    references: [users.id],
  }),
}))

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, {
    fields: [saleItems.saleId],
    references: [sales.id],
  }),
  product: one(products, {
    fields: [saleItems.productId],
    references: [products.id],
  }),
}))

export const paymentsRelations = relations(payments, ({ one }) => ({
  sale: one(sales, {
    fields: [payments.saleId],
    references: [sales.id],
  }),
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
}))

// Type exports
export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
export type StockTransaction = typeof stockTransactions.$inferSelect
export type NewStockTransaction = typeof stockTransactions.$inferInsert
export type Sale = typeof sales.$inferSelect
export type NewSale = typeof sales.$inferInsert
export type SaleItem = typeof saleItems.$inferSelect
export type NewSaleItem = typeof saleItems.$inferInsert
export type Payment = typeof payments.$inferSelect
export type NewPayment = typeof payments.$inferInsert
