"use client"

import type React from "react"

import { useState } from "react"
import { Upload, FileUp, FileText, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { parseInvoiceText } from "@/utils/invoice-utils"

// Define the structure for invoice data
interface InvoiceData {
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

export default function InvoiceExtractor() {
  const [file, setFile] = useState<File | null>(null)
  const [extractedText, setExtractedText] = useState<string>("")
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [extractedInvoices, setExtractedInvoices] = useState<InvoiceData[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleExtract = async () => {
    if (!file) {
      setError("Please select a file first")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/invoice-extraction", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to extract data from invoice")
      }

      setExtractedText(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleProcessText = () => {
    if (!extractedText) {
      setError("No extracted text to process")
      return
    }

    try {
      // Parse the extracted text into structured data
      const parsedData = parseInvoiceText(extractedText)
      setInvoiceData(parsedData)

      // Add to the list of extracted invoices
      setExtractedInvoices((prev) => [...prev, parsedData])

      // Clear the extracted text for the next invoice
      setExtractedText("")
      setFile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process extracted text")
    }
  }

  const handleDownload = () => {
    if (extractedInvoices.length === 0) return

    // Convert to CSV
    const headers = Object.keys(extractedInvoices[0]).join(",")
    const rows = extractedInvoices.map((invoice) =>
      Object.values(invoice)
        .map((value) => `"${value}"`)
        .join(","),
    )
    const csvContent = [headers, ...rows].join("\n")

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "extracted-invoices.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleReset = () => {
    setExtractedInvoices([])
    setInvoiceData(null)
    setExtractedText("")
    setFile(null)
    setError(null)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Invoice Extractor</CardTitle>
          <CardDescription>Upload an invoice document to extract its content</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="invoice-file-upload"
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">PDF, JPG, PNG (MAX. 10MB)</p>
              </div>
              <input
                id="invoice-file-upload"
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />
            </label>
          </div>

          {file && (
            <div className="flex items-center gap-2 p-2 border rounded-md bg-gray-50">
              <FileText className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium truncate">{file.name}</span>
              <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(2)} KB)</span>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button onClick={handleExtract} disabled={!file || loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <FileUp className="mr-2 h-4 w-4" />
                Extract Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {extractedText && (
        <Card>
          <CardHeader>
            <CardTitle>Extracted Raw Text</CardTitle>
            <CardDescription>Review the extracted text and process it to structured data</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea value={extractedText} readOnly className="min-h-[200px] font-mono text-sm" />
          </CardContent>
          <CardFooter>
            <Button onClick={handleProcessText} className="ml-auto">
              Process Text
            </Button>
          </CardFooter>
        </Card>
      )}

      {extractedInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Extracted Invoices</CardTitle>
            <CardDescription>{extractedInvoices.length} invoice(s) extracted</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier Name</TableHead>
                    <TableHead>Invoice Number</TableHead>
                    <TableHead>Invoice Date</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Amount (Before GST)</TableHead>
                    <TableHead>GST</TableHead>
                    <TableHead>Amount (After GST)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {extractedInvoices.map((invoice, index) => (
                    <TableRow key={index}>
                      <TableCell>{invoice["Supplier Name"]}</TableCell>
                      <TableCell>{invoice["Invoice Number"]}</TableCell>
                      <TableCell>{invoice["Invoice Date"]}</TableCell>
                      <TableCell>{invoice["Currency"]}</TableCell>
                      <TableCell>{invoice["Amount (Before GST)"]}</TableCell>
                      <TableCell>{invoice["GST"]}</TableCell>
                      <TableCell>{invoice["Amount (After GST)"]}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <Button onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download CSV
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}

