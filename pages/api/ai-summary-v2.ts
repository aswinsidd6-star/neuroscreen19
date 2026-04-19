/**
 * COMPREHENSIVE AI SUMMARY ENDPOINT (REFACTORED)
 * Uses modular services for scoring, AI analysis, and pattern detection
 * Includes authentication, validation, and comprehensive reporting
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { ScoringService } from '@/services/scoring.service'
import { AIService } from '@/services/ai.service'
import { PatternService } from '@/services/pattern.service'
import { ClinicalReport, AssessmentAnswers } from '@/types'
import Logger from '@/utils/logger'
import Validator from '@/utils/validator'
import { createSuccessResponse, createErrorResponse } from '@/utils/helpers'
import {
  compose,
  requireMethod,
  requireBody,
  rateLimit,
  withErrorHandler,
  withSecurityHeaders,
  withRequestId,
} from '@/middleware/api.middleware'
import { optionalAuth } from '@/middleware/auth.middleware'

/**
 * Generate professional clinical report prompt
 */
function buildClinicalPrompt(
  profile: any,
  patientName: string,
  patientAge: number,
  answers: AssessmentAnswers
): string {
  return `You are an expert clinical neuropsychologist writing a comprehensive cognitive assessment report for medical records.

PATIENT INFORMATION:
- Name: ${patientName || 'Patient'}
- Age: ${patientAge || 'Not specified'}
- Assessment Date: ${new Date().toLocaleDateString()}

ASSESSMENT RESULTS:
- Overall Score: ${profile.overallPercentage}% (${profile.overallStatus})
- Total Score: ${profile.totalScore}/${profile.maxScore}
- Status Level: ${profile.overallStatus}

DOMAIN SCORES:
${Object.entries(profile.domainScores)
  .map(([domain, score]: [string, any]) => `- ${domain}: ${score}`)
  .join('\n')}

KEY FINDINGS:
${profile.keyFindings.join('\n')}

CLINICAL SUMMARY:
${profile.clinicalSummary}

TASK: Write a professional, evidence-based cognitive assessment report (700-900 words) with these sections:

1. PATIENT BACKGROUND & PRESENTATION
   - Demographic information
   - Chief concern or presenting symptoms
   - Reliability of assessment

2. TEST PERFORMANCE OVERVIEW
   - Overall cognitive status
   - Global cognitive score with interpretation
   - Comparison to age norms (if applicable)

3. DOMAIN-BY-DOMAIN ANALYSIS
   - Memory (registration, recall, delayed memory)
   - Attention & Concentration (serial 7s, digit span)
   - Language (naming, comprehension, repetition)
   - Visuospatial Skills (drawing, spatial reasoning)
   - Executive Function (planning, organization, abstraction)

4. CLINICAL INTERPRETATION
   - Pattern of results (uniform decline vs. selective deficits?)
   - Comparison to expected cognitive aging
   - Red flags for dementia or neurodegenerative conditions
   - Functional implications

5. DIFFERENTIAL CONSIDERATIONS
   - Is this normal aging?
   - Mild Cognitive Impairment (MCI)?
   - Early dementia pattern?
   - Other neurological conditions?

6. RECOMMENDATIONS & NEXT STEPS
   - Follow-up neuropsychological evaluation
   - Specialist referrals (neurology, psychiatry, etc.)
   - Neuroimaging if indicated
   - Monitoring schedule
   - Lifestyle modifications

GUIDELINES:
- Use precise medical terminology
- Avoid making definitive diagnoses (this is screening, not diagnosis)
- Focus on functional impact
- Include specific test names and scores
- Professional, objective tone
- Suitable for medical records and specialist review
- Include statement about limitations of screening

Generate the comprehensive clinical report now:`
}

/**
 * Handler function
 */
