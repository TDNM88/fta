import { type NextRequest, NextResponse } from "next/server"
import { extractTransactionData } from "@/utils/transaction-utils"
import { logger } from "@/utils/logger"
import { AppError, ErrorType, handleError } from "@/utils/error-handler"

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  
  try {
    logger.info(`Processing transaction extraction request`, { requestId });
    
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      logger.warn(`No file provided in request`, { requestId });
      return NextResponse.json(
        { error: "No file provided", requestId },
        { status: 400 }
      );
    }
    
    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      logger.warn(`File size exceeds limit`, { requestId, fileSize: file.size });
      return NextResponse.json(
        { error: "File size exceeds 10MB limit", requestId },
        { status: 400 }
      );
    }
    
    // Check file type
    if (file.type !== "application/pdf") {
      logger.warn(`Invalid file type`, { requestId, fileType: file.type });
      return NextResponse.json(
        { error: "File type not supported. Please upload a PDF file", requestId },
        { status: 400 }
      );
    }
    
    // Extract and process transactions
    logger.info(`Extracting transactions from file`, { requestId, fileName: file.name });
    const transactions = await extractTransactionData(file);
    
    logger.info(`Transaction extraction successful`, { requestId, transactionCount: transactions.length });
    
    return NextResponse.json({ data: transactions, requestId });
  } catch (error) {
    const appError = handleError(error, { requestId });
    
    logger.error(appError);
    
    return NextResponse.json(
      { 
        error: appError.message, 
        requestId,
        ...(process.env.NODE_ENV !== 'production' && { stack: appError.stack })
      },
      { status: appError.type === ErrorType.VALIDATION ? 400 : 500 }
    );
  }
}

