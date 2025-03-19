import { type NextRequest, NextResponse } from "next/server"
import { extractRawText } from "@/utils/invoice-utils"
import { logger } from "@/utils/logger"
import { AppError, ErrorType, handleError } from "@/utils/error-handler"

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  
  try {
    logger.info(`Processing invoice extraction request`, { requestId });
    
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
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      logger.warn(`Invalid file type`, { requestId, fileType: file.type });
      return NextResponse.json(
        { error: "File type not supported. Please upload PDF, JPG, or PNG", requestId },
        { status: 400 }
      );
    }
    
    // Extract raw text from the file
    logger.info(`Extracting text from file`, { requestId, fileName: file.name, fileType: file.type });
    const rawText = await extractRawText(file);
    
    logger.info(`Text extraction successful`, { requestId, textLength: rawText.length });
    
    // Return the raw text for further processing
    return NextResponse.json({ data: rawText, requestId });
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

