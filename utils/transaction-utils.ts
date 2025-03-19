/**
 * Utility functions for transaction extraction
 */
import { standardizeNumber, standardizeDate } from "./invoice-utils"

// Define the structure for extracted transaction data
export interface Transaction {
  "Reference - Code": string
  "GL Posting Date": string
  Date: string
  "Settlement Date": string
  "Security Name": string
  Currency: string
  Quantity: number | null
  Price: number | null
  "Transaction Amount": number | null
  Commission: number | null
}

// Define the structure for raw transaction data
interface RawTransaction {
  Date?: string
  Reference?: string
  Description?: string
  Debit?: string
  Credit?: string
  Balance?: string
  "Balance in Trust"?: string
  [key: string]: string | undefined
}

/**
 * Extract transaction data from a PDF file
 * This function should only be called from server-side code
 * @param file The PDF file to process
 * @returns Array of extracted transactions
 */
export async function extractTransactionData(file: File): Promise<Transaction[]> {
  // Check file type
  if (file.type !== "application/pdf") {
    throw new Error("Only PDF files are supported for transaction extraction.")
  }

  // Check file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("File size exceeds 10MB limit.")
  }

  try {
    // In a real application, you would use the Gemini API here
    // The API key is accessed server-side only
    const apiKey = process.env.GEMINI_API_KEY
    
    if (!apiKey) {
      console.error("Gemini API key not found")
      throw new Error("API configuration error. Please contact support.")
    }
    
    // For demonstration purposes, we'll use simulated data
    // In a real application, you would implement server-side PDF processing
    return simulateTransactionExtraction(file)
  } catch (error) {
    console.error("Error extracting transactions:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to extract transactions from file")
  }
}

/**
 * Simulate transaction extraction for demonstration purposes
 * In a real application, this would use server-side PDF processing
 */
async function simulateTransactionExtraction(file: File): Promise<Transaction[]> {
  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Generate sample transactions
  const transactions: Transaction[] = []
  const refTypes = ["TSF", "TPF"]
  const securities = ["APPLE INC", "MICROSOFT CORP", "AMAZON.COM", "TESLA INC", "GOOGLE LLC"]
  const currencies = ["USD", "EUR", "GBP"]

  for (let i = 0; i < 10; i++) {
    const refType = refTypes[Math.floor(Math.random() * refTypes.length)]
    const refCode = `${refType}${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")}`
    const security = securities[Math.floor(Math.random() * securities.length)]
    const currency = currencies[Math.floor(Math.random() * currencies.length)]
    const quantity = Math.floor(Math.random() * 100) + 1
    const price = Number.parseFloat((Math.random() * 500 + 50).toFixed(2))
    const transactionAmount = quantity * price
    const commission = Number.parseFloat((transactionAmount * 0.01).toFixed(2))

    // Generate dates
    const today = new Date()
    const glDate = new Date(today)
    glDate.setDate(today.getDate() - Math.floor(Math.random() * 30))
    const settlementDate = new Date(glDate)
    settlementDate.setDate(glDate.getDate() + 2)

    transactions.push({
      "Reference - Code": refCode,
      "GL Posting Date": glDate.toLocaleDateString("en-US"),
      Date: glDate.toLocaleDateString("en-US"),
      "Settlement Date": settlementDate.toLocaleDateString("en-US"),
      "Security Name": security,
      Currency: currency,
      Quantity: refType === "TSF" ? -quantity : quantity,
      Price: price,
      "Transaction Amount": transactionAmount,
      Commission: commission,
    })
  }

  return transactions
}

/**
 * Parse description to extract transaction details
 * @param description The description text to parse
 * @returns Extracted security, currency, quantity, and price
 */
export function parseDescription(description: string): [string | null, string | null, number | null, number | null] {
  if (!description) return [null, null, null, null]

  const pattern = /(Bought|Sold)\s+([\d,]+)\s+([\w\s&]+?)\s*@\s*([A-Z]{3})\s*([\d,]+\.?\d*)/i
  const match = description.match(pattern)

  if (match) {
    const [_, action, quantityStr, security, currency, priceStr] = match
    const quantity = standardizeNumber(quantityStr)
    const price = standardizeNumber(priceStr)
    return [security.trim(), currency, quantity, price]
  }

  return [null, null, null, null]
}

