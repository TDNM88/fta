import { AppError, ErrorSeverity } from './error-handler'

// Log levels
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

// Map environment variable to log level
function getLogLevelFromEnv(): LogLevel {
  const envLevel = process.env.LOG_LEVEL?.toUpperCase()
  switch (envLevel) {
    case 'DEBUG':
      return LogLevel.DEBUG
    case 'INFO':
      return LogLevel.INFO
    case 'WARN':
      return LogLevel.WARN
    case 'ERROR':
      return LogLevel.ERROR
    default:
      return LogLevel.INFO // Default to INFO
  }
}

// Current log level
const currentLogLevel = getLogLevelFromEnv()

// Log level priority
const logLevelPriority: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
}

// Check if a log level should be logged
function shouldLog(level: LogLevel): boolean {
  return logLevelPriority[level] >= logLevelPriority[currentLogLevel]
}

// Format log message
function formatLogMessage(level: LogLevel, message: string, meta?: Record<string, any>): string {
  const timestamp = new Date().toISOString()
  const metaString = meta ? ` ${JSON.stringify(meta)}` : ''
  return `[${timestamp}] [${level}] ${message}${metaString}`
}

// Log to appropriate destination
function logToDestination(level: LogLevel, formattedMessage: string): void {
  // In a production environment, you would send logs to a service like Datadog, Sentry, etc.
  // For now, we'll use console methods
  switch (level) {
    case LogLevel.DEBUG:
      console.debug(formattedMessage)
      break
    case LogLevel.INFO:
      console.info(formattedMessage)
      break
    case LogLevel.WARN:
      console.warn(formattedMessage)
      break
    case LogLevel.ERROR:
      console.error(formattedMessage)
      break
  }
}

// Logger interface
export interface Logger {
  debug(message: string, meta?: Record<string, any>): void
  info(message: string, meta?: Record<string, any>): void
  warn(message: string, meta?: Record<string, any>): void
  error(message: string | Error | AppError, meta?: Record<string, any>): void
}

// Create logger
export function createLogger(namespace: string): Logger {
  return {
    debug(message: string, meta?: Record<string, any>): void {
      if (shouldLog(LogLevel.DEBUG)) {
        const formattedMessage = formatLogMessage(LogLevel.DEBUG, `[${namespace}] ${message}`, meta)
        logToDestination(LogLevel.DEBUG, formattedMessage)
      }
    },
    
    info(message: string, meta?: Record<string, any>): void {
      if (shouldLog(LogLevel.INFO)) {
        const formattedMessage = formatLogMessage(LogLevel.INFO, `[${namespace}] ${message}`, meta)
        logToDestination(LogLevel.INFO, formattedMessage)
      }
    },
    
    warn(message: string, meta?: Record<string, any>): void {
      if (shouldLog(LogLevel.WARN)) {
        const formattedMessage = formatLogMessage(LogLevel.WARN, `[${namespace}] ${message}`, meta)
        logToDestination(LogLevel.WARN, formattedMessage)
      }
    },
    
    error(message: string | Error | AppError, meta?: Record<string, any>): void {
      if (shouldLog(LogLevel.ERROR)) {
        let errorMessage: string
        let errorMeta: Record<string, any> = meta || {}
        
        if (message instanceof AppError) {
          errorMessage = message.message
          errorMeta = {
            ...errorMeta,
            type: message.type,
            severity: message.severity,
            context: message.context,
            stack: message.stack,
          }
          
          if (message.originalError) {
            errorMeta.originalError = {
              message: message.originalError.message,
              stack: message.originalError.stack,
            }
          }
        } else if (message instanceof Error) {
          errorMessage = message.message
          errorMeta = {
            ...errorMeta,
            stack: message.stack,
          }
        } else {
          errorMessage = message
        }
        
        const formattedMessage = formatLogMessage(LogLevel.ERROR, `[${namespace}] ${errorMessage}`, errorMeta)
        logToDestination(LogLevel.ERROR, formattedMessage)
      }
    },
  }
}

// Default logger
export const logger = createLogger('app')
