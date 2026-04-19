/**
 * RESULT REPOSITORY (PHASE 4 - DATABASE LAYER)
 * Handles storage and retrieval of assessment results and cognitive scores
 */

import { supabase } from '@/lib/supabase'
import { ClinicalReport } from '@/types'
import Logger from '@/utils/logger'

export interface AssessmentResult {
  id: string
  patientId: string
  assessmentType: string
  totalScore: number
  adjustedScore?: number
  domainScores: Record<string, number>
  aiAnalysis?: string
  alzheimerRiskIndex?: number
  patternAnalysis?: Record<string, unknown>
  clinicalReport?: ClinicalReport
  notes?: string
  assessedAt: string
  createdAt: string
  updatedAt: string
}

export interface ResultFilter {
  patientId?: string
  assessmentType?: string
  dateRange?: {
    from: string
    to: string
  }
  scoreRange?: {
    min: number
    max: number
  }
  riskLevel?: string
}

export class ResultRepository {
  private static readonly TABLE = 'assessment_results'
  private static readonly MAX_RETRIES = 3

  /**
   * Create assessment result
   */
  static async create(
    patientId: string,
    data: Omit<AssessmentResult, 'id' | 'createdAt' | 'updatedAt'>,
    retries = 0
  ): Promise<AssessmentResult> {
    try {
      Logger.info('ResultRepository: Creating assessment result', { patientId })

      const now = new Date().toISOString()

      const { data: result, error } = await supabase
        .from(this.TABLE)
        .insert([
          {
            patient_id: patientId,
            assessment_type: data.assessmentType,
            total_score: data.totalScore,
            adjusted_score: data.adjustedScore || data.totalScore,
            domain_scores: data.domainScores,
            ai_analysis: data.aiAnalysis,
            alzheimer_risk_index: data.alzheimerRiskIndex,
            pattern_analysis: data.patternAnalysis,
            clinical_report: data.clinicalReport,
            notes: data.notes,
            assessed_at: data.assessedAt || now,
            created_at: now,
            updated_at: now,
          },
        ])
        .select()
        .single()

      if (error) throw error

      Logger.info('ResultRepository: Result created successfully', { id: result.id })
      return this.mapFromDb(result)
    } catch (error) {
      if (retries < this.MAX_RETRIES) {
        Logger.warn('ResultRepository: Retrying create', { attempt: retries + 1 })
        return this.create(patientId, data, retries + 1)
      }
      Logger.error('ResultRepository: Failed to create result', { error, patientId })
      throw error
    }
  }

  /**
   * Get result by ID
   */
  static async findById(id: string): Promise<AssessmentResult | null> {
    try {
      Logger.info('ResultRepository: Finding result by ID', { id })

      const { data, error } = await supabase
        .from(this.TABLE)
        .select('*')
        .eq('id', id)
        .single()

      if (error && error.code !== 'PGRST116') throw error // 'no rows' is expected
      if (!data) return null

      Logger.info('ResultRepository: Result found', { id })
      return this.mapFromDb(data)
    } catch (error) {
      Logger.error('ResultRepository: Failed to find result', { error, id })
      throw error
    }
  }

