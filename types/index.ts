/**
 * CENTRALIZED TYPE DEFINITIONS FOR NEUROSCREEN
 * Provides type safety across services, APIs, and components
 */

// ════════════════════════════════════════════════════════════════
// USER & AUTHENTICATION TYPES
// ════════════════════════════════════════════════════════════════

export interface User {
  id: string
  email: string
  role: 'doctor' | 'admin' | 'patient'
  createdAt: string
  lastLogin?: string
}

export interface AuthSession {
  user: User
  token: string
  expiresAt: string
}

// ════════════════════════════════════════════════════════════════
// PATIENT & ASSESSMENT TYPES
// ════════════════════════════════════════════════════════════════

export interface Patient {
  id: string
  name: string
  age: number
  gender: 'M' | 'F' | 'Other'
  createdAt: string
}

export interface AssessmentAnswers {
  name?: string
  age?: number
  gender?: string
  [key: string]: any
}

// ════════════════════════════════════════════════════════════════
// SCORING & DOMAINS
// ════════════════════════════════════════════════════════════════

export interface DomainScores {
  orientation?: number
  registration?: number
  attention?: number
  recall?: number
  language?: number
  visuospatial?: number
  executive?: number
  speech?: number
  [key: string]: any
}

export interface TestResult {
  testName: string
  domain: string
  score: number
  maxScore: number
  percentage: number
  status: 'normal' | 'mild' | 'moderate' | 'severe'
  components?: Record<string, number>
}

export interface CognitiveProfile {
  totalScore: number
  maxScore: number
  overallPercentage: number
  overallStatus: string
  domainScores: DomainScores
  testResults: TestResult[]
  keyFindings: string[]
  recommendations: string[]
  clinicalSummary: string
}

// ════════════════════════════════════════════════════════════════
// AI & PATTERN ANALYSIS
// ════════════════════════════════════════════════════════════════

export interface AIAnalysisResponse {
  score: number
  note: string
  confidence?: number
}

export interface AlzheimersPattern {
  riskLevel: 'low' | 'mild_impairment' | 'moderate' | 'high'
  score: number
  patterns: string[]
  reasoning: string
}

export interface RiskAssessment {
  alzheimerRiskIndex: number
  functionalImpact: string
  recommendedFollowUp: string
  flags: string[]
}

// ════════════════════════════════════════════════════════════════
// REPORT TYPES
// ════════════════════════════════════════════════════════════════

export interface ClinicalReport {
  patientId?: string
  patientName?: string
  patientAge?: number
  assessmentDate: string
  totalScore: number
  adjustedScore: number
  domainScores: DomainScores
  alzheimerRiskIndex: number
  patternAnalysis: AlzheimersPattern
  functionalImpact: string
  clinicalInterpretation: string
  recommendations: string[]
  confidenceScore: number
  disclaimer: string
}

export interface ReportOutput {
  evaluation: any
  narrative: string
  clinicalReport?: ClinicalReport
  success: boolean
  error?: string
}

// ════════════════════════════════════════════════════════════════
// API RESPONSE WRAPPER
// ════════════════════════════════════════════════════════════════

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  statusCode: number
  timestamp: string
  requestId?: string
}

export interface ApiError {
  statusCode: number
  message: string
  error?: string
  details?: Record<string, any>
}

// ════════════════════════════════════════════════════════════════
// VALIDATION TYPES
// ════════════════════════════════════════════════════════════════

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

// ════════════════════════════════════════════════════════════════
// LOGGING TYPES
// ════════════════════════════════════════════════════════════════

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'

export interface LogEntry {
  level: LogLevel
  timestamp: string
  message: string
  context?: Record<string, any>
  error?: any
  requestId?: string
  userId?: string
}
