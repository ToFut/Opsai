import chalk from 'chalk'

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  timestamp: Date
  level: LogLevel
  message: string
  context?: string
  data?: any
}

export class Logger {
  private context: string
  private level: LogLevel
  private entries: LogEntry[] = []

  constructor(context: string, level: LogLevel = LogLevel.INFO) {
    this.context = context
    this.level = level
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.level = level
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data)
  }

  /**
   * Log info message
   */
  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data)
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data)
  }

  /**
   * Log error message
   */
  error(message: string, error?: any): void {
    this.log(LogLevel.ERROR, message, error)
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, data?: any): void {
    if (level < this.level) return

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context: this.context,
      data
    }

    this.entries.push(entry)
    this.output(entry)
  }

  /**
   * Output log entry to console
   */
  private output(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString()
    const levelStr = this.getLevelString(entry.level)
    const contextStr = `[${entry.context}]`
    
    let output = `${timestamp} ${levelStr} ${contextStr} ${entry.message}`
    
    if (entry.data) {
      if (entry.data instanceof Error) {
        output += `\n${entry.data.stack || entry.data.message}`
      } else {
        output += `\n${JSON.stringify(entry.data, null, 2)}`
      }
    }

    console.log(output)
  }

  /**
   * Get colored level string
   */
  private getLevelString(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return chalk.gray('DEBUG')
      case LogLevel.INFO:
        return chalk.blue('INFO ')
      case LogLevel.WARN:
        return chalk.yellow('WARN ')
      case LogLevel.ERROR:
        return chalk.red('ERROR')
      default:
        return chalk.white('UNKNOWN')
    }
  }

  /**
   * Get all log entries
   */
  getEntries(): LogEntry[] {
    return [...this.entries]
  }

  /**
   * Get log entries by level
   */
  getEntriesByLevel(level: LogLevel): LogEntry[] {
    return this.entries.filter(entry => entry.level === level)
  }

  /**
   * Get log entries by context
   */
  getEntriesByContext(context: string): LogEntry[] {
    return this.entries.filter(entry => entry.context === context)
  }

  /**
   * Clear log entries
   */
  clear(): void {
    this.entries = []
  }

  /**
   * Export logs to file
   */
  async exportToFile(filePath: string): Promise<void> {
    const fs = await import('fs/promises')
    const content = this.entries.map(entry => 
      `${entry.timestamp.toISOString()} [${entry.level}] [${entry.context}] ${entry.message}`
    ).join('\n')
    
    await fs.writeFile(filePath, content, 'utf8')
  }

  /**
   * Create child logger with sub-context
   */
  child(subContext: string): Logger {
    const childLogger = new Logger(`${this.context}:${subContext}`, this.level)
    return childLogger
  }
}