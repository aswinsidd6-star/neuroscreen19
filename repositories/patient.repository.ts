/**
 * PATIENT REPOSITORY
 * Database abstraction layer for patient data management
 */

import { supabase } from '@/lib/supabase'
import { Patient } from '@/types'
import Logger from '@/utils/logger'

export class PatientRepository {
  /**
   * Create patient record
   */
  static async create(patient: Omit<Patient, 'id' | 'createdAt'>): Promise<{ success: boolean; patient?: Patient; error?: string }> {
    try {
      Logger.info('PatientRepository: Creating patient', { name: patient.name, age: patient.age })

      const { data, error } = await supabase
        .from('patients')
        .insert({
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        Logger.error('PatientRepository: Create failed', error)
        return { success: false, error: error.message }
      }

      const createdPatient: Patient = {
        id: data.id,
        name: data.name,
        age: data.age,
        gender: data.gender,
        createdAt: data.created_at,
      }

      Logger.info('PatientRepository: Patient created', { patientId: createdPatient.id })
      return { success: true, patient: createdPatient }
    } catch (error) {
      Logger.error('PatientRepository: Unexpected error during create', error)
      return { success: false, error: 'Patient creation failed' }
    }
  }

  /**
   * Get patient by ID
   */
  static async getById(patientId: string): Promise<Patient | null> {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single()

      if (error) {
        Logger.warn('PatientRepository: Patient not found', { patientId })
        return null
      }

      return {
        id: data.id,
        name: data.name,
        age: data.age,
        gender: data.gender,
        createdAt: data.created_at,
      }
    } catch (error) {
      Logger.error('PatientRepository: Error getting patient', error)
      return null
    }
  }

  /**
   * Get all patients (with pagination)
   */
  static async getAll(limit: number = 50, offset: number = 0): Promise<{ patients: Patient[]; total: number }> {
    try {
      const { data, error, count } = await supabase
        .from('patients')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        Logger.error('PatientRepository: Error getting patients', error)
        return { patients: [], total: 0 }
      }

      const patients = (data || []).map((row) => ({
        id: row.id,
        name: row.name,
        age: row.age,
        gender: row.gender,
        createdAt: row.created_at,
      }))

      Logger.info('PatientRepository: Retrieved patients', { count: patients.length, total: count })
      return { patients, total: count || 0 }
    } catch (error) {
      Logger.error('PatientRepository: Error retrieving patients', error)
      return { patients: [], total: 0 }
    }
  }

  /**
   * Update patient
   */
  static async update(patientId: string, updates: Partial<Patient>): Promise<{ success: boolean; error?: string }> {
    try {
      Logger.info('PatientRepository: Updating patient', { patientId })

      const { error } = await supabase
        .from('patients')
        .update({
          ...(updates.name && { name: updates.name }),
          ...(updates.age && { age: updates.age }),
          ...(updates.gender && { gender: updates.gender }),
        })
        .eq('id', patientId)

      if (error) {
        Logger.error('PatientRepository: Update failed', error)
        return { success: false, error: error.message }
      }

      Logger.info('PatientRepository: Patient updated', { patientId })
      return { success: true }
    } catch (error) {
      Logger.error('PatientRepository: Error updating patient', error)
      return { success: false, error: 'Update failed' }
    }
  }

  /**
   * Search patients by name or age range
   */
  static async search(
    query: string,
    minAge?: number,
    maxAge?: number
  ): Promise<Patient[]> {
    try {
      let queryObj = supabase.from('patients').select('*')

      if (query) {
        queryObj = queryObj.ilike('name', `%${query}%`)
      }

      if (minAge !== undefined) {
        queryObj = queryObj.gte('age', minAge)
      }

      if (maxAge !== undefined) {
        queryObj = queryObj.lte('age', maxAge)
      }

      const { data, error } = await queryObj.limit(50)

      if (error) {
        Logger.warn('PatientRepository: Search failed', { error })
        return []
      }

      return (data || []).map((row) => ({
        id: row.id,
        name: row.name,
        age: row.age,
        gender: row.gender,
        createdAt: row.created_at,
      }))
    } catch (error) {
      Logger.error('PatientRepository: Error searching patients', error)
      return []
    }
  }
}

export default PatientRepository
