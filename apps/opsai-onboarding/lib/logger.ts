// Production-safe logging utility

const isDevelopment = process.env.NODE_ENV === 'development'
const isTest = process.env.NODE_ENV === 'test'

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const currentLogLevel = isDevelopment ? LogLevel.DEBUG : LogLevel.ERROR

class Logger {
  private context: string

  constructor(context: string = 'App') {
    this.context = context
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= currentLogLevel && !isTest
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString()
    const formattedMessage = `[${timestamp}] [${level}] [${this.context}] ${message}`
    
    if (data && isDevelopment) {
      return `${formattedMessage}\n${JSON.stringify(data, null, 2)}`
    }
    
    return formattedMessage
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('DEBUG', message, data))
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('INFO', message, data))
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message, data))
    }
  }

  error(message: string, error?: Error | any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorData = error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
      
      console.error(this.formatMessage('ERROR', message, errorData))
    }
  }

  // For production, we might want to send errors to a service
  async logToService(level: LogLevel, message: string, data?: any): Promise<void> {
    // In production, this could send to Sentry, LogRocket, etc.
    // For now, it's a no-op
  }
}

// Export singleton instances for common contexts
export const logger = new Logger('General')
export const apiLogger = new Logger('API')
export const authLogger = new Logger('Auth')
export const dbLogger = new Logger('Database')

// Export the Logger class for custom contexts
export default Logger