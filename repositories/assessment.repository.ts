/**
 * ASSESSMENT REPOSITORY (PHASE 4 - DATABASE LAYER)
 * Handles storage and retrieval of cognitive assessments and test questions
 */

import { supabase } from '@/lib/supabase'
import Logger from '@/utils/logger'

export interface Assessment {
  id: string
  patientId: string
  assessmentType: 'mmse' | 'behavioral' | 'speech' | 'drawing' | 'comprehensive'
  startedAt: string
  completedAt?: string
  status: 'in_progress' | 'completed' | 'abandoned'
  progress: number // 0-100
  answers?: Record<string, unknown>
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface AssessmentQuestion {
  id: string
  assessmentType: string
  questionNumber: number
  category: string
  question: string
  maxScore: number
  instructions?: string
  imageUrl?: string
  audioUrl?: string
  options?: string[]
  scoringLogic?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface AssessmentFilter {
  patientId?: string
  assessmentType?: string
  status?: 'in_progress' | 'completed' | 'abandoned'
  dateRange?: {
    from: string
    to: string
  }
}

export class AssessmentRepository {
  private static readonly ASSESSMENTS_TABLE = 'assessments'
  private static readonly QUESTIONS_TABLE = 'assessment_questions'
  private static readonly MAX_RETRIES = 3

  /**
   * Create new assessment session
   */
  static async createAssessment(
    patientId: string,
    assessmentType: Assessment['assessmentType'],
    retries = 0
  ): Promise<Assessment> {
    try {
      Logger.info('AssessmentRepository: Creating assessment', {
        patientId,
        assessmentType,
      })

      const now = new Date().toISOString()

      const { data: assessment, error } = await supabase
        .from(this.ASSESSMENTS_TABLE)
        .insert([
          {
            patient_id: patientId,
            assessment_type: assessmentType,
            started_at: now,
            status: 'in_progress',
            progress: 0,
            created_at: now,
            updated_at: now,
          },
        ])
        .select()
        .single()

      if (error) throw error

      Logger.info('AssessmentRepository: Assessment created', { id: assessment.id })
      return this.mapAssessmentFromDb(assessment)
    } catch (error) {
      if (retries < this.MAX_RETRIES) {
        Logger.warn('AssessmentRepository: Retrying create assessment', {
          attempt: retries + 1,
        })
        return this.createAssessment(patientId, assessmentType, retries + 1)
      }
      Logger.error('AssessmentRepository: Failed to create assessment', {
        error,
        patientId,
      })
      throw error
    }
  }

  /**
   * Get assessment by ID
   */
  static async findAssessmentById(id: string): Promise<Assessment | null> {
    try {
      Logger.info('AssessmentRepository: Finding assessment by ID', { id })

      const { data, error } = await supabase
        .from(this.ASSESSMENTS_TABLE)
        .select('*')
        .eq('id', id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      if (!data) return null

      Logger.info('AssessmentRepository: Assessment found', { id })
      return this.mapAssessmentFromDb(data)
    } catch (error) {
      Logger.error('AssessmentRepository: Failed to find assessment', { error, id })
      throw error
    }
  }

  /**
   * Get all assessments for a patient
   */
  static async findByPatientId(
    patientId: string,
    options?: {
      limit?: number
      offset?: number
      orderBy?: 'newest' | 'oldest'
    }
  ): Promise<Assessment[]> {
    try {
      Logger.info('AssessmentRepository: Finding assessments for patient', { patientId })

      let query = supabase
        .from(this.ASSESSMENTS_TABLE)
        .select('*')
        .eq('patient_id', patientId)

      if (options?.orderBy === 'newest') {
        query = query.order('started_at', { ascending: false })
      } else {
        query = query.order('started_at', { ascending: true })
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query

      if (error) throw error

      Logger.info('AssessmentRepository: Assessments retrieved', {
        count: data.length,
        patientId,
      })
      return data.map((a) => this.mapAssessmentFromDb(a))
    } catch (error) {
      Logger.error('AssessmentRepository: Failed to find patient assessments', {
        error,
        patientId,
      })
      throw error
    }
  }

  /**
   * Find assessments with filter
   */
  static async findByFilter(filter: AssessmentFilter): Promise<Assessment[]> {
    try {
      Logger.info('AssessmentRepository: Finding assessments with filter', { filter })

      let query = supabase.from(this.ASSESSMENTS_TABLE).select('*')

      if (filter.patientId) {
        query = query.eq('patient_id', filter.patientId)
      }

      if (filter.assessmentType) {
        query = query.eq('assessment_type', filter.assessmentType)
      }

      if (filter.status) {
        query = query.eq('status', filter.status)
      }

      if (filter.dateRange) {
        query = query
          .gte('started_at', filter.dateRange.from)
          .lt('started_at', filter.dateRange.to)
      }

      const { data, error } = await query.order('started_at', { ascending: false })

      if (error) throw error

      Logger.info('AssessmentRepository: Filtered assessments retrieved', {
        count: data.length,
      })
      return data.map((a) => this.mapAssessmentFromDb(a))
    } catch (error) {
      Logger.error('AssessmentRepository: Failed to filter assessments', {
        error,
        filter,
      })
      throw error
    }
  }

  /**
   * Update assessment progress and answers
   */
  static async updateAssessmentProgress(
    id: string,
    progress: number,
    answers?: Record<string, unknown>
  ): Promise<Assessment> {
    try {
      Logger.info('AssessmentRepository: Updating assessment progress', { id, progress })

      const updateData: Record<string, unknown> = {
        progress,
        updated_at: new Date().toISOString(),
      }

      if (answers) {
        updateData.answers = answers
      }

      const { data: assessment, error } = await supabase
        .from(this.ASSESSMENTS_TABLE)
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      Logger.info('AssessmentRepository: Progress updated', { id, progress })
      return this.mapAssessmentFromDb(assessment)
    } catch (error) {
      Logger.error('AssessmentRepository: Failed to update progress', { error, id })
      throw error
    }
  }

  /**
   * Complete assessment
   */
  static async completeAssessment(id: string, answers: Record<string, unknown>): Promise<Assessment> {
    try {
      Logger.info('AssessmentRepository: Completing assessment', { id })

      const now = new Date().toISOString()

      const { data: assessment, error } = await supabase
        .from(this.ASSESSMENTS_TABLE)
        .update({
          status: 'completed',
          completed_at: now,
          progress: 100,
          answers,
          updated_at: now,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      Logger.info('AssessmentRepository: Assessment completed', { id })
      return this.mapAssessmentFromDb(assessment)
    } catch (error) {
      Logger.error('AssessmentRepository: Failed to complete assessment', { error, id })
      throw error
    }
  }

  /**
   * Abandon assessment
   */
  static async abandonAssessment(id: string): Promise<Assessment> {
    try {
      Logger.info('AssessmentRepository: Abandoning assessment', { id })

      const now = new Date().toISOString()

      const { data: assessment, error } = await supabase
        .from(this.ASSESSMENTS_TABLE)
        .update({
          status: 'abandoned',
          updated_at: now,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      Logger.info('AssessmentRepository: Assessment abandoned', { id })
      return this.mapAssessmentFromDb(assessment)
    } catch (error) {
      Logger.error('AssessmentRepository: Failed to abandon assessment', { error, id })
      throw error
    }
  }

  /**
   * Get assessment questions for a type
   */
  static async getQuestionsByType(
    assessmentType: string
  ): Promise<AssessmentQuestion[]> {
    try {
      Logger.info('AssessmentRepository: Getting questions for assessment type', {
        assessmentType,
      })

      const { data, error } = await supabase
        .from(this.QUESTIONS_TABLE)
        .select('*')
        .eq('assessment_type', assessmentType)
        .order('question_number', { ascending: true })

      if (error) throw error

      Logger.info('AssessmentRepository: Questions retrieved', {
        count: data.length,
        assessmentType,
      })
      return data.map((q) => this.mapQuestionFromDb(q))
    } catch (error) {
      Logger.error('AssessmentRepository: Failed to get questions', {
        error,
        assessmentType,
      })
      throw error
    }
  }

  /**
   * Get specific question by ID
   */
  static async getQuestionById(id: string): Promise<AssessmentQuestion | null> {
    try {
      const { data, error } = await supabase
        .from(this.QUESTIONS_TABLE)
        .select('*')
        .eq('id', id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      if (!data) return null

      return this.mapQuestionFromDb(data)
    } catch (error) {
      Logger.error('AssessmentRepository: Failed to get question', { error, id })
      throw error
    }
  }

  /**
   * Create assessment question
   */
  static async createQuestion(data: Omit<AssessmentQuestion, 'id' | 'createdAt' | 'updatedAt'>): Promise<AssessmentQuestion> {
    try {
      Logger.info('AssessmentRepository: Creating assessment question', {
        assessmentType: data.assessmentType,
        questionNumber: data.questionNumber,
      })

      const now = new Date().toISOString()

      const { data: question, error } = await supabase
        .from(this.QUESTIONS_TABLE)
        .insert([
          {
            assessment_type: data.assessmentType,
            question_number: data.questionNumber,
            category: data.category,
            question: data.question,
            max_score: data.maxScore,
            instructions: data.instructions,
            image_url: data.imageUrl,
            audio_url: data.audioUrl,
            options: data.options,
            scoring_logic: data.scoringLogic,
            created_at: now,
            updated_at: now,
          },
        ])
        .select()
        .single()

      if (error) throw error

      Logger.info('AssessmentRepository: Question created', { id: question.id })
      return this.mapQuestionFromDb(question)
    } catch (error) {
      Logger.error('AssessmentRepository: Failed to create question', { error })
      throw error
    }
  }

  /**
   * Map assessment from database record
   */
  private static mapAssessmentFromDb(dbRecord: any): Assessment {
    return {
      id: dbRecord.id,
      patientId: dbRecord.patient_id,
      assessmentType: dbRecord.assessment_type,
      startedAt: dbRecord.started_at,
      completedAt: dbRecord.completed_at,
      status: dbRecord.status,
      progress: dbRecord.progress,
      answers: dbRecord.answers,
      metadata: dbRecord.metadata,
      createdAt: dbRecord.created_at,
      updatedAt: dbRecord.updated_at,
    }
  }

  /**
   * Map question from database record
   */
  private static mapQuestionFromDb(dbRecord: any): AssessmentQuestion {
    return {
      id: dbRecord.id,
      assessmentType: dbRecord.assessment_type,
      questionNumber: dbRecord.question_number,
      category: dbRecord.category,
      question: dbRecord.question,
      maxScore: dbRecord.max_score,
      instructions: dbRecord.instructions,
      imageUrl: dbRecord.image_url,
      audioUrl: dbRecord.audio_url,
      options: dbRecord.options,
      scoringLogic: dbRecord.scoring_logic,
      createdAt: dbRecord.created_at,
      updatedAt: dbRecord.updated_at,
    }
  }
}

export default AssessmentRepository
