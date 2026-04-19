/**
 * DOCTOR REPOSITORY (PHASE 4 - DATABASE LAYER)
 * Handles storage and retrieval of clinician (doctor) information and access control
 */

import { supabase } from '@/lib/supabase'
import Logger from '@/utils/logger'

export type DoctorRole = 'admin' | 'senior_clinician' | 'clinician' | 'resident'
export type DoctorSpecialty = 'neurology' | 'geriatrics' | 'psychiatry' | 'general_practice' | 'other'

export interface Doctor {
  id: string
  userId: string
  firstName: string
  lastName: string
  email: string
  licenseNumber: string
  specialty: DoctorSpecialty
  role: DoctorRole
  hospitalAffiliation?: string
  qualifications?: string[]
  isActive: boolean
  isVerified: boolean
  lastLoginAt?: string
  patientIds?: string[] // List of patient IDs this doctor has access to
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface DoctorFilter {
  role?: DoctorRole
  specialty?: DoctorSpecialty
  isActive?: boolean
  isVerified?: boolean
  search?: string // Search by name or email
}

export interface DoctorAccessLog {
  id: string
  doctorId: string
  patientId: string
  action: 'view' | 'create_assessment' | 'view_result' | 'export_report'
  timestamp: string
}

export class DoctorRepository {
  private static readonly TABLE = 'doctors'
  private static readonly ACCESS_LOG_TABLE = 'doctor_access_logs'
  private static readonly MAX_RETRIES = 3

  /**
   * Create new doctor profile
   */
  static async create(
    userId: string,
    data: Omit<Doctor, 'id' | 'createdAt' | 'updatedAt' | 'userId'>,
    retries = 0
  ): Promise<Doctor> {
    try {
      Logger.info('DoctorRepository: Creating doctor profile', { email: data.email })

      const now = new Date().toISOString()

      const { data: doctor, error } = await supabase
        .from(this.TABLE)
        .insert([
          {
            user_id: userId,
            first_name: data.firstName,
            last_name: data.lastName,
            email: data.email,
            license_number: data.licenseNumber,
            specialty: data.specialty,
            role: data.role,
            hospital_affiliation: data.hospitalAffiliation,
            qualifications: data.qualifications,
            is_active: data.isActive,
            is_verified: data.isVerified,
            patient_ids: data.patientIds || [],
            metadata: data.metadata,
            created_at: now,
            updated_at: now,
          },
        ])
        .select()
        .single()

      if (error) throw error

      Logger.info('DoctorRepository: Doctor profile created', { id: doctor.id })
      return this.mapFromDb(doctor)
    } catch (error) {
      if (retries < this.MAX_RETRIES) {
        Logger.warn('DoctorRepository: Retrying create doctor', { attempt: retries + 1 })
        return this.create(userId, data, retries + 1)
      }
      Logger.error('DoctorRepository: Failed to create doctor profile', { error })
      throw error
    }
  }

