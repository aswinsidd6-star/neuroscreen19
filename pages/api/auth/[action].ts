/**
 * AUTHENTICATION API ENDPOINT
 * Login, registration, logout, and session management
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { ApiResponse } from '@/types'
import AuthService from '@/services/auth.service'
import Logger from '@/utils/logger'
import Validator from '@/utils/validator'
import { compose, requireMethod, requireBody, withErrorHandler, withSecurityHeaders } from '@/middleware/api.middleware'
import { createSuccessResponse, createErrorResponse } from '@/utils/helpers'

/**
 * POST /api/auth/login - Login with email and password
 */
async function handleLogin(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  const { email, password } = req.body

  // Validate inputs
  const emailError = Validator.validateEmail(email)
  if (emailError) {
    return res.status(400).json(
      createErrorResponse(new Error(emailError.message), 400)
    )
  }

  const passwordError = Validator.validateString(password, 'password', 1, 256)
  if (passwordError) {
    return res.status(400).json(
      createErrorResponse(new Error('Password is required'), 400)
    )
  }

  const result = await AuthService.loginWithEmail(email, password)

  if (!result.success) {
    return res.status(401).json(
      createErrorResponse(new Error(result.error || 'Login failed'), 401)
    )
  }

  // Set secure httpOnly cookie
  const cookieValue = `${result.session!.token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=3600`
  res.setHeader('Set-Cookie', `auth_token=${cookieValue}`)

  return res.status(200).json(
    createSuccessResponse(
      {
        user: result.session!.user,
        token: result.session!.token,
        expiresAt: result.session!.expiresAt,
      },
      'Login successful'
    )
  )
}

/**
 * POST /api/auth/register - Register new doctor account
 */
async function handleRegister(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  const { email, password, fullName } = req.body

  // Validate inputs
  const emailError = Validator.validateEmail(email)
  if (emailError) {
    return res.status(400).json(
      createErrorResponse(new Error(emailError.message), 400)
    )
  }

  const passwordError = Validator.validatePassword(password)
  if (passwordError) {
    return res.status(400).json(
      createErrorResponse(new Error(passwordError.message), 400)
    )
  }

  const nameError = Validator.validateString(fullName, 'fullName', 2, 100)
  if (nameError) {
    return res.status(400).json(
      createErrorResponse(new Error(nameError.message), 400)
    )
  }

  const result = await AuthService.registerDoctor(email, password, fullName)

  if (!result.success) {
    return res.status(400).json(
      createErrorResponse(new Error(result.error || 'Registration failed'), 400)
    )
  }

  return res.status(201).json(
    createSuccessResponse(result.user, 'Registration successful', 201)
  )
}

/**
 * POST /api/auth/logout - Logout user
 */
async function handleLogout(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  const result = await AuthService.logout()

  // Clear cookie
  res.setHeader('Set-Cookie', 'auth_token=; Path=/; HttpOnly; Max-Age=0')

  if (!result.success) {
    return res.status(400).json(
      createErrorResponse(new Error(result.error || 'Logout failed'), 400)
    )
  }

  return res.status(200).json(
    createSuccessResponse({ message: 'Logged out successfully' }, 'Logout successful')
  )
}

/**
 * GET /api/auth/session - Get current session
 */
async function handleGetSession(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  const session = await AuthService.getCurrentSession()

  if (!session) {
    return res.status(401).json(
      createErrorResponse(new Error('No active session'), 401)
    )
  }

  return res.status(200).json(
    createSuccessResponse({ user: session.user, expiresAt: session.expiresAt })
  )
}

/**
 * PUT /api/auth/password - Change password
 */
async function handleChangePassword(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  const { oldPassword, newPassword } = req.body

  const oldPassError = Validator.validateString(oldPassword, 'oldPassword', 1, 256)
  if (oldPassError) {
    return res.status(400).json(
      createErrorResponse(new Error('Current password is required'), 400)
    )
  }

  const newPassError = Validator.validatePassword(newPassword)
  if (newPassError) {
    return res.status(400).json(
      createErrorResponse(new Error(newPassError.message), 400)
    )
  }

  const result = await AuthService.changePassword(oldPassword, newPassword)

  if (!result.success) {
    return res.status(400).json(
      createErrorResponse(new Error(result.error || 'Password change failed'), 400)
    )
  }

  return res.status(200).json(
    createSuccessResponse({ message: 'Password changed successfully' }, 'Password changed')
  )
}

/**
 * POST /api/auth/password-reset - Request password reset
 */
async function handlePasswordReset(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  const { email } = req.body

  const emailError = Validator.validateEmail(email)
  if (emailError) {
    return res.status(400).json(
      createErrorResponse(new Error(emailError.message), 400)
    )
  }

  const result = await AuthService.requestPasswordReset(email)

  if (!result.success) {
    return res.status(400).json(
      createErrorResponse(new Error(result.error || 'Password reset request failed'), 400)
    )
  }

  return res.status(200).json(
    createSuccessResponse(
      { message: 'If email exists, password reset link has been sent' },
      'Check your email'
    )
  )
}

/**
 * Main handler router
 */
async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  Logger.generateRequestId()

  const { action } = req.query

  switch (action) {
    case 'login':
      if (req.method === 'POST') return handleLogin(req, res)
      break

    case 'register':
      if (req.method === 'POST') return handleRegister(req, res)
      break

    case 'logout':
      if (req.method === 'POST') return handleLogout(req, res)
      break

    case 'session':
      if (req.method === 'GET') return handleGetSession(req, res)
      break

    case 'password':
      if (req.method === 'PUT') return handleChangePassword(req, res)
      if (req.method === 'POST') return handlePasswordReset(req, res)
      break

    default:
      return res.status(404).json(
        createErrorResponse(new Error('Auth action not found'), 404)
      )
  }

  return res.status(405).json(
    createErrorResponse(new Error('Method not allowed'), 405)
  )
}

export default compose(
  withSecurityHeaders,
  withErrorHandler
)(handler)
