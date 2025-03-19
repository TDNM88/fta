import { type NextRequest, NextResponse } from "next/server"
import { extractTransactionData } from "@/utils/transaction-utils"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 })
    }

    // Check file type
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "File type not supported. Please upload a PDF file" }, { status: 400 })
    }

    // Extract and process transactions
    const transactions = await extractTransactionData(file)

    return NextResponse.json({ data: transactions })
  } catch (error) {
    console.error("Transaction extraction error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process transactions" },
      { status: 500 },
    )
  }
}

