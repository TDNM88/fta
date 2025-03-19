// Define the structure for extracted invoice data
export interface InvoiceData {
  "Supplier Name": string
  "Invoice Number": string
  "Invoice Date": string
  "Description - Name": string
  "Description - Destination": string
  "Description - Period/Date": string
  "Project Code": string
  Currency: string
  "Amount (Before GST)": string
  GST: string
  "Amount (After GST)": string
  "Converted Amount": string
}

/**
 * Standardize number values
 * @param value The value to standardize
 * @returns Standardized number or null
 */
export function standardizeNumber(value: string | number | undefined | null): number | null {
  if (value === undefined || value === null) {
    return null
  }

  const str = typeof value === "string" ? value : value.toString()
  const cleanedStr = str.replace(/[^0-9.-]+/g, "") // Remove non-numeric characters except dots and minus signs
  const num = Number(cleanedStr)

  return isNaN(num) ? null : num
}

/**
 * Standardize date values
 * @param dateString The date string to standardize
 * @returns Standardized date string or null
 */
export function standardizeDate(dateString: string | undefined): string | null {
  if (!dateString) return null

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return null // Invalid date
    }
    return date.toLocaleDateString("en-US") // Format as MM/DD/YYYY
  } catch (error) {
    return null
  }
}

/**
 * Extract raw text from an invoice file using Gemini API
 * This function should only be called from server-side code
 * @param file The file to process
 * @returns Extracted text
 */
export async function extractRawText(file: File): Promise<string> {
  // Check file type
  const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}. Please upload a PDF, JPG, or PNG file.`)
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
    
    // For demonstration purposes, return simulated data
    // In a real application, you would implement server-side file processing with the Gemini API
    return simulateExtraction(file)
  } catch (error) {
    console.error("Error extracting text:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to extract text from file")
  }
}

/**
 * Simulate extraction for demonstration purposes
 * In a real application, you would implement proper server-side file processing
 */
function simulateExtraction(file: File): string {
  // Generate sample data based on file name
  const fileName = file.name.toLowerCase()

  if (fileName.includes("invoice")) {
    return `
Supplier Name: Acme Corporation
Invoice Number: INV-${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")}
Invoice Date: ${new Date().toLocaleDateString("en-GB")}
Description - Name: Professional Services
Description - Destination: Singapore Office
Description - Period/Date: March 2025
Project Code: PRJ-${Math.floor(Math.random() * 1000)}
Currency: USD
Amount (Before GST): ${(Math.random() * 1000 + 500).toFixed(2)}
GST: ${(Math.random() * 100).toFixed(2)}
Amount (After GST): ${(Math.random() * 1200 + 500).toFixed(2)}
Converted Amount: ${(Math.random() * 1500 + 600).toFixed(2)}
`
  } else {
    // Generic extraction result
    return `
Supplier Name: Global Services Ltd
Invoice Number: GS-${Math.floor(Math.random() * 10000)}
Invoice Date: 15-Mar-25
Description - Name: Consulting Services
Description - Destination: Remote
Description - Period/Date: Q1 2025
Project Code: PROJ-${Math.floor(Math.random() * 100)}
Currency: EUR
Amount (Before GST): ${(Math.random() * 2000 + 1000).toFixed(2)}
GST: ${(Math.random() * 200 + 50).toFixed(2)}
Amount (After GST): ${(Math.random() * 2500 + 1000).toFixed(2)}
Converted Amount: ${(Math.random() * 3000 + 1200).toFixed(2)}
`
  }
}

/**
 * Parse raw text into structured invoice data
 * @param text The raw text to parse
 * @returns Structured invoice data
 */
export function parseInvoiceText(text: string): InvoiceData {
  const lines = text.split("\n")
  const data: { [key: string]: string } = {}

  for (const line of lines) {
    const parts = line.split(":")
    if (parts.length >= 2) {
      const key = parts[0].trim()
      const value = parts.slice(1).join(":").trim()
      if (key && value) {
        data[key] = value
      }
    }
  }

  return {
    "Supplier Name": data["Supplier Name"] || "",
    "Invoice Number": data["Invoice Number"] || "",
    "Invoice Date": data["Invoice Date"] || "",
    "Description - Name": data["Description - Name"] || "",
    "Description - Destination": data["Description - Destination"] || "",
    "Description - Period/Date": data["Description - Period/Date"] || "",
    "Project Code": data["Project Code"] || "",
    Currency: data["Currency"] || "",
    "Amount (Before GST)": data["Amount (Before GST)"] || "",
    GST: data["GST"] || "",
    "Amount (After GST)": data["Amount (After GST)"] || "",
    "Converted Amount": data["Converted Amount"] || "",
  }
}

