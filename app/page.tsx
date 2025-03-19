"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import InvoiceExtractor from "@/components/invoice-extractor"
import TransactionExtractor from "@/components/transaction-extractor"

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">Document Extraction App</h1>
          <p className="text-gray-500 mt-2">Extract data from invoices and transaction documents</p>
        </div>

        <Tabs defaultValue="invoice" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="invoice">Invoice Extractor</TabsTrigger>
            <TabsTrigger value="transaction">Transaction Extractor</TabsTrigger>
          </TabsList>
          <TabsContent value="invoice">
            <InvoiceExtractor />
          </TabsContent>
          <TabsContent value="transaction">
            <TransactionExtractor />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

