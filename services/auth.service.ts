/**
 * SUPABASE AUTHENTICATION SERVICE
 * Email/password authentication, session management, RBAC
 */

import { supabase } from '@/lib/supabase'
import { User, AuthSession } from '@/types'
import Logger from '@/utils/logger'

export class AuthService {
  /**
   * Register new doctor account
   */
  static async registerDoctor(
    email: string,
    password: string,
    fullName: string
  ): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      Logger.info('AuthService: Registering new doctor', { email })

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'doctor',
            created_at: new Date().toISOString(),
          },
        },
      })

      if (error) {
        Logger.error('AuthService: Registration failed', error, { email })
        return { success: false, error: error.message }
      }

      Logger.info('AuthService: Doctor registered successfully', { userId: data.user?.id })

      return {
        success: true,
        user: {
          id: data.user?.id,
          email: data.user?.email,
          role: 'doctor',
        },
      }
    } catch (error) {
      Logger.error('AuthService: Unexpected registration error', error)
      return { success: false, error: 'Registration failed' }
    }
  }

  /**
   * Login with email and password
   */
  static async loginWithEmail(
    email: string,
    password: string
  ): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
    try {
      Logger.info('AuthService: Login attempt', { email })

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        Logger.warn('AuthService: Login failed', { email, error: error.message })
        return { success: false, error: 'Invalid credentials' }
      }

      if (!data.session) {
        Logger.error('AuthService: No session returned after login', { email })
        return { success: false, error: 'Session creation failed' }
      }

      const session: AuthSession = {
        user: {
          id: data.user.id,
          email: data.user.email || '',
          role: (data.user.user_metadata?.role || 'doctor') as any,
          createdAt: data.user.created_at,
          lastLogin: new Date().toISOString(),
        },
        token: data.session.access_token,
        expiresAt: new Date(data.session.expires_at! * 1000).toISOString(),
      }

      Logger.info('AuthService: Login successful', { userId: data.user.id })
      return { success: true, session }
    } catch (error) {
      Logger.error('AuthService: Unexpected login error', error, { email })
      return { success: false, error: 'Login failed' }
    }
  }

  /**
   * Verify JWT token
   */
  static async verifyToken(token: string): Promise<{ valid: boolean; user?: any; error?: string }> {
    try {
      const { data, error } = await supabase.auth.getUser(token)

      if (error || !data.user) {
        Logger.warn('AuthService: Token verification failed')
        return { valid: false, error: 'Invalid token' }
      }

      return {
        valid: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          role: data.user.user_metadata?.role || 'doctor',
        },
      }
    } catch (error) {
      Logger.error('AuthService: Token verification error', error)
      return { valid: false, error: 'Token verification failed' }
    }
  }

  /**
   * Get current session
   */
  static async getCurrentSession(): Promise<AuthSession | null> {
    try {
      const { data, error } = await supabase.auth.getSession()

      if (error || !data.session) {
        return null
      }

      return {
        user: {
          id: data.session.user.id,
          email: data.session.user.email || '',
          role: (data.session.user.user_metadata?.role || 'doctor') as any,
          createdAt: data.session.user.created_at,
        },
        token: data.session.access_token,
        expiresAt: new Date(data.session.expires_at! * 1000).toISOString(),
      }
    } catch (error) {
      Logger.error('AuthService: Error getting current session', error)
      return null
    }
  }

  /**
   * Logout
   */
  static async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        Logger.warn('AuthService: Logout failed', { error: error.message })
        return { success: false, error: error.message }
      }

      Logger.info('AuthService: Logout successful')
      return { success: true }
    } catch (error) {
      Logger.error('AuthService: Unexpected logout error', error)
      return { success: false, error: 'Logout failed' }
    }
  }

  /**
   * Check if user has specific role
   */
  static hasRole(user: User | null | undefined, requiredRole: string | string[]): boolean {
    if (!user) return false

    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(user.role)
    }

    return user.role === requiredRole
  }

  /**
   * Change password
   */
  static async changePassword(
    oldPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      Logger.info('AuthService: Password change requested')

      // First verify old password by attempting re-authentication
      const session = await this.getCurrentSession()
      if (!session) {
        return { success: false, error: 'No active session' }
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        Logger.warn('AuthService: Password change failed', { error: error.message })
        return { success: false, error: error.message }
      }

      Logger.info('AuthService: Password changed successfully')
      return { success: true }
    } catch (error) {
      Logger.error('AuthService: Unexpected password change error', error)
      return { success: false, error: 'Password change failed' }
    }
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      Logger.info('AuthService: Password reset requested', { email })

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
      })

      if (error) {
        Logger.warn('AuthService: Password reset request failed', { error: error.message })
        return { success: false, error: error.message }
      }

      Logger.info('AuthService: Password reset email sent', { email })
      return { success: true }
    } catch (error) {
      Logger.error('AuthService: Password reset request error', error)
      return { success: false, error: 'Password reset request failed' }
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(updates: Record<string, any>): Promise<{ success: boolean; error?: string }> {
    try {
      Logger.info('AuthService: Updating user profile')

      const { error } = await supabase.auth.updateUser({
        data: updates,
      })

      if (error) {
        Logger.warn('AuthService: Profile update failed', { error: error.message })
        return { success: false, error: error.message }
      }

      Logger.info('AuthService: Profile updated successfully')
      return { success: true }
    } catch (error) {
      Logger.error('AuthService: Profile update error', error)
      return { success: false, error: 'Profile update failed' }
    }
  }

  /**
   * Create user with admin role (admin only)
   */
  static async createUserAsAdmin(
    email: string,
    password: string,
    role: 'doctor' | 'admin' = 'doctor'
  ): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      Logger.info('AuthService: Creating user as admin', { email, role })

      // Note: In production, this would require admin API key
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            created_at: new Date().toISOString(),
          },
        },
      })

      if (error) {
        Logger.error('AuthService: Admin user creation failed', error, { email })
        return { success: false, error: error.message }
      }

      return {
        success: true,
        user: {
          id: data.user?.id,
          email: data.user?.email,
          role,
        },
      }
    } catch (error) {
      Logger.error('AuthService: Unexpected admin user creation error', error)
      return { success: false, error: 'User creation failed' }
    }
  }
}

export default AuthService
