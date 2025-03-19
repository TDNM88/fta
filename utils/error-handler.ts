// Error types
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  API = 'API',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  NETWORK = 'NETWORK',
  UNKNOWN = 'UNKNOWN',
}

// Error severity levels
export enum ErrorSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

// Application error class
export class AppError extends Error {
  type: ErrorType
  severity: ErrorSeverity
  context?: Record<string, any>
  originalError?: Error

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    context?: Record<string, any>,
    originalError?: Error
  ) {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.severity = severity
    this.context = context
    this.originalError = originalError
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError)
    }
  }
}

// Error handler function
export function handleError(error: unknown, context?: Record<string, any>): AppError {
  // Already an AppError
  if (error instanceof AppError) {
    // Add additional context if provided
    if (context) {
      error.context = { ...error.context, ...context }
    }
    return error
  }
  
  // Standard Error
  if (error instanceof Error) {
    return new AppError(
      error.message,
      ErrorType.UNKNOWN,
      ErrorSeverity.ERROR,
      context,
      error
    )
  }
  
  // String error
  if (typeof error === 'string') {
    return new AppError(error, ErrorType.UNKNOWN, ErrorSeverity.ERROR, context)
  }
  
  // Unknown error type
  return new AppError(
    'An unknown error occurred',
    ErrorType.UNKNOWN,
    ErrorSeverity.ERROR,
    context
  )
}

// Function to create validation errors
export function createValidationError(message: string, context?: Record<string, any>): AppError {
  return new AppError(message, ErrorType.VALIDATION, ErrorSeverity.WARNING, context)
}

// Function to create API errors
export function createApiError(message: string, context?: Record<string, any>): AppError {
  return new AppError(message, ErrorType.API, ErrorSeverity.ERROR, context)
}
