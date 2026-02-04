import { sales } from "data/schema/inventory"
import { desc, like, sql } from "drizzle-orm"
import { db } from "@/lib/db"

/**
 * Generate a unique invoice number in format: INV-YYYY-NNNN
 * e.g., INV-2026-0001, INV-2026-0002, etc.
 */
export async function generateInvoiceNumber(): Promise<string> {
  const currentYear = new Date().getFullYear()
  const prefix = `INV-${currentYear}-`

  // Find the highest invoice number for this year
  const lastInvoice = await db
    .select({ invoiceNumber: sales.invoiceNumber })
    .from(sales)
    .where(like(sales.invoiceNumber, `${prefix}%`))
    .orderBy(desc(sales.invoiceNumber))
    .limit(1)

  let nextNumber = 1

  if (lastInvoice.length > 0 && lastInvoice[0]?.invoiceNumber) {
    // Extract the number part from the last invoice
    const lastNumber = lastInvoice[0].invoiceNumber.replace(prefix, "")
    nextNumber = Number.parseInt(lastNumber, 10) + 1
  }

  // Pad with zeros to 4 digits
  const paddedNumber = nextNumber.toString().padStart(4, "0")

  return `${prefix}${paddedNumber}`
}

/**
 * Get the next sequence number for a given prefix
 * Useful for generating other document numbers (PO, DO, etc.)
 */
export async function getNextSequence(
  tableName: string,
  columnName: string,
  prefix: string
): Promise<number> {
  const result = await db.execute(
    sql`SELECT MAX(CAST(REPLACE(${sql.raw(columnName)}, ${prefix}, '') AS INTEGER)) as max_num
        FROM ${sql.raw(tableName)}
        WHERE ${sql.raw(columnName)} LIKE ${`${prefix}%`}`
  )

  const maxNum = (result.rows[0] as { max_num: number | null })?.max_num ?? 0
  return maxNum + 1
}
