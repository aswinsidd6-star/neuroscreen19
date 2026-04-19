/**
 * API MIDDLEWARE UTILITIES
 * Authentication, error handling, and request validation
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { ApiResponse } from '@/types'
import Logger from '@/utils/logger'
import { createErrorResponse, createSuccessResponse } from '@/utils/helpers'
import Validator from '@/utils/validator'

/**
 * Middleware: Generate and attach request ID
 */
export function withRequestId(handler: any) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const requestId = req.headers['x-request-id'] as string || Logger.generateRequestId()
    Logger.setRequestId(requestId)
    res.setHeader('X-Request-ID', requestId)

    Logger.info('Incoming request', {
      method: req.method,
      path: req.url,
      userAgent: req.headers['user-agent']?.substring(0, 100),
    })

    return handler(req, res)
  }
}

/**
 * Middleware: Validate HTTP method
 */
export function requireMethod(...methods: string[]) {
  return (handler: any) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      if (!methods.includes(req.method || '')) {
        Logger.warn('Invalid HTTP method', { method: req.method, allowed: methods })
        return res.status(405).json(
          createErrorResponse(
            new Error(`Method ${req.method} not allowed`),
            405,
            `Only ${methods.join(', ')} are allowed`
          )
        )
      }
      return handler(req, res)
    }
  }
}

/**
 * Middleware: Validate request body
 */
export function requireBody(requiredFields: string[]) {
  return (handler: any) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      const { body } = req

      if (!body || typeof body !== 'object') {
        return res.status(400).json(
          createErrorResponse(new Error('Request body is required'), 400)
        )
      }

      // Check required fields
      const errors = Validator.validateRequired(body, requiredFields)
      if (errors.length > 0) {
        Logger.warn('Missing required fields', { missingFields: errors.map((e) => e.field) })
        return res.status(400).json(
          createErrorResponse(
            new Error(`Missing required fields: ${errors.map((e) => e.field).join(', ')}`),
            400
          )
        )
      }

      return handler(req, res)
    }
  }
}

/**
 * Middleware: Rate limiting (simple in-memory implementation)
 */
const requestCounts = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(
  maxRequests: number = 10,
  windowMs: number = 60000
) {
  return (handler: any) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      const clientId = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown'
      const now = Date.now()

      let record = requestCounts.get(clientId)
      if (!record || record.resetAt < now) {
        record = { count: 0, resetAt: now + windowMs }
        requestCounts.set(clientId, record)
      }

      record.count++

      if (record.count > maxRequests) {
        Logger.warn('Rate limit exceeded', { clientId, count: record.count, limit: maxRequests })
        return res.status(429).json(
          createErrorResponse(
            new Error('Too many requests'),
            429,
            `Rate limit exceeded: max ${maxRequests} requests per ${windowMs}ms`
          )
        )
      }

      res.setHeader('X-RateLimit-Limit', maxRequests)
      res.setHeader('X-RateLimit-Remaining', maxRequests - record.count)
      res.setHeader('X-RateLimit-Reset', record.resetAt)

      return handler(req, res)
    }
  }
}

/**
 * Middleware: Error handling wrapper
 */
export function withErrorHandler(handler: any) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      return await handler(req, res)
    } catch (error) {
      Logger.error('Unhandled API error', error, {
        path: req.url,
        method: req.method,
      })

      const statusCode = (error as any)?.statusCode || 500
      return res.status(statusCode).json(
        createErrorResponse(error, statusCode)
      )
    }
  }
}

/**
 * Middleware: CORS headers
 */
export function withCORS(allowOrigins: string[] = ['http://localhost:3000', 'http://localhost:3001']) {
  return (handler: any) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      const origin = req.headers.origin || ''
      if (allowOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin)
      }

      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID')
      res.setHeader('Access-Control-Allow-Credentials', 'true')
      res.setHeader('Access-Control-Max-Age', '86400')

      if (req.method === 'OPTIONS') {
        return res.status(200).end()
      }

      return handler(req, res)
    }
  }
}

/**
 * Middleware: Security headers
 */
export function withSecurityHeaders(handler: any) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'SAMEORIGIN')
    res.setHeader('X-XSS-Protection', '1; mode=block')
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    )

    return handler(req, res)
  }
}

/**
 * Compose multiple middleware
 */
export function compose(...middlewares: any[]) {
  return (handler: any) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler)
  }
}

export default {
  withRequestId,
  requireMethod,
  requireBody,
  rateLimit,
  withErrorHandler,
  withCORS,
  withSecurityHeaders,
  compose,
}
