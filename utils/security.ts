/**
 * SECURITY UTILITIES
 * Input sanitization, CSRF protection, encryption helpers
 */

import crypto from 'crypto'
import Logger from './logger'

/**
 * CSRF token management
 */
export class CSRFProtection {
  private static readonly TOKEN_LENGTH = 32
  private static readonly COOKIE_NAME = 'csrf_token'
  private static readonly HEADER_NAME = 'x-csrf-token'

  /**
   * Generate CSRF token
   */
  static generateToken(): string {
    return crypto.randomBytes(this.TOKEN_LENGTH).toString('hex')
  }

  /**
   * Verify CSRF token
   */
  static verifyToken(storedToken: string, providedToken: string): boolean {
    if (!storedToken || !providedToken) {
      return false
    }

    // Use constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(storedToken),
      Buffer.from(providedToken)
    )
  }
}

/**
 * Input sanitization
 */
export class Sanitizer {
  /**
   * Remove potentially dangerous characters
   */
  static sanitizeString(input: string, allowedChars: string = ''): string {
    if (!input) return ''

    let sanitized = input.trim()

    // Remove HTML/script tags
    sanitized = sanitized.replace(/<[^>]*>/g, '')

    // Remove control characters
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '')

    // Limit length
    sanitized = sanitized.substring(0, 10000)

    return sanitized
  }

  /**
   * Sanitize JSON object
   */
  static sanitizeObject(obj: any, maxDepth: number = 5, currentDepth: number = 0): any {
    if (currentDepth > maxDepth) {
      return '[Max depth exceeded]'
    }

    if (obj === null || obj === undefined) {
      return obj
    }

    if (typeof obj === 'string') {
      return this.sanitizeString(obj)
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item, maxDepth, currentDepth + 1)).slice(0, 1000)
    }

    if (typeof obj === 'object') {
      const sanitized: any = {}
      const keys = Object.keys(obj).slice(0, 100) // Limit fields

      for (const key of keys) {
        const sanitizedKey = this.sanitizeString(key)
        sanitized[sanitizedKey] = this.sanitizeObject(obj[key], maxDepth, currentDepth + 1)
      }

      return sanitized
    }

    return obj
  }

  /**
   * Sanitizefor SQL (should use parameterized queries, but as backup)
   */
  static sanitizeSQL(input: string): string {
    return input
      .replace(/['";]/g, '') // Remove quotes and semicolons
      .replace(/--/g, '') // Remove SQL comments
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '')
  }

  /**
   * Sanitize file path to prevent directory traversal
   */
  static sanitizeFilePath(path: string): string {
    return path
      .replace(/\.\./g, '') // Remove ..
      .replace(/[^a-zA-Z0-9-_./]/g, '') // Remove dangerous chars
      .replace(/\/{2,}/g, '/') // Remove double slashes
  }

  /**
   * Escape HTML entities
   */
  static escapeHTML(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    }

    return text.replace(/[&<>"']/g, (char) => map[char])
  }
}

/**
 * Encryption helpers
 */
export class Encryption {
  private static readonly ALGORITHM = 'aes-256-gcm'
  private static readonly ENCODING = 'hex'

  /**
   * Encrypt string with key
   */
  static encrypt(text: string, key: string): string | null {
    try {
      const iv = crypto.randomBytes(16)
      const cipher = crypto.createCipheriv(this.ALGORITHM, Buffer.from(key, this.ENCODING), iv)

      let encrypted = cipher.update(text, 'utf8', this.ENCODING)
      encrypted += cipher.final(this.ENCODING)

      const authTag = cipher.getAuthTag()

      // Return iv:authTag:encrypted
      return `${iv.toString(this.ENCODING)}:${authTag.toString(this.ENCODING)}:${encrypted}`
    } catch (error) {
      Logger.error('Encryption.encrypt: Encryption failed', error)
      return null
    }
  }

  /**
   * Decrypt encrypted string
   */
  static decrypt(encryptedText: string, key: string): string | null {
    try {
      const parts = encryptedText.split(':')
      if (parts.length !== 3) {
        return null
      }

      const iv = Buffer.from(parts[0], this.ENCODING)
      const authTag = Buffer.from(parts[1], this.ENCODING)
      const encrypted = parts[2]

      const decipher = crypto.createDecipheriv(this.ALGORITHM, Buffer.from(key, this.ENCODING), iv)
      decipher.setAuthTag(authTag)

      let decrypted = decipher.update(encrypted, this.ENCODING, 'utf8')
      decrypted += decipher.final('utf8')

      return decrypted
    } catch (error) {
      Logger.error('Encryption.decrypt: Decryption failed', error)
      return null
    }
  }

  /**
   * Hash password (use bcrypt in production)
   */
  static hashPassword(password: string): string {
    return crypto
      .createHash('sha256')
      .update(password + (process.env.PASSWORD_SALT || ''))
      .digest('hex')
  }

  /**
   * Compare password hash
   */
  static comparePassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash
  }
}

/**
 * Content Security Policy helpers
 */
export class CSPHelper {
  static generateCSPHeader(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Will strengthen in production
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.anthropic.com https://api.groq.com",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  }
}

/**
 * Rate limiting helpers
 */
export class RateLimitHelper {
  private static readonly storage = new Map<string, { count: number; resetAt: number }>()

  /**
   * Check rate limit
   */
  static checkRateLimit(key: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now()
    let record = RateLimitHelper.storage.get(key)

    if (!record || record.resetAt < now) {
      record = { count: 0, resetAt: now + windowMs }
      RateLimitHelper.storage.set(key, record)
    }

    record.count++
    return record.count <= maxRequests
  }

  /**
   * Get remaining requests
   */
  static getRemainingRequests(key: string, maxRequests: number = 10): number {
    const record = RateLimitHelper.storage.get(key)
    if (!record) return maxRequests
    return Math.max(0, maxRequests - record.count)
  }

  /**
   * Clear rate limit
   */
  static clearRateLimit(key: string): void {
    RateLimitHelper.storage.delete(key)
  }

  /**
   * Clean old records (call periodically)
   */
  static cleanup(): void {
    const now = Date.now()
    for (const [key, record] of RateLimitHelper.storage.entries()) {
      if (record.resetAt < now) {
        RateLimitHelper.storage.delete(key)
      }
    }
  }
}

export default {
  CSRFProtection,
  Sanitizer,
  Encryption,
  CSPHelper,
  RateLimitHelper,
}
