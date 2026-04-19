/**
 * HEALTH CHECK ENDPOINT
 * Demonstrates security middleware stack application
 * Shows proper error handling and logging
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { ApiResponse } from '@/types'
import Logger from '@/utils/logger'
import { createSuccessResponse, createErrorResponse } from '@/utils/helpers'
import {
  compose,
  requireMethod,
  withErrorHandler,
  withSecurityHeaders,
  withRequestId,
  rateLimit,
  withCORS,
} from '@/middleware/api.middleware'
import Config from '@/utils/config'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: number
  environment: string
  version: string
  checks: {
    supabase: boolean
    ai: boolean
    logging: boolean
  }
}

/**
 * Health check handler
 */
async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse<HealthStatus>>) {
  Logger.generateRequestId()

  try {
    Logger.info('Health: Checking system health')

    // Check various systems
    const checks = {
      supabase: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
      ai: !!(process.env.ANTHROPIC_API_KEY || process.env.GROQ_API_KEY),
      logging: true, // Logging is always available
    }

    const allHealthy = Object.values(checks).every((check) => check === true)
    const status: 'healthy' | 'degraded' | 'unhealthy' = allHealthy
      ? 'healthy'
      : Object.values(checks).some((check) => check === true)
        ? 'degraded'
        : 'unhealthy'

    const healthStatus: HealthStatus = {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'unknown',
      version: process.env.npm_package_version || '1.0.0',
      checks,
    }

    Logger.info('Health: Health check complete', { status })

    return res.status(200).json(
      createSuccessResponse(healthStatus, 'System health check complete')
    )
  } catch (error) {
    Logger.error('Health: Exception during health check', error)

    return res.status(503).json(
      createErrorResponse(
        new Error('Health check failed'),
        503,
        'Unable to determine system health'
      )
    )
  }
}

// Apply security middleware stack
export default compose(
  withRequestId,
  withSecurityHeaders,
  withCORS(['http://localhost:3000', 'http://localhost:3001']),
  rateLimit(50, 60000), // Generous rate limit for health checks (50/min)
  requireMethod('GET', 'HEAD'),
  withErrorHandler
)(handler)
