import { type NextRequest, NextResponse } from "next/server"
import { extractRawText } from "@/utils/invoice-utils"

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
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "File type not supported. Please upload PDF, JPG, or PNG" }, { status: 400 })
    }

    // Extract raw text from the file
    const rawText = await extractRawText(file)

    // Return the raw text for further processing
    return NextResponse.json({ data: rawText })
  } catch (error) {
    console.error("Invoice extraction error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process invoice" },
      { status: 500 },
    )
  }
}

