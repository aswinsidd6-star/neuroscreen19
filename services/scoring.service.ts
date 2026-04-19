/**
 * SCORING SERVICE
 * Centralized cognitive assessment scoring logic
 * Wraps existing lib/scoring.ts functions for service-based access
 */

import { computeScore } from '@/lib/scoring'
import { calculateDomainScores, calculateTotalScore } from '@/lib/mmseEnhanced'
import { CognitiveProfile, DomainScores, TestResult, AssessmentAnswers } from '@/types'
import Logger from '@/utils/logger'

export class ScoringService {
  /**
   * Comprehensive scoring of all assessment answers
   */
  static async scoreAssessment(answers: AssessmentAnswers): Promise<CognitiveProfile> {
    try {
      Logger.info('ScoringService: Starting comprehensive assessment scoring', {
        answerCount: Object.keys(answers).length,
      })

      // Get domain scores using existing library
      const domainScores = calculateDomainScores(answers)
      const totalScore = calculateTotalScore(domainScores)
      const maxScore = 30

      // Calculate percentages
      const overallPercentage = (totalScore / maxScore) * 100

      // Determine overall status
      const overallStatus = this.getOverallStatus(totalScore, maxScore)

      // Get detailed test results
      const testResults = await this.getTestResults(answers, domainScores)

      // Extract key findings and recommendations
      const keyFindings = this.extractKeyFindings(domainScores, testResults)
      const recommendations = this.generateRecommendations(overallStatus, domainScores)
      const clinicalSummary = this.generateClinicalSummary(totalScore, maxScore, domainScores)

      const profile: CognitiveProfile = {
        totalScore,
        maxScore,
        overallPercentage: Math.round(overallPercentage),
        overallStatus,
        domainScores,
        testResults,
        keyFindings,
        recommendations,
        clinicalSummary,
      }

      Logger.info('ScoringService: Assessment scoring complete', {
        totalScore,
        overallStatus,
        domainCount: Object.keys(domainScores).length,
      })

      return profile
    } catch (error) {
      Logger.error('ScoringService: Error during assessment scoring', error)
      throw error
    }
  }

  /**
   * Get individual test results
   */
  private static async getTestResults(
    answers: AssessmentAnswers,
    domainScores: DomainScores
  ): Promise<TestResult[]> {
    const results: TestResult[] = []

    // Orientation
    if (domainScores.orientation !== undefined) {
      results.push({
        testName: 'Orientation',
        domain: 'Orientation',
        score: domainScores.orientation,
        maxScore: 6,
        percentage: (domainScores.orientation / 6) * 100,
        status: this.getStatusFromScore(domainScores.orientation, 6),
      })
    }

    // Registration (Memory Encoding)
    if (domainScores.registration !== undefined) {
      results.push({
        testName: 'Word Registration',
        domain: 'Registration',
        score: domainScores.registration,
        maxScore: 3,
        percentage: (domainScores.registration / 3) * 100,
        status: this.getStatusFromScore(domainScores.registration, 3),
      })
    }

    // Attention
    if (domainScores.attention !== undefined) {
      results.push({
        testName: 'Attention & Calculation',
        domain: 'Attention',
        score: domainScores.attention,
        maxScore: 5,
        percentage: (domainScores.attention / 5) * 100,
        status: this.getStatusFromScore(domainScores.attention, 5),
      })
    }

    // Recall
    if (domainScores.recall !== undefined) {
      results.push({
        testName: 'Memory Recall',
        domain: 'Recall',
        score: domainScores.recall,
        maxScore: 3,
        percentage: (domainScores.recall / 3) * 100,
        status: this.getStatusFromScore(domainScores.recall, 3),
      })
    }

    // Language
    if (domainScores.language !== undefined) {
      results.push({
        testName: 'Language & Naming',
        domain: 'Language',
        score: domainScores.language,
        maxScore: 4,
        percentage: (domainScores.language / 4) * 100,
        status: this.getStatusFromScore(domainScores.language, 4),
      })
    }

    // Visuospatial
    if (domainScores.visuospatial !== undefined) {
      results.push({
        testName: 'Visuospatial Skills',
        domain: 'Visuospatial',
        score: domainScores.visuospatial,
        maxScore: 4,
        percentage: (domainScores.visuospatial / 4) * 100,
        status: this.getStatusFromScore(domainScores.visuospatial, 4),
      })
    }

    return results
  }

  /**
   * Determine status based on score
   */
  private static getStatusFromScore(score: number, maxScore: number): 'normal' | 'mild' | 'moderate' | 'severe' {
    const percentage = (score / maxScore) * 100

    if (percentage >= 80) return 'normal'
    if (percentage >= 60) return 'mild'
    if (percentage >= 40) return 'moderate'
    return 'severe'
  }

  /**
   * Get overall cognitive status
   */
  private static getOverallStatus(totalScore: number, maxScore: number): string {
    const percentage = (totalScore / maxScore) * 100

    if (percentage >= 26) return 'Normal cognition'
    if (percentage >= 20) return 'Mild cognitive impairment'
    if (percentage >= 13) return 'Moderate cognitive impairment'
    return 'Severe cognitive impairment'
  }

  /**
   * Extract key clinical findings
   */
  private static extractKeyFindings(
    domainScores: DomainScores,
    testResults: TestResult[]
  ): string[] {
    const findings: string[] = []

    // Check weak domains
    for (const result of testResults) {
      if (result.status === 'mild' || result.status === 'moderate' || result.status === 'severe') {
        findings.push(`Impairment detected in ${result.domain}: ${result.testName}`)
      }
    }

    // Check pattern
    const impairmentCount = testResults.filter(
      (t) => t.status !== 'normal'
    ).length

    if (impairmentCount === 0) {
      findings.push('Cognitive function within normal range across all domains')
    } else if (impairmentCount >= 4) {
      findings.push('Widespread cognitive impairment across multiple domains')
    }

    return findings.length > 0 ? findings : ['Assessment completed - refer to detailed scores']
  }

  /**
   * Generate clinical recommendations
   */
  private static generateRecommendations(overallStatus: string, domainScores: DomainScores): string[] {
    const recommendations: string[] = []

    if (overallStatus.includes('cognitive impairment')) {
      recommendations.push('Recommend comprehensive neuropsychological evaluation')
      recommendations.push('Consider follow-up assessment in 3-6 months')
      recommendations.push('Discuss results with healthcare provider')
    } else {
      recommendations.push('Continue regular cognitive activities and brain health practices')
      recommendations.push('Maintain healthy lifestyle with regular exercise and sleep')
    }

    return recommendations
  }

  /**
   * Generate clinical summary
   */
  private static generateClinicalSummary(
    totalScore: number,
    maxScore: number,
    domainScores: DomainScores
  ): string {
    const percentage = (totalScore / maxScore) * 100
    const baseMessage = `Patient scored ${totalScore}/${maxScore} (${Math.round(percentage)}%) on cognitive assessment.`

    if (percentage >= 80) {
      return baseMessage + ' Cognitive function is within expected range for age.'
    } else if (percentage >= 60) {
      return baseMessage + ' Results suggest mild cognitive changes that warrant monitoring.'
    } else if (percentage >= 40) {
      return baseMessage + ' Results indicate moderate cognitive impairment requiring further evaluation.'
    } else {
      return baseMessage + ' Results suggest significant cognitive impairment. Urgent further evaluation recommended.'
    }
  }
}

export default ScoringService
