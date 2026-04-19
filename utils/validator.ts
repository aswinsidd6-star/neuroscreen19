/**
 * INPUT VALIDATION UTILITIES
 * Validates API inputs, form data, and business logic constraints
 */

import { ValidationResult, ValidationError, AssessmentAnswers } from '@/types'
import Logger from './logger'

export class Validator {
  /**
   * Validate assessment answers
   */
  static validateAssessmentAnswers(answers: any): ValidationResult {
    const errors: ValidationError[] = []

    if (!answers || typeof answers !== 'object') {
      errors.push({
        field: 'answers',
        message: 'Answers must be a valid object',
        code: 'INVALID_TYPE',
      })
      return { valid: false, errors }
    }

    // Name validation
    if (answers.name) {
      const nameError = Validator.validateString(answers.name, 'name', 2, 100)
      if (nameError) errors.push(nameError)
    }

    // Age validation
    if (answers.age !== undefined && answers.age !== null) {
      const ageError = Validator.validateAge(answers.age, 'age')
      if (ageError) errors.push(ageError)
    }

    // Gender validation
    if (answers.gender && !['M', 'F', 'Other', 'Male', 'Female'].includes(answers.gender)) {
      errors.push({
        field: 'gender',
        message: 'Gender must be M, F, or Other',
        code: 'INVALID_VALUE',
      })
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Validate string field
   */
  static validateString(
    value: any,
    field: string,
    minLength: number = 1,
    maxLength: number = 1000
  ): ValidationError | null {
    if (typeof value !== 'string') {
      return {
        field,
        message: `${field} must be a string`,
        code: 'INVALID_TYPE',
      }
    }

    const trimmed = value.trim()

    if (trimmed.length < minLength) {
      return {
        field,
        message: `${field} must be at least ${minLength} characters`,
        code: 'TOO_SHORT',
      }
    }

    if (trimmed.length > maxLength) {
      return {
        field,
        message: `${field} must be at most ${maxLength} characters`,
        code: 'TOO_LONG',
      }
    }

    return null
  }

  /**
   * Validate age
   */
  static validateAge(value: any, field: string = 'age'): ValidationError | null {
    if (typeof value !== 'number' && typeof value !== 'string') {
      return {
        field,
        message: 'Age must be a number',
        code: 'INVALID_TYPE',
      }
    }

    const age = typeof value === 'string' ? parseInt(value, 10) : value

    if (isNaN(age) || age < 0 || age > 150) {
      return {
        field,
        message: 'Age must be between 0 and 150',
        code: 'OUT_OF_RANGE',
      }
    }

    return null
  }

  /**
   * Validate score (0-100 or custom range)
   */
  static validateScore(value: any, field: string = 'score', max: number = 100): ValidationError | null {
    if (typeof value !== 'number') {
      return {
        field,
        message: 'Score must be a number',
        code: 'INVALID_TYPE',
      }
    }

    if (value < 0 || value > max) {
      return {
        field,
        message: `Score must be between 0 and ${max}`,
        code: 'OUT_OF_RANGE',
      }
    }

    return null
  }

  /**
   * Validate email
   */
  static validateEmail(value: any, field: string = 'email'): ValidationError | null {
    if (typeof value !== 'string') {
      return {
        field,
        message: 'Email must be a string',
        code: 'INVALID_TYPE',
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return {
        field,
        message: 'Invalid email format',
        code: 'INVALID_FORMAT',
      }
    }

    return null
  }

  /**
   * Validate password strength
   */
  static validatePassword(value: any, field: string = 'password'): ValidationError | null {
    if (typeof value !== 'string') {
      return {
        field,
        message: 'Password must be a string',
        code: 'INVALID_TYPE',
      }
    }

    if (value.length < 8) {
      return {
        field,
        message: 'Password must be at least 8 characters',
        code: 'TOO_SHORT',
      }
    }

    if (!/[A-Z]/.test(value) || !/[0-9]/.test(value)) {
      return {
        field,
        message: 'Password must contain uppercase letters and numbers',
        code: 'WEAK_PASSWORD',
      }
    }

    return null
  }

  /**
   * Validate UUID format
   */
  static validateUUID(value: any, field: string = 'id'): ValidationError | null {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    
    if (!uuidRegex.test(String(value))) {
      return {
        field,
        message: 'Invalid UUID format',
        code: 'INVALID_FORMAT',
      }
    }

    return null
  }

  /**
   * Check for required fields
   */
  static validateRequired(obj: Record<string, any>, fields: string[]): ValidationError[] {
    const errors: ValidationError[] = []

    for (const field of fields) {
      if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
        errors.push({
          field,
          message: `${field} is required`,
          code: 'REQUIRED_FIELD',
        })
      }
    }

    return errors
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(value: string): string {
    return value
      .trim()
      .replace(/[<>]/g, '') // Remove HTML-like chars
      .substring(0, 10000) // Limit length
  }

  /**
   * Sanitize object for logging (remove sensitive fields)
   */
  static sanitizeForLogging(obj: Record<string, any>): Record<string, any> {
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'credential']
    const sanitized = { ...obj }

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]'
      }
    }

    return sanitized
  }
}

export default Validator
