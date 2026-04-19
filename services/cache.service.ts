/**
 * CACHING SERVICE (PHASE 7 - PERFORMANCE OPTIMIZATION)
 * Multi-tier caching system with TTL, invalidation, and memory management
 */

import Logger from '@/utils/logger'

export type CacheKey = string

export interface CacheEntry<T> {
  value: T
  expiresAt: number
  createdAt: number
  hits: number
}

export interface CacheConfig {
  maxSize?: number
  defaultTTL?: number // in milliseconds
  autoCleanup?: boolean
  cleanupInterval?: number
}

/**
 * In-Memory Cache Service
 * Lightweight, fast cache for frequently accessed data
 */
export class CacheService {
  private static instance: CacheService
  private cache: Map<CacheKey, CacheEntry<any>> = new Map()
  private config: Required<CacheConfig>
  private cleanupTimer?: NodeJS.Timeout

  private constructor(config: CacheConfig = {}) {
    this.config = {
      maxSize: config.maxSize || 500, // entries
      defaultTTL: config.defaultTTL || 5 * 60 * 1000, // 5 minutes
      autoCleanup: config.autoCleanup !== false,
      cleanupInterval: config.cleanupInterval || 60 * 1000, // 1 minute
    }

    if (this.config.autoCleanup) {
      this.startCleanup()
    }

    Logger.info('CacheService: Initialized', { config: this.config })
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: CacheConfig): CacheService {
    if (!this.instance) {
      this.instance = new CacheService(config)
    }
    return this.instance
  }

  /**
   * Set value in cache
   */
  set<T>(key: CacheKey, value: T, ttl?: number): void {
    try {
      const now = Date.now()
      const expiresAt = now + (ttl || this.config.defaultTTL)

      if (this.cache.size >= this.config.maxSize) {
        this.evictLRU()
      }

      this.cache.set(key, {
        value,
        expiresAt,
        createdAt: now,
        hits: 0,
      })

      Logger.debug('CacheService: Value cached', { key, ttl })
    } catch (error) {
      Logger.warn('CacheService: Failed to cache value', { error, key })
    }
  }

  /**
   * Get value from cache
   */
  get<T>(key: CacheKey): T | null {
    try {
      const entry = this.cache.get(key)
      if (!entry) return null

      const now = Date.now()
      if (now > entry.expiresAt) {
        this.cache.delete(key)
        Logger.debug('CacheService: Cache entry expired', { key })
        return null
      }

      entry.hits++
      Logger.debug('CacheService: Cache hit', { key, hits: entry.hits })
      return entry.value as T
    } catch (error) {
      Logger.warn('CacheService: Failed to retrieve from cache', { error, key })
      return null
    }
  }

  /**
   * Check if key exists and is valid
   */
  has(key: CacheKey): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * Delete specific key
   */
  delete(key: CacheKey): boolean {
    return this.cache.delete(key)
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
    Logger.info('CacheService: Cache cleared')
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    maxSize: number
    entries: Array<{ key: string; hits: number; age: number; ttl: number }>
  } {
    const now = Date.now()
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({
        key,
        hits: entry.hits,
        age: now - entry.createdAt,
        ttl: entry.expiresAt - now,
      }))
      .sort((a, b) => b.hits - a.hits)

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      entries,
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let lruKey: CacheKey | null = null
    let lruHits = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits < lruHits) {
        lruHits = entry.hits
        lruKey = key
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey)
      Logger.debug('CacheService: Evicted LRU entry', { key: lruKey })
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    let expiredCount = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
        expiredCount++
      }
    }

    if (expiredCount > 0) {
      Logger.debug('CacheService: Cleanup complete', {
        expiredEntries: expiredCount,
        remainingEntries: this.cache.size,
      })
    }
  }

  /**
   * Start automatic cleanup interval
   */
  private startCleanup(): void {
    if (this.cleanupTimer) return

    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)

    Logger.info('CacheService: Cleanup started', {
      interval: this.config.cleanupInterval,
    })
  }

  /**
   * Stop automatic cleanup
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = undefined
      Logger.info('CacheService: Cleanup stopped')
    }
  }

  /**
   * Cache with automatic refresh
   */
  setWithRefresh<T>(
    key: CacheKey,
    value: T,
    ttl: number,
    refreshFn?: () => Promise<T>
  ): void {
    this.set(key, value, ttl)

    if (refreshFn) {
      setTimeout(async () => {
        try {
          const freshValue = await refreshFn()
          this.set(key, freshValue, ttl)
          Logger.debug('CacheService: Cache refreshed', { key })
        } catch (error) {
          Logger.warn('CacheService: Failed to refresh cache', { error, key })
        }
      }, ttl * 0.8) // Refresh at 80% of TTL
    }
  }
}