  /**
   * Get all results for patient
   */
  static async findByPatientId(
    patientId: string,
    options?: {
      limit?: number
      offset?: number
      orderBy?: 'newest' | 'oldest' | 'highest_score' | 'lowest_score'
    }
  ): Promise<AssessmentResult[]> {
    try {
      Logger.info('ResultRepository: Finding results by patient', { patientId })

      let query = supabase.from(this.TABLE).select('*').eq('patient_id', patientId)

      // Apply ordering
      if (options?.orderBy === 'newest') {
        query = query.order('assessed_at', { ascending: false })
      } else if (options?.orderBy === 'oldest') {
        query = query.order('assessed_at', { ascending: true })
      } else if (options?.orderBy === 'highest_score') {
        query = query.order('total_score', { ascending: false })
      } else if (options?.orderBy === 'lowest_score') {
        query = query.order('total_score', { ascending: true })
      }

      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit)
      }
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
      }

      const { data, error } = await query

      if (error) throw error

      Logger.info('ResultRepository: Results retrieved', { count: data.length, patientId })
      return data.map((r) => this.mapFromDb(r))
    } catch (error) {
      Logger.error('ResultRepository: Failed to find patient results', { error, patientId })
      throw error
    }
  }

  /**
   * Find results with advanced filtering
   */
  static async findByFilter(filter: ResultFilter): Promise<AssessmentResult[]> {
    try {
      Logger.info('ResultRepository: Finding results with filter', { filter })

      let query = supabase.from(this.TABLE).select('*')

      if (filter.patientId) {
        query = query.eq('patient_id', filter.patientId)
      }

      if (filter.assessmentType) {
        query = query.eq('assessment_type', filter.assessmentType)
      }

      if (filter.scoreRange) {
        query = query
          .gte('total_score', filter.scoreRange.min)
          .lte('total_score', filter.scoreRange.max)
      }

      if (filter.dateRange) {
        query = query
          .gte('assessed_at', filter.dateRange.from)
          .lt('assessed_at', filter.dateRange.to)
      }

      if (filter.riskLevel) {
        // Assuming pattern_analysis contains risk_level
        query = query.filter(
          'pattern_analysis->risk_level',
          'eq',
          filter.riskLevel
        )
      }

      const { data, error } = await query.order('assessed_at', { ascending: false })

      if (error) throw error

      Logger.info('ResultRepository: Filtered results retrieved', {
        count: data.length,
        filter,
      })
      return data.map((r) => this.mapFromDb(r))
    } catch (error) {
      Logger.error('ResultRepository: Failed to filter results', { error, filter })
      throw error
    }
  }

  /**
   * Update result
   */
  static async update(
    id: string,
    data: Partial<Omit<AssessmentResult, 'id' | 'createdAt' | 'updatedAt' | 'patientId'>>
  ): Promise<AssessmentResult> {
    try {
      Logger.info('ResultRepository: Updating result', { id })

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      }

      if (data.totalScore !== undefined) updateData.total_score = data.totalScore
      if (data.adjustedScore !== undefined) updateData.adjusted_score = data.adjustedScore
      if (data.domainScores) updateData.domain_scores = data.domainScores
      if (data.aiAnalysis) updateData.ai_analysis = data.aiAnalysis
      if (data.alzheimerRiskIndex !== undefined)
        updateData.alzheimer_risk_index = data.alzheimerRiskIndex
      if (data.patternAnalysis) updateData.pattern_analysis = data.patternAnalysis
      if (data.clinicalReport) updateData.clinical_report = data.clinicalReport
      if (data.notes) updateData.notes = data.notes

      const { data: result, error } = await supabase
        .from(this.TABLE)
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      Logger.info('ResultRepository: Result updated successfully', { id })
      return this.mapFromDb(result)
    } catch (error) {
      Logger.error('ResultRepository: Failed to update result', { error, id })
      throw error
    }
  }

  /**
   * Delete result
   */
  static async delete(id: string): Promise<boolean> {
    try {
      Logger.info('ResultRepository: Deleting result', { id })

      const { error } = await supabase.from(this.TABLE).delete().eq('id', id)

      if (error) throw error

      Logger.info('ResultRepository: Result deleted successfully', { id })
      return true
    } catch (error) {
      Logger.error('ResultRepository: Failed to delete result', { error, id })
      throw error
    }
  }

  /**
   * Get result statistics for a patient
   */
  static async getPatientStatistics(patientId: string): Promise<{
    totalAssessments: number
    averageScore: number
    highestScore: number
    lowestScore: number
    lastAssessmentDate: string | null
    trend: 'improving' | 'declining' | 'stable' | 'insufficient_data'
  }> {
    try {
      Logger.info('ResultRepository: Calculating patient statistics', { patientId })

      const { data, error } = await supabase
        .from(this.TABLE)
        .select('total_score, assessed_at')
        .eq('patient_id', patientId)
        .order('assessed_at', { ascending: true })

      if (error) throw error

      if (!data || data.length === 0) {
        return {
          totalAssessments: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          lastAssessmentDate: null,
          trend: 'insufficient_data',
        }
      }

      const scores = data.map((r) => r.total_score)
      const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length
      const highestScore = Math.max(...scores)
      const lowestScore = Math.min(...scores)

      // Determine trend (last 3 assessments)
      let trend: 'improving' | 'declining' | 'stable' | 'insufficient_data' =
        'insufficient_data'
      if (scores.length >= 3) {
        const recent = scores.slice(-3)
        const firstAvg = recent.slice(0, 2).reduce((a, b) => a + b, 0) / 2
        const lastScore = recent[2]
        if (lastScore > firstAvg + 2) trend = 'improving'
        else if (lastScore < firstAvg - 2) trend = 'declining'
        else trend = 'stable'
      }

      const stats = {
        totalAssessments: data.length,
        averageScore: Math.round(averageScore * 100) / 100,
        highestScore,
        lowestScore,
        lastAssessmentDate: data[data.length - 1].assessed_at,
        trend,
      }

      Logger.info('ResultRepository: Statistics calculated', { patientId, stats })
      return stats
    } catch (error) {
      Logger.error('ResultRepository: Failed to calculate statistics', { error, patientId })
      throw error
    }
  }

  /**
   * Map database record to domain model
   */
  private static mapFromDb(dbRecord: any): AssessmentResult {
    return {
      id: dbRecord.id,
      patientId: dbRecord.patient_id,
      assessmentType: dbRecord.assessment_type,
      totalScore: dbRecord.total_score,
      adjustedScore: dbRecord.adjusted_score,
      domainScores: dbRecord.domain_scores,
      aiAnalysis: dbRecord.ai_analysis,
      alzheimerRiskIndex: dbRecord.alzheimer_risk_index,
      patternAnalysis: dbRecord.pattern_analysis,
      clinicalReport: dbRecord.clinical_report,
      notes: dbRecord.notes,
      assessedAt: dbRecord.assessed_at,
      createdAt: dbRecord.created_at,
      updatedAt: dbRecord.updated_at,
    }
  }
}

export default ResultRepository
