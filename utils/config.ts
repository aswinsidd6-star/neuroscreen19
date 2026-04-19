/**
 * ENVIRONMENT & CONFIGURATION MANAGEMENT
 * Ensures secure handling of environment variables and configuration
 */

import Logger from './logger'

/**
 * Configuration schema - defines all required and optional configs
 */
interface ConfigSchema {
  // API Keys (server-side only)
  ANTHROPIC_API_KEY?: string
  GROQ_API_KEY?: string
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string

  // Security
  SECRET_KEY: string
  PASSWORD_SALT: string

  // Environment
  NODE_ENV: 'development' | 'production' | 'test'
  NEXT_PUBLIC_APP_URL: string

  // Database
  DATABASE_URL?: string

  // Feature flags
  ENABLE_AI_REPORTS?: 'true' | 'false'
  ENABLE_CLOUD_STORAGE?: 'true' | 'false'

  // Logging
  LOG_LEVEL?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
}

/**
 * Config validator and accessor
 */
export class Config {
  private static validated = false
  private static config: Record<string, string> = {}

  /**
   * Initialize and validate configuration
   */
  static init(): void {
    if (this.validated) return

    Logger.info('Config: Initializing configuration')

    // Load from environment - filter out undefined values
    this.config = Object.entries(process.env).reduce(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value
        }
        return acc
      },
      {} as Record<string, string>
    )

    // Validate required fields
    const required: (keyof ConfigSchema)[] = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'SECRET_KEY',
      'PASSWORD_SALT',
      'NEXT_PUBLIC_APP_URL',
    ]

    const missing: string[] = []
    for (const field of required) {
      if (!this.config[field]) {
        missing.push(field)
      }
    }

    if (missing.length > 0) {
      const error = `Missing required environment variables: ${missing.join(', ')}`
      Logger.error('Config: Validation failed', new Error(error))
      // In production, this should throw an error
      if (process.env.NODE_ENV === 'production') {
        throw new Error(error)
      }
    }

    this.validated = true
    Logger.info('Config: Configuration validated successfully')
  }

  /**
   * Get config value (safe for client-side)
   */
  static get(key: keyof ConfigSchema, fallback?: string): string {
    this.init()

    const value = this.config[key] || fallback

    // Warn if trying to access server-only variable on client
    if (typeof window !== 'undefined' && this.isServerOnlyVariable(key)) {
      Logger.warn('Config: Attempting to access server-only variable on client', { key })
      return ''
    }

    return value || ''
  }

  /**
   * Get config value as boolean
   */
  static getBoolean(key: keyof ConfigSchema, fallback: boolean = false): boolean {
    const value = this.get(key, '')
    if (value === '') return fallback
    return value.toLowerCase() === 'true'
  }

  /**
   * Check if variable is server-only
   */
  private static isServerOnlyVariable(key: keyof ConfigSchema): boolean {
    const serverOnlyVars = [
      'ANTHROPIC_API_KEY',
      'GROQ_API_KEY',
      'SECRET_KEY',
      'PASSWORD_SALT',
      'DATABASE_URL',
    ]
    return serverOnlyVars.includes(key)
  }

  /**
   * Get all public config (safe for client)
   */
  static getPublicConfig() {
    this.init()

    return {
      NEXT_PUBLIC_APP_URL: this.get('NEXT_PUBLIC_APP_URL'),
      NODE_ENV: this.get('NODE_ENV'),
      LOG_LEVEL: this.get('LOG_LEVEL', 'INFO'),
    }
  }
}

/**
 * Feature flags
 */
export class Features {
  static isAIReportsEnabled(): boolean {
    return Config.getBoolean('ENABLE_AI_REPORTS', true)
  }

  static isCloudStorageEnabled(): boolean {
    return Config.getBoolean('ENABLE_CLOUD_STORAGE', false)
  }

  static isDevelopment(): boolean {
    return Config.get('NODE_ENV') === 'development'
  }

  static isProduction(): boolean {
    return Config.get('NODE_ENV') === 'production'
  }
}

/**
 * Validate server-side only access
 */
export function ensureServerSide(context: string = ''): void {
  if (typeof window !== 'undefined') {
    const msg = `Server-only operation attempted on client: ${context}`
    Logger.error('Config: Server-side only operation called from client', new Error(msg))
    throw new Error('This operation can only be performed on server')
  }
}

/**
 * Initialize all configurations on app startup
 */
export function initializeConfig(): void {
  Config.init()
  Logger.info('Config: All configurations initialized')
}

export default Config
