/**
 * STRUCTURED LOGGING UTILITY
 * Multi-level logging with request tracing
 */

import { LogLevel, LogEntry } from '@/types'

class Logger {
  private static requestId: string = ''

  /**
   * Set request ID for tracing across service calls
   */
  static setRequestId(id: string) {
    Logger.requestId = id
  }

  /**
   * Get current request ID
   */
  static getRequestId(): string {
    return Logger.requestId
  }

  /**
   * Generate unique request ID if not set
   */
  static generateRequestId(): string {
    if (!Logger.requestId) {
      Logger.requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`
    }
    return Logger.requestId
  }

  /**
   * Log entry factory
   */
  private static createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: any
  ): LogEntry {
    return {
      level,
      timestamp: new Date().toISOString(),
      message,
      context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
      } : error,
      requestId: Logger.requestId,
    }
  }

  /**
   * Format log entry for console output
   */
  private static formatLog(entry: LogEntry): string {
    const { level, timestamp, message, requestId, context } = entry
    const parts = [
      `[${level}]`,
      timestamp,
      requestId ? `[${requestId}]` : '',
      message,
      context ? JSON.stringify(context) : '',
    ]
    return parts.filter(Boolean).join(' ')
  }

  /**
   * Write log to console and optionally persist
   */
  private static write(entry: LogEntry) {
    const formatted = Logger.formatLog(entry)

    if (typeof window === 'undefined') {
      // SERVER-SIDE: Use console + optionally persist to file/database
      switch (entry.level) {
        case 'ERROR':
          console.error(formatted, entry.error || '')
          break
        case 'WARN':
          console.warn(formatted)
          break
        default:
          console.log(formatted)
      }
    } else {
      // CLIENT-SIDE: Use console styling
      const color = {
        INFO: '#0ea5e9',
        WARN: '#f59e0b',
        ERROR: '#ef4444',
        DEBUG: '#6366f1',
      }[entry.level] || '#000'

      console.log(`%c${formatted}`, `color: ${color}; font-weight: bold`)
    }
  }

  static info(message: string, context?: Record<string, any>) {
    const entry = Logger.createLogEntry('INFO', message, context)
    Logger.write(entry)
  }

  static warn(message: string, context?: Record<string, any>) {
    const entry = Logger.createLogEntry('WARN', message, context)
    Logger.write(entry)
  }

  static error(message: string, error?: any, context?: Record<string, any>) {
    const entry = Logger.createLogEntry('ERROR', message, context, error)
    Logger.write(entry)
  }

  static debug(message: string, context?: Record<string, any>) {
    if (process.env.NODE_ENV === 'development') {
      const entry = Logger.createLogEntry('DEBUG', message, context)
      Logger.write(entry)
    }
  }
}

export default Logger
