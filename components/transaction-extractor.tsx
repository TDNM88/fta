"use client"

import type React from "react"

import { useState } from "react"
import { Upload, FileUp, FileText, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"

type Transaction = {
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

export default function TransactionExtractor() {
  const [file, setFile] = useState<File | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])

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

      const response = await fetch("/api/transaction-extraction", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to extract transactions")
      }

      // Update current transactions
      setTransactions(result.data)

      // Add to all transactions
      setAllTransactions((prev) => [...prev, ...result.data])

      // Reset file input
      setFile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!allTransactions.length) return

    // Convert transactions to CSV
    const headers = [
      "Reference - Code",
      "GL Posting Date",
      "Date",
      "Settlement Date",
      "Security Name",
      "Currency",
      "Quantity",
      "Price",
      "Transaction Amount",
      "Commission",
    ]

    const csvRows = [
      headers.join(","),
      ...allTransactions.map((t) =>
        [
          t["Reference - Code"],
          t["GL Posting Date"],
          t["Date"],
          t["Settlement Date"],
          `"${t["Security Name"]}"`,
          t["Currency"],
          t["Quantity"],
          t["Price"],
          t["Transaction Amount"],
          t["Commission"],
        ].join(","),
      ),
    ]
    const csvContent = csvRows.join("\n")

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "extracted-transactions.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleReset = () => {
    setAllTransactions([])
    setTransactions([])
    setFile(null)
    setError(null)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Transaction Extractor</CardTitle>
          <CardDescription>Upload a bank statement or transaction document to extract transactions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="transaction-file-upload"
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">PDF files only (MAX. 10MB)</p>
              </div>
              <input
                id="transaction-file-upload"
                type="file"
                className="hidden"
                accept=".pdf"
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
                Extract Transactions
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Extracted Transactions</CardTitle>
            <CardDescription>{transactions.length} transactions found in current file</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Settlement Date</TableHead>
                    <TableHead>Security Name</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Commission</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction, index) => (
                    <TableRow key={index}>
                      <TableCell>{transaction["Reference - Code"]}</TableCell>
                      <TableCell>{transaction["Date"]}</TableCell>
                      <TableCell>{transaction["Settlement Date"]}</TableCell>
                      <TableCell>{transaction["Security Name"]}</TableCell>
                      <TableCell>{transaction["Currency"]}</TableCell>
                      <TableCell>{transaction["Quantity"]}</TableCell>
                      <TableCell>{transaction["Price"]}</TableCell>
                      <TableCell>{transaction["Transaction Amount"]}</TableCell>
                      <TableCell>{transaction["Commission"]}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {allTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All Extracted Transactions</CardTitle>
            <CardDescription>{allTransactions.length} total transactions extracted</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleReset}>
              Reset All
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

