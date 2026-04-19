/**
 * COMPREHENSIVE COGNITIVE ASSESSMENT API
 * Integrates enhanced MMSE scoring, pattern analysis, risk assessment, and reporting
 */

import type { NextApiRequest, NextApiResponse } from "next"
import { calculateDomainScores, calculateTotalScore, scoreToPercentile } from "../../lib/mmseEnhanced"
import { analyzeAlzheimersPatterns } from "../../lib/patternAnalysis"
import { calculateRiskScore } from "../../lib/riskCalculator"
import { normalizeScoreByAge } from "../../lib/ageNormalization"
import { generateClinicalReport, formatReportForPrint } from "../../lib/clinicalReport"

interface AssessmentRequest {
  answers: Record<string, string>
  patientName: string
  patientAge: number
  patientEducation?: number
}

interface ComprehensiveAssessmentResponse {
  success: boolean
  domainScores?: Record<string, number>
  totalScore?: number
  percentile?: number
  patterns?: any
  riskAssessment?: any
  normalization?: any
  report?: any
  reportText?: string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ComprehensiveAssessmentResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" })
  }

  try {
    const { answers, patientName, patientAge = 65, patientEducation = 12 } = req.body as AssessmentRequest

    if (!answers || !patientName) {
      return res.status(400).json({ success: false, error: "Missing required fields" })
    }

    // Calculate enhanced domain scores
    const domainScores = calculateDomainScores(answers)
    const totalScore = calculateTotalScore(domainScores)
    const maxScore = 30 // Max possible in MMSE system
    const percentile = scoreToPercentile(totalScore, maxScore)

    // Analyze cognitive patterns
    const patternAnalysis = analyzeAlzheimersPatterns(domainScores, answers)

    // Calculate risk assessment
    const riskAssessment = calculateRiskScore(domainScores, totalScore, maxScore)

    // Apply age-based normalization
    const normalization = normalizeScoreByAge(totalScore, patientAge, patientEducation)

    // Generate clinical report
    const report = generateClinicalReport(
      patientName,
      patientAge,
      patientEducation,
      domainScores,
      totalScore,
      patternAnalysis,
      riskAssessment,
      normalization
    )

    // Generate formatted report text
    const reportText = formatReportForPrint(report)

    return res.status(200).json({
      success: true,
      domainScores,
      totalScore,
      percentile,
      patterns: patternAnalysis,
      riskAssessment,
      normalization,
      report,
      reportText,
    })
  } catch (error) {
    console.error("Assessment API error:", error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