async function handler(req: NextApiRequest & { user?: any }, res: NextApiResponse) {
  Logger.generateRequestId()

  const { answers, patientName, patientAge } = req.body

  try {
    // ═══ VALIDATION ═══
    Logger.info('API: ai-summary request received', {
      hasAnswers: !!answers,
      patientAge,
    })

    // Validate assessment answers
    const validation = Validator.validateAssessmentAnswers(answers)
    if (!validation.valid) {
      Logger.warn('API: Validation failed', {
        errors: validation.errors.map((e) => e.field),
      })

      return res.status(400).json(
        createErrorResponse(
          new Error('Invalid assessment answers'),
          400,
          `Validation errors: ${validation.errors.map((e) => e.message).join('; ')}`
        )
      )
    }

    // ═══ SCORING ═══
    Logger.info('API: Starting scoring service')
    const cognitiveProfile = await ScoringService.scoreAssessment(answers)

    // ═══ PATTERN ANALYSIS ═══
    Logger.info('API: Starting pattern analysis')
    const patterns = PatternService.analyzePatterns(
      cognitiveProfile.domainScores,
      answers,
      cognitiveProfile.totalScore
    )

    const alzheimerRiskIndex = PatternService.calculateAlzheimersRiskIndex(
      cognitiveProfile.totalScore,
      cognitiveProfile.domainScores,
      patientAge || 65
    )

    const functionalImpact = PatternService.assessFunctionalImpact(
      patterns.riskLevel,
      cognitiveProfile.domainScores
    )

    const redFlags = PatternService.identifyRedFlags(cognitiveProfile.domainScores, answers)
    const followUpRecommendations = PatternService.generateFollowUpRecommendations(patterns.riskLevel)

    // ═══ AI NARRATIVE REPORT ═══
    let narrativeReport = 'AI narrative report not generated due to missing API configuration.'

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        Logger.info('API: Generating AI narrative report')
        const prompt = buildClinicalPrompt(cognitiveProfile, patientName, patientAge, answers)
        narrativeReport = await AIService.callClaude(prompt, 2000)
      } catch (aiError) {
        Logger.warn('API: AI narrative generation failed, using fallback', { error: aiError })
        narrativeReport =
          'AI narrative report generation failed. Review the structured assessment scores above for clinical interpretation.'
      }
    }

    // ═══ BUILD COMPREHENSIVE REPORT ═══
    const clinicalReport: ClinicalReport = {
      patientName: patientName || 'Assessment',
      patientAge,
      assessmentDate: new Date().toISOString(),
      totalScore: cognitiveProfile.totalScore,
      adjustedScore: Math.round(cognitiveProfile.overallPercentage),
      domainScores: cognitiveProfile.domainScores,
      alzheimerRiskIndex,
      patternAnalysis: patterns,
      functionalImpact,
      clinicalInterpretation: cognitiveProfile.clinicalSummary,
      recommendations: [
        ...followUpRecommendations,
        ...cognitiveProfile.recommendations,
      ],
      confidenceScore: 0.85, // Typical confidence for screening tools
      disclaimer:
        'This is a cognitive screening tool and NOT a diagnostic instrument. Results should be interpreted by a qualified healthcare professional in clinical context. Definitive diagnosis requires comprehensive neuropsychological evaluation.',
    }

    // ═══ STRUCTURED EVALUATION ═══
    const evaluation = {
      overallScore: cognitiveProfile.overallPercentage,
      overallStatus: cognitiveProfile.overallStatus,
      totalScore: cognitiveProfile.totalScore,
      maxScore: cognitiveProfile.maxScore,
      domains: cognitiveProfile.domainScores,
      keyFindings: cognitiveProfile.keyFindings,
      redFlags: redFlags.length > 0 ? redFlags : undefined,
      alzheimerRiskIndex,
      functionalImpact,
      recommendations: followUpRecommendations,
      testResults: cognitiveProfile.testResults.map((test) => ({
        testName: test.testName,
        domain: test.domain,
        score: `${test.score}/${test.maxScore}`,
        percentage: Math.round(test.percentage),
        status: test.status,
      })),
    }

    Logger.info('API: Report generation complete', {
      totalScore: cognitiveProfile.totalScore,
      riskLevel: patterns.riskLevel,
      alzheimerRiskIndex,
    })

    // ═══ RESPONSE ═══
    return res.status(200).json(
      createSuccessResponse(
        {
          success: true,
          evaluation,
          narrative: narrativeReport,
          clinicalReport,
          disclaimer: clinicalReport.disclaimer,
        },
        'Comprehensive assessment complete'
      )
    )
  } catch (error) {
    Logger.error('API: Unhandled error in ai-summary', error)

    return res.status(500).json(
      createErrorResponse(
        error,
        500,
        'Failed to generate cognitive assessment report'
      )
    )
  }
}

// Apply middleware stack
export default compose(
  withRequestId,
  withSecurityHeaders,
  rateLimit(10, 60000), // 10 requests per minute
  requireMethod('POST'),
  requireBody(['answers']),
  optionalAuth, // Optional auth for user tracking
  withErrorHandler
)(handler)
