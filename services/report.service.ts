/**
 * CLINICAL REPORT SERVICE (PHASE 10)
 * Comprehensive report generation with all required clinical elements
 */

import { ClinicalReport, AlzheimersPattern, DomainScores } from '@/types'
import Logger from '@/utils/logger'

export class ClinicalReportService {
  /**
   * Generate comprehensive clinical report object
   */
  static generateReport(params: {
    patientName: string
    patientAge: number
    patientEducation?: number
    totalScore: number
    maxScore: number
    domainScores: DomainScores
    patternAnalysis: AlzheimersPattern
    assessmentDate?: string
    functionalImpact?: string
    recommendations?: string[]
  }): ClinicalReport {
    Logger.info('ClinicalReportService: Generating clinical report', {
      patientName: params.patientName,
      totalScore: params.totalScore,
    })

    const adjustedScore = this.calculateAdjustedScore(
      params.totalScore,
      params.maxScore,
      params.patientAge,
      params.patientEducation
    )

    const clinicalInterpretation = this.generateInterpretation(
      params.totalScore,
      params.maxScore,
      params.patternAnalysis.riskLevel,
      params.patientAge
    )

    const report: ClinicalReport = {
      patientName: params.patientName,
      patientAge: params.patientAge,
      assessmentDate: params.assessmentDate || new Date().toISOString(),
      totalScore: params.totalScore,
      adjustedScore,
      domainScores: params.domainScores,
      alzheimerRiskIndex: this.calculateAlzheimersRiskIndex(params.totalScore, params.patientAge),
      patternAnalysis: params.patternAnalysis,
      functionalImpact: params.functionalImpact || 'Pending functional assessment',
      clinicalInterpretation,
      recommendations: params.recommendations || [],
      confidenceScore: 0.85,
      disclaimer:
        '⚠️ CLINICAL SCREENING TOOL ONLY - NOT A DIAGNOSTIC INSTRUMENT\n\n' +
        'This assessment is a cognitive screening tool designed to identify individuals who may benefit from further neuropsychological evaluation. ' +
        'Results should NOT be interpreted as a diagnosis. Definitive diagnosis of cognitive impairment, mild cognitive impairment, or dementia requires ' +
        'comprehensive evaluation by a qualified healthcare professional including detailed history, physical examination, and neuropsychological testing. ' +
        'Results depend on patient cooperation, effort, and cooperation during testing. Factors such as depression, anxiety, medication effects, and ' +
        'educational background may influence performance.',
    }

    Logger.info('ClinicalReportService: Report generated successfully', {
      riskLevel: params.patternAnalysis.riskLevel,
      adjustedScore,
    })

    return report
  }

  /**
   * Calculate age-adjusted score
   */
  private static calculateAdjustedScore(
    score: number,
    maxScore: number,
    age: number,
    education: number = 12
  ): number {
    // Simple age/education adjustment
    // In production, use validated normative data
    let adjusted = score

    // Age adjustment (expected decline after 65)
    if (age >= 70) adjusted -= 2
    if (age >= 75) adjusted -= 4
    if (age >= 80) adjusted -= 6

    // Education adjustment (higher education supports cognitive reserve)
    if (education >= 16) adjusted += 1
    if (education < 8) adjusted -= 1

    // Keep within bounds
    return Math.max(0, Math.min(maxScore, adjusted))
  }

  /**
   * Calculate Alzheimer's risk index with age weighting
   */
  private static calculateAlzheimersRiskIndex(score: number, age: number): number {
    const maxScore = 30

    // Base risk from score
    let riskIndex = 0

    if (score >= 26) riskIndex = 5
    else if (score >= 24) riskIndex = 10
    else if (score >= 20) riskIndex = 25
    else if (score >= 18) riskIndex = 35
    else if (score >= 14) riskIndex = 50
    else if (score >= 10) riskIndex = 65
    else riskIndex = 85

    // Age amplification
    if (age >= 85) riskIndex = Math.min(100, riskIndex + 20)
    else if (age >= 80) riskIndex = Math.min(100, riskIndex + 15)
    else if (age >= 75) riskIndex = Math.min(100, riskIndex + 10)
    else if (age >= 70) riskIndex = Math.min(100, riskIndex + 5)

    return riskIndex
  }

