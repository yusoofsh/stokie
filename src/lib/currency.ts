/**
 * Currency utilities for Indonesian Rupiah (IDR)
 * Prices are stored as integers (cents/sen) to avoid floating point issues
 */

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

/**
 * Format cents to Rupiah display string
 * @param cents - Amount in cents (e.g., 1000000 = Rp10.000)
 * @returns Formatted string like "Rp10.000"
 */
export function formatRupiah(cents: number): string {
  // Convert cents to rupiah (divide by 100)
  const rupiah = cents / 100
  return rupiahFormatter.format(rupiah)
}

/**
 * Format cents to plain number string (without currency symbol)
 * @param cents - Amount in cents
 * @returns Formatted string like "10.000"
 */
export function formatNumber(cents: number): string {
  const rupiah = cents / 100
  return numberFormatter.format(rupiah)
}

/**
 * Convert cents to rupiah value
 * @param cents - Amount in cents
 * @returns Amount in rupiah
 */
export function centsToRupiah(cents: number): number {
  return cents / 100
}

/**
 * Convert rupiah to cents for storage
 * @param rupiah - Amount in rupiah
 * @returns Amount in cents (integer)
 */
export function rupiahToCents(rupiah: number): number {
  return Math.round(rupiah * 100)
}

/**
 * Parse a formatted number string to cents
 * Handles Indonesian number format (dots as thousand separators)
 * @param value - Formatted string like "10.000" or "10000"
 * @returns Amount in cents
 */
export function parseRupiahToCents(value: string): number {
  // Remove currency symbol, dots (thousand separator), and whitespace
  const cleaned = value.replace(/[Rp.\s]/g, "").replace(/,/g, ".")
  const rupiah = Number.parseFloat(cleaned) || 0
  return rupiahToCents(rupiah)
}