/**
 * Query Result Cache Decorator
 * Caches query results with key generation
 */
export function withCache<T>(
  ttl: number = 5 * 60 * 1000,
  keyGenerator?: (...args: any[]) => string
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value
    const cache = CacheService.getInstance()

    descriptor.value = function (...args: any[]) {
      const cacheKey =
        keyGenerator?.(...args) || `${propertyKey}:${JSON.stringify(args)}`

      // Try to get from cache
      const cached = cache.get<T>(cacheKey)
      if (cached !== null) {
        Logger.debug('CacheService: Returning cached result', { cacheKey })
        return cached
      }

      // Execute method and cache result
      const result = originalMethod.apply(this, args)

      if (result instanceof Promise) {
        return result.then((value: T) => {
          cache.set(cacheKey, value, ttl)
          return value
        })
      } else {
        cache.set(cacheKey, result, ttl)
        return result
      }
    }

    return descriptor
  }
}

/**
 * Specific Cache Keys for Different Data Types
 */
export class CacheKeys {
  static patient(id: string) {
    return `patient:${id}`
  }

  static patientAll(doctorId: string) {
    return `patients:${doctorId}:all`
  }

  static assessment(id: string) {
    return `assessment:${id}`
  }

  static assessmentsByPatient(patientId: string) {
    return `assessments:patient:${patientId}`
  }

  static result(id: string) {
    return `result:${id}`
  }

  static resultsByPatient(patientId: string) {
    return `results:patient:${patientId}`
  }

  static doctor(id: string) {
    return `doctor:${id}`
  }

  static doctorByUser(userId: string) {
    return `doctor:user:${userId}`
  }

  static aiAnalysis(inputHash: string) {
    return `ai:analysis:${inputHash}`
  }

  static scoringResult(answersHash: string) {
    return `scoring:${answersHash}`
  }

  static patternAnalysis(patientId: string) {
    return `patterns:${patientId}`
  }
}

/**
 * Cache Invalidation Patterns
 */
export class CacheInvalidator {
  private cache: CacheService

  constructor() {
    this.cache = CacheService.getInstance()
  }

  /**
   * Invalidate all patient-related caches
   */
  invalidatePatient(patientId: string): void {
    Logger.info('CacheInvalidator: Invalidating patient caches', { patientId })

    this.cache.delete(CacheKeys.patient(patientId))
    this.cache.delete(CacheKeys.assessmentsByPatient(patientId))
    this.cache.delete(CacheKeys.resultsByPatient(patientId))
    this.cache.delete(CacheKeys.patternAnalysis(patientId))
  }

  /**
   * Invalidate all doctor patient lists
   */
  invalidateDoctorPatients(doctorId: string): void {
    Logger.info('CacheInvalidator: Invalidating doctor patient list', { doctorId })

    this.cache.delete(CacheKeys.patientAll(doctorId))
  }

  /**
   * Invalidate assessment-related caches
   */
  invalidateAssessment(patientId: string): void {
    Logger.info('CacheInvalidator: Invalidating assessment caches', { patientId })

    this.cache.delete(CacheKeys.assessmentsByPatient(patientId))
    this.invalidatePatient(patientId) // Cascade invalidation
  }

  /**
   * Invalidate result-related caches
   */
  invalidateResult(patientId: string): void {
    Logger.info('CacheInvalidator: Invalidating result caches', { patientId })

    this.cache.delete(CacheKeys.resultsByPatient(patientId))
    this.invalidatePatient(patientId) // Cascade invalidation
  }

  /**
   * Invalidate AI analysis cache
   */
  invalidateAIAnalysis(inputHash: string): void {
    this.cache.delete(CacheKeys.aiAnalysis(inputHash))
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    Logger.warn('CacheInvalidator: Clearing entire cache')
    this.cache.clear()
  }
}

// Export singleton instance
export const cacheService = CacheService.getInstance()
export const cacheInvalidator = new CacheInvalidator()

export default CacheService
