/**
 * AUTHENTICATION MIDDLEWARE
 * JWT verification, role-based access control
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { User } from '@/types'
import AuthService from '@/services/auth.service'
import Logger from '@/utils/logger'
import { createErrorResponse } from '@/utils/helpers'

/**
 * Extend NextApiRequest to include authenticated user
 */
declare global {
  namespace Express {
    interface Request {
      user?: User
    }
  }
}

/**
 * Extract JWT token from request
 */
function extractToken(req: NextApiRequest): string | null {
  const authHeader = req.headers.authorization || ''
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // Check for token in cookies
  const cookies = req.headers.cookie || ''
  const tokenMatch = cookies.match(/auth_token=([^;]+)/)
  return tokenMatch ? tokenMatch[1] : null
}

/**
 * Middleware: Require authentication
 */
export function requireAuth(handler: any) {
  return async (req: NextApiRequest & { user?: User }, res: NextApiResponse) => {
    try {
      const token = extractToken(req)

      if (!token) {
        Logger.warn('requireAuth: No token provided')
        return res.status(401).json(
          createErrorResponse(new Error('Authentication required'), 401, 'Missing authentication token')
        )
      }

      const result = await AuthService.verifyToken(token)

      if (!result.valid || !result.user) {
        Logger.warn('requireAuth: Invalid token')
        return res.status(401).json(
          createErrorResponse(new Error('Invalid token'), 401, 'Token verification failed')
        )
      }

      // Attach user to request
      req.user = result.user

      Logger.info('requireAuth: Authentication successful', { userId: result.user.id })

      return handler(req, res)
    } catch (error) {
      Logger.error('requireAuth: Authentication error', error)
      return res.status(401).json(
        createErrorResponse(error, 401, 'Authentication failed')
      )
    }
  }
}

/**
 * Middleware: Require specific role(s)
 */
export function requireRole(...roles: string[]) {
  return (handler: any) => {
    return async (req: NextApiRequest & { user?: User }, res: NextApiResponse) => {
      if (!req.user) {
        Logger.warn('requireRole: No user attached to request')
        return res.status(401).json(
          createErrorResponse(new Error('Authentication required'), 401)
        )
      }

      if (!roles.includes(req.user.role)) {
        Logger.warn('requireRole: Insufficient permissions', {
          userRole: req.user.role,
          requiredRoles: roles,
        })
        return res.status(403).json(
          createErrorResponse(
            new Error('Insufficient permissions'),
            403,
            `This action requires one of these roles: ${roles.join(', ')}`
          )
        )
      }

      Logger.info('requireRole: Authorization successful', {
        userId: req.user.id,
        role: req.user.role,
      })

      return handler(req, res)
    }
  }
}

/**
 * Middleware: Optional authentication (attach user if token present, but don't require it)
 */
export function optionalAuth(handler: any) {
  return async (req: NextApiRequest & { user?: User }, res: NextApiResponse) => {
    try {
      const token = extractToken(req)

      if (token) {
        const result = await AuthService.verifyToken(token)
        if (result.valid && result.user) {
          req.user = result.user
          Logger.debug('optionalAuth: User authenticated', { userId: result.user.id })
        }
      }

      return handler(req, res)
    } catch (error) {
      Logger.debug('optionalAuth: Error during optional auth, continuing without user', { error })
      return handler(req, res)
    }
  }
}

/**
 * Helper: Compose auth middleware
 */
export function withAuth(roles?: string | string[]) {
  if (!roles) {
    return requireAuth
  }

  const roleArray = Array.isArray(roles) ? roles : [roles]
  return (handler: any) => {
    return requireAuth(requireRole(...roleArray)(handler))
  }
}

export default {
  extractToken,
  requireAuth,
  requireRole,
  optionalAuth,
  withAuth,
}
