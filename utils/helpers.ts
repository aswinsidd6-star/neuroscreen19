/**
 * HELPER UTILITIES
 * Common utility functions for API responses, error handling, etc.
 */

import { ApiResponse, ApiError } from '@/types'
import Logger from './logger'

/**
 * Create standardized success response
 */
export function createSuccessResponse<T = any>(
  data: T,
  message?: string,
  statusCode: number = 200
): ApiResponse<T> {
  return {
    success: true,
    data,
    message: message || 'Operation successful',
    statusCode,
    timestamp: new Date().toISOString(),
    requestId: Logger.getRequestId(),
  }
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: any,
  statusCode: number = 500,
  message?: string
): ApiResponse {
  const errorMessage = error instanceof Error ? error.message : String(error)

  return {
    success: false,
    error: message || errorMessage,
    statusCode,
    timestamp: new Date().toISOString(),
    requestId: Logger.getRequestId(),
  }
}

/**
 * Safely stringify objects (handles circular refs)
 */
export function safestringify(obj: any, space?: number): string {
  try {
    const seen = new Set()
    return JSON.stringify(
      obj,
      (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular]'
          }
          seen.add(value)
        }
        return value
      },
      space
    )
  } catch (error) {
    return '[Unable to stringify]'
  }
}

/**
 * Parse JSON safely
 */
export function safeJsonParse<T = any>(json: string, fallback?: T): T {
  try {
    return JSON.parse(json)
  } catch (error) {
    Logger.warn('SafeJsonParse: Invalid JSON', { error })
    return fallback || ({} as T)
  }
}

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(7)}`
}

/**
 * Delay execution (for retries, timeouts)
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Retry function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: any

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt < maxAttempts - 1) {
        const delayTime = baseDelayMs * Math.pow(2, attempt)
        Logger.warn(`WithRetry: Attempt ${attempt + 1} failed, retrying in ${delayTime}ms...`, {
          error,
        })
        await delay(delayTime)
      }
    }
  }

  throw lastError
}

/**
 * Truncate string to max length
 */
export function truncate(str: string, maxLength: number): string {
  if (!str) return ''
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength) + '...'
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)}%`
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Check if running on server
 */
export function isServer(): boolean {
  return typeof window === 'undefined'
}

/**
 * Check if running on client
 */
export function isClient(): boolean {
  return typeof window !== 'undefined'
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as any
  if (obj instanceof Array) return obj.map((item) => deepClone(item)) as any
  if (obj instanceof Object) {
    const clonedObj: any = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
  return obj
}

/**
 * Merge objects shallow
 */
export function mergeObjects<T extends Record<string, any>>(base: T, ...sources: Partial<T>[]): T {
  const result = { ...base }
  for (const source of sources) {
    if (source) {
      Object.assign(result, source)
    }
  }
  return result
}

export default {
  createSuccessResponse,
  createErrorResponse,
  safestringify,
  safeJsonParse,
  generateRequestId,
  delay,
  withRetry,
  truncate,
  formatPercentage,
  formatDate,
  isServer,
  isClient,
  deepClone,
  mergeObjects,
}