  /**
   * Get doctor by ID
   */
  static async findById(id: string): Promise<Doctor | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE)
        .select('*')
        .eq('id', id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      if (!data) return null

      Logger.info('DoctorRepository: Doctor found', { id })
      return this.mapFromDb(data)
    } catch (error) {
      Logger.error('DoctorRepository: Failed to find doctor', { error, id })
      throw error
    }
  }

  /**
   * Get doctor by user ID (auth user)
   */
  static async findByUserId(userId: string): Promise<Doctor | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE)
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      if (!data) return null

      return this.mapFromDb(data)
    } catch (error) {
      Logger.error('DoctorRepository: Failed to find doctor by user ID', { error, userId })
      throw error
    }
  }

  /**
   * Get doctor by email
   */
  static async findByEmail(email: string): Promise<Doctor | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE)
        .select('*')
        .eq('email', email)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      if (!data) return null

      return this.mapFromDb(data)
    } catch (error) {
      Logger.error('DoctorRepository: Failed to find doctor by email', { error, email })
      throw error
    }
  }

  /**
   * Find doctors with filter
   */
  static async findByFilter(
    filter: DoctorFilter,
    options?: {
      limit?: number
      offset?: number
    }
  ): Promise<Doctor[]> {
    try {
      Logger.info('DoctorRepository: Finding doctors with filter', { filter })

      let query = supabase.from(this.TABLE).select('*')

      if (filter.role) {
        query = query.eq('role', filter.role)
      }

      if (filter.specialty) {
        query = query.eq('specialty', filter.specialty)
      }

      if (filter.isActive !== undefined) {
        query = query.eq('is_active', filter.isActive)
      }

      if (filter.isVerified !== undefined) {
        query = query.eq('is_verified', filter.isVerified)
      }

      if (filter.search) {
        query = query.or(
          `first_name.ilike.%${filter.search}%,` +
          `last_name.ilike.%${filter.search}%,` +
          `email.ilike.%${filter.search}%`
        )
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      Logger.info('DoctorRepository: Doctors retrieved', { count: data.length })
      return data.map((d) => this.mapFromDb(d))
    } catch (error) {
      Logger.error('DoctorRepository: Failed to filter doctors', { error, filter })
      throw error
    }
  }

  /**
   * Update doctor profile
   */
  static async update(id: string, data: Partial<Omit<Doctor, 'id' | 'createdAt' | 'updatedAt' | 'userId'>>): Promise<Doctor> {
    try {
      Logger.info('DoctorRepository: Updating doctor profile', { id })

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      }

      if (data.firstName) updateData.first_name = data.firstName
      if (data.lastName) updateData.last_name = data.lastName
      if (data.email) updateData.email = data.email
      if (data.licenseNumber) updateData.license_number = data.licenseNumber
      if (data.specialty) updateData.specialty = data.specialty
      if (data.role) updateData.role = data.role
      if (data.hospitalAffiliation) updateData.hospital_affiliation = data.hospitalAffiliation
      if (data.qualifications) updateData.qualifications = data.qualifications
      if (data.isActive !== undefined) updateData.is_active = data.isActive
      if (data.isVerified !== undefined) updateData.is_verified = data.isVerified
      if (data.lastLoginAt) updateData.last_login_at = data.lastLoginAt
      if (data.patientIds) updateData.patient_ids = data.patientIds
      if (data.metadata) updateData.metadata = data.metadata

      const { data: doctor, error } = await supabase
        .from(this.TABLE)
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      Logger.info('DoctorRepository: Doctor profile updated', { id })
      return this.mapFromDb(doctor)
    } catch (error) {
      Logger.error('DoctorRepository: Failed to update doctor', { error, id })
      throw error
    }
  }

  /**
   * Grant patient access to doctor
   */
  static async grantPatientAccess(doctorId: string, patientId: string): Promise<Doctor> {
    try {
      Logger.info('DoctorRepository: Granting patient access', { doctorId, patientId })

      const doctor = await this.findById(doctorId)
      if (!doctor) throw new Error('Doctor not found')

      const patientIds = doctor.patientIds || []
      if (!patientIds.includes(patientId)) {
        patientIds.push(patientId)
      }

      return this.update(doctorId, { patientIds })
    } catch (error) {
      Logger.error('DoctorRepository: Failed to grant patient access', {
        error,
        doctorId,
        patientId,
      })
      throw error
    }
  }

  /**
   * Revoke patient access from doctor
   */
  static async revokePatientAccess(doctorId: string, patientId: string): Promise<Doctor> {
    try {
      Logger.info('DoctorRepository: Revoking patient access', { doctorId, patientId })

      const doctor = await this.findById(doctorId)
      if (!doctor) throw new Error('Doctor not found')

      const patientIds = doctor.patientIds || []
      const filtered = patientIds.filter((id) => id !== patientId)

      return this.update(doctorId, { patientIds: filtered })
    } catch (error) {
      Logger.error('DoctorRepository: Failed to revoke patient access', {
        error,
        doctorId,
        patientId,
      })
      throw error
    }
  }

  /**
   * Check if doctor has access to patient
   */
  static async hasPatientAccess(doctorId: string, patientId: string): Promise<boolean> {
    try {
      const doctor = await this.findById(doctorId)
      if (!doctor) return false

      return (doctor.patientIds || []).includes(patientId)
    } catch (error) {
      Logger.error('DoctorRepository: Failed to check patient access', {
        error,
        doctorId,
        patientId,
      })
      return false
    }
  }

  /**
   * Log doctor access action
   */
  static async logAccess(
    doctorId: string,
    patientId: string,
    action: DoctorAccessLog['action']
  ): Promise<void> {
    try {
      Logger.debug('DoctorRepository: Logging access action', {
        doctorId,
        patientId,
        action,
      })

      await supabase.from(this.ACCESS_LOG_TABLE).insert([
        {
          doctor_id: doctorId,
          patient_id: patientId,
          action,
          timestamp: new Date().toISOString(),
        },
      ])
    } catch (error) {
      Logger.warn('DoctorRepository: Failed to log access', { error })
      // Don't throw - logging failures shouldn't break main flow
    }
  }

  /**
   * Get access logs for audit trail
   */
  static async getAccessLogs(
    doctorId: string,
    options?: {
      limit?: number
      dateRange?: {
        from: string
        to: string
      }
    }
  ): Promise<DoctorAccessLog[]> {
    try {
      Logger.info('DoctorRepository: Getting access logs', { doctorId })

      let query = supabase
        .from(this.ACCESS_LOG_TABLE)
        .select('*')
        .eq('doctor_id', doctorId)

      if (options?.dateRange) {
        query = query
          .gte('timestamp', options.dateRange.from)
          .lt('timestamp', options.dateRange.to)
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query.order('timestamp', { ascending: false })

      if (error) throw error

      return data.map((log: any) => ({
        id: log.id,
        doctorId: log.doctor_id,
        patientId: log.patient_id,
        action: log.action,
        timestamp: log.timestamp,
      }))
    } catch (error) {
      Logger.error('DoctorRepository: Failed to get access logs', { error, doctorId })
      throw error
    }
  }

  /**
   * Deactivate doctor account
   */
  static async deactivate(id: string): Promise<Doctor> {
    try {
      Logger.info('DoctorRepository: Deactivating doctor account', { id })

      return this.update(id, { isActive: false })
    } catch (error) {
      Logger.error('DoctorRepository: Failed to deactivate doctor', { error, id })
      throw error
    }
  }

  /**
   * Map database record to domain model
   */
  private static mapFromDb(dbRecord: any): Doctor {
    return {
      id: dbRecord.id,
      userId: dbRecord.user_id,
      firstName: dbRecord.first_name,
      lastName: dbRecord.last_name,
      email: dbRecord.email,
      licenseNumber: dbRecord.license_number,
      specialty: dbRecord.specialty,
      role: dbRecord.role,
      hospitalAffiliation: dbRecord.hospital_affiliation,
      qualifications: dbRecord.qualifications,
      isActive: dbRecord.is_active,
      isVerified: dbRecord.is_verified,
      lastLoginAt: dbRecord.last_login_at,
      patientIds: dbRecord.patient_ids,
      metadata: dbRecord.metadata,
      createdAt: dbRecord.created_at,
      updatedAt: dbRecord.updated_at,
    }
  }
}

export default DoctorRepository