  /**
   * Generate clinical interpretation narrative
   */
  private static generateInterpretation(
    score: number,
    maxScore: number,
    riskLevel: string,
    age: number
  ): string {
    const percentage = (score / maxScore) * 100

    let interpretation = ''

    if (percentage >= 90) {
      interpretation =
        `Cognitive screening results are within expected range. Patient demonstrates normal cognitive function across assessed domains. ` +
        `No evidence of significant cognitive impairment at this time. ` +
        `Recommend continued monitoring and cognitive health maintenance.`
    } else if (percentage >= 75) {
      interpretation =
        `Cognitive screening reveals borderline performance on some domains. ` +
        `Results suggest possible mild cognitive changes that warrant monitoring. ` +
        `Recommend repeat assessment in 6-12 months and comprehensive neuropsychological evaluation to determine if changes represent normal aging variation or early pathology.`
    } else if (percentage >= 60) {
      interpretation =
        `Cognitive screening indicates moderate cognitive impairment affecting multiple domains. ` +
        `Pattern suggests possible mild cognitive impairment (MCI) or early dementia-related cognitive decline. ` +
        `Recommend urgent comprehensive neuropsychological evaluation, imaging studies, and specialist consultation to determine underlying etiology and appropriate management.`
    } else {
      interpretation =
        `Cognitive screening indicates significant cognitive impairment across multiple domains. ` +
        `Results are consistent with moderate to severe cognitive dysfunction warranting prompt comprehensive evaluation. ` +
        `Recommend immediate specialist referral (neurology, geriatrics) and comprehensive diagnostic workup including neuroimaging and biomarker assessment.`
    }

    // Add age context
    if (age >= 75) {
      interpretation +=
        ` Given the patient's age, careful distinction between normal aging and pathological cognitive decline is important.`
    }

    return interpretation
  }

  /**
   * Format report for PDF/printing
   */
  static formatForPrinting(report: ClinicalReport): string {
    return `
╔════════════════════════════════════════════════════════════════╗
║        COGNITIVE SCREENING ASSESSMENT REPORT                   ║
╚════════════════════════════════════════════════════════════════╝

PATIENT INFORMATION
────────────────────────────────────────────────────────────────
Name:                  ${report.patientName}
Age:                   ${report.patientAge} years
Assessment Date:       ${new Date(report.assessmentDate).toLocaleDateString()}


COGNITIVE SCREENING RESULTS
────────────────────────────────────────────────────────────────
Total Score:          ${report.totalScore}/${30} points
Adjusted Score:       ${report.adjustedScore}/${30} points
Performance Level:    ${this.scoreToPercentage(report.totalScore)}%
Risk Classification:  ${report.patternAnalysis.riskLevel.toUpperCase().replace(/_/g, ' ')}


DOMAIN BREAKDOWN
────────────────────────────────────────────────────────────────
${Object.entries(report.domainScores)
  .map(([domain, score]) => `${domain.padEnd(20)}: ${String(score).padStart(2)} points`)
  .join('\n')}


CLINICAL INTERPRETATION
────────────────────────────────────────────────────────────────
${report.clinicalInterpretation}


FUNCTIONAL IMPACT ASSESSMENT
────────────────────────────────────────────────────────────────
${report.functionalImpact}


ALZHEIMER'S RISK INDEX
────────────────────────────────────────────────────────────────
Risk Score:           ${report.alzheimerRiskIndex}/100
Risk Level:           ${this.getRiskLevelDescription(report.alzheimerRiskIndex)}


RECOMMENDATIONS
────────────────────────────────────────────────────────────────
${report.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}


CLINICAL DISCLAIMER
────────────────────────────────────────────────────────────────
${report.disclaimer}


Assessment Confidence:  ${(report.confidenceScore * 100).toFixed(0)}%
════════════════════════════════════════════════════════════════
Generated: ${report.assessmentDate}
    `
  }

  /**
   * Convert score to percentage
   */
  private static scoreToPercentage(score: number): number {
    return Math.round((score / 30) * 100)
  }

  /**
   * Get risk level description
   */
  private static getRiskLevelDescription(riskScore: number): string {
    if (riskScore < 15) return 'LOW - Normal cognitive aging expected'
    if (riskScore < 35) return 'LOW-MODERATE - Monitor for changes'
    if (riskScore < 50) return 'MODERATE - Further evaluation recommended'
    if (riskScore < 70) return 'MODERATE-HIGH - Specialist consultation advised'
    return 'HIGH - Urgent specialist evaluation recommended'
  }

  /**
   * Export report as JSON
   */
  static exportJSON(report: ClinicalReport): string {
    return JSON.stringify(report, null, 2)
  }
}

export default ClinicalReportService