/**
 * Find settlement date based on reference code and transaction type
 * @param transactions Array of raw transactions
 * @param refCode Reference code to search for
 * @param transType Transaction type (TSF or TPF)
 * @returns Settlement date if found, otherwise null
 */
export function findSettlementDate(transactions: RawTransaction[], refCode: string, transType: string): string | null {
  if (transType === "TSF") {
    // Rule 1: Find row with Reference starting with "PY" and Description containing "Amount paid TFR to TRUST (ref_code)"
    const pattern = new RegExp(`Amount\\s+paid\\s+TFR\\s+to\\s+TRUST\\s*\$$${escapeRegExp(refCode)}\$$`, "i")

    for (const row of transactions) {
      if (
        row.Reference?.startsWith("PY") &&
        pattern.test(row.Description || "") &&
        row["Balance in Trust"] !== undefined
      ) {
        return standardizeDate(row.Date)
      }
    }
  } else if (transType === "TPF") {
    // Rule 2: Find intermediate RC code from Description containing "TRUSTTFR_TRTTFR (ref_code)"
    const rcPattern = /TRUSTTFR_TRTTFR\s*$$\s*([A-Z0-9]+)\s*$$/i
    let rcCode = null

    for (const row of transactions) {
      if (row.Reference?.startsWith("RC")) {
        const match = (row.Description || "").match(rcPattern)
        if (match) {
          rcCode = match[1]
          break
        }
      }
    }

    if (rcCode) {
      // Rule 3: Find row with Reference starting with "WC" and Description containing "Withdrawal from TRUST (rc_code)"
      const wcPattern = new RegExp(`Withdrawal\\s+from\\s+TRUST.*\$$${escapeRegExp(rcCode)}\$$`, "i")

      for (const row of transactions) {
        if (
          row.Reference?.startsWith("WC") &&
          wcPattern.test(row.Description || "") &&
          row["Balance in Trust"] !== undefined
        ) {
          return standardizeDate(row.Date)
        }
      }
    }
  }

  return null
}

/**
 * Escape special characters in a string for use in a regular expression
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Process raw transactions into structured transaction data
 * @param rawTransactions Array of raw transaction data
 * @returns Array of structured transactions
 */
export function processTransactions(rawTransactions: RawTransaction[]): Transaction[] {
  const result: Transaction[] = []

  for (const row of rawTransactions) {
    const refCode = row.Reference || ""
    const transType = refCode.startsWith("TPF") ? "TPF" : refCode.startsWith("TSF") ? "TSF" : null

    if (!transType) continue

    // Extract information from Description
    const [security, currency, quantity, price] = parseDescription(row.Description || "")
    if (!security || !currency || quantity === null || price === null) continue

    // Determine GL Posting Date and Settlement Date
    const glDate = standardizeDate(row.Date)
    const settlementDate = findSettlementDate(rawTransactions, refCode, transType)

    // Calculate Transaction Amount
    const transactionAmount = quantity !== null && price !== null ? quantity * price : null

    // Standardize Balance in Trust
    const balanceInTrust = standardizeNumber(row["Balance in Trust"])

    // Calculate Commission
    let commission = null
    if (balanceInTrust !== null && transactionAmount !== null) {
      commission =
        transType === "TPF"
          ? Math.abs(balanceInTrust + transactionAmount)
          : Math.abs(balanceInTrust - transactionAmount)
    }

    // Add data to result
    result.push({
      "Reference - Code": refCode,
      "GL Posting Date": glDate || "",
      Date: glDate || "",
      "Settlement Date": settlementDate || "",
      "Security Name": security,
      Currency: currency,
      Quantity: transType === "TSF" ? -quantity : quantity,
      Price: price,
      "Transaction Amount": transactionAmount,
      Commission: commission,
    })
  }

  return result
}

