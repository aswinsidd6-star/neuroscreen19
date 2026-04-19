/**
 * PATTERN ANALYSIS SERVICE
 * Alzheimer's pattern detection and risk assessment
 */

import { analyzeAlzheimersPatterns } from '@/lib/patternAnalysis'
import { AlzheimersPattern, DomainScores, AssessmentAnswers } from '@/types'
import Logger from '@/utils/logger'

export class PatternService {
  /**
   * Analyze cognitive patterns for Alzheimer's indicators
   */
  static analyzePatterns(
    domainScores: DomainScores,
    answers: AssessmentAnswers,
    totalScore: number
  ): AlzheimersPattern {
    Logger.info('PatternService: Analyzing cognitive patterns', {
      totalScore,
      domainCount: Object.keys(domainScores).length,
    })

    try {
      // Use existing library function
      const libraryResult = analyzeAlzheimersPatterns(domainScores, answers)

      // Map to our types and enhance with additional logic
      const pattern: AlzheimersPattern = {
        riskLevel: this.calculateRiskLevel(totalScore, domainScores),
        score: totalScore,
        patterns: (libraryResult.patterns || []).map((p) => p.name),
        reasoning: libraryResult.keyFindings?.join('; ') || this.generateReasonng(domainScores, totalScore),
      }

      Logger.info('PatternService: Pattern analysis complete', {
        riskLevel: pattern.riskLevel,
        patternCount: pattern.patterns.length,
      })

      return pattern
    } catch (error) {
      Logger.error('PatternService: Error analyzing patterns', error)

      // Return safe default
      return {
        riskLevel: 'low',
        score: totalScore,
        patterns: [],
        reasoning: 'Pattern analysis unavailable - refer to clinical evaluation',
      }
    }
  }

  /**
   * Calculate risk level from MMSE-like scoring
   */
  private static calculateRiskLevel(
    totalScore: number,
    domainScores: DomainScores
  ): 'low' | 'mild_impairment' | 'moderate' | 'high' {
    // Score thresholds for screening
    if (totalScore >= 26) {
      return 'low' // Normal
    } else if (totalScore >= 20) {
      return 'mild_impairment' // Mild cognitive impairment
    } else if (totalScore >= 13) {
      return 'moderate' // Moderate cognitive impairment
    } else {
      return 'high' // Severe cognitive impairment
    }
  }

  /**
   * Generate detailed reasoning for patterns
   */
  private static generateReasonng(
    domainScores: DomainScores,
    totalScore: number
  ): string {
    const weakAreas: string[] = []

    // Check each domain
    if ((domainScores.orientation || 0) < 4) weakAreas.push('orientation')
    if ((domainScores.registration || 0) < 2) weakAreas.push('memory registration')
    if ((domainScores.recall || 0) < 2) weakAreas.push('delayed recall')
    if ((domainScores.attention || 0) < 3) weakAreas.push('attention/concentration')
    if ((domainScores.language || 0) < 3) weakAreas.push('language')

    if (weakAreas.length === 0) {
      return 'Cognitive screening results within normal limits across all assessed domains.'
    }

    const areasText = weakAreas.join(', ')
    return `Cognitive screening identified potential concerns in ${areasText}. Further evaluation recommended.`
  }

  /**
   * Check for red flags suggestive of dementia
   */
  static identifyRedFlags(domainScores: DomainScores, answers: AssessmentAnswers): string[] {
    const flags: string[] = []

    // Memory concerns
    if ((domainScores.registration || 0) < 2 || (domainScores.recall || 0) < 2) {
      flags.push('Significant memory impairment detected')
    }

    // Disorientation (often early sign)
    if ((domainScores.orientation || 0) < 4) {
      flags.push('Orientation deficit noted')
    }

    // Language/communication
    if ((domainScores.language || 0) < 2) {
      flags.push('Language or comprehension difficulties')
    }

    // Attention issues
    if ((domainScores.attention || 0) < 2) {
      flags.push('Attention or concentration problems')
    }

    // Pattern: multiple domains affected
    const affectedDomains = Object.values(domainScores).filter((score) => (score || 0) < 3).length
    if (affectedDomains >= 4) {
      flags.push('Widespread cognitive involvement suggests multidomain impairment')
    }

    return flags
  }

  /**
   * Generate functional impact assessment
   */
  static assessFunctionalImpact(
    riskLevel: 'low' | 'mild_impairment' | 'moderate' | 'high',
    domainScores: DomainScores
  ): string {
    switch (riskLevel) {
      case 'low':
        return 'Cognitive function supports independent daily activities'

      case 'mild_impairment':
        return 'Mild cognitive changes may affect complex tasks; generally independent with occasional support'

      case 'moderate':
        return 'Moderate cognitive impairment; requires supervision for complex tasks; significant impact on daily activities'

      case 'high':
        return 'Severe cognitive impairment; requires substantial assistance for daily activities and safety'

      default:
        return 'Functional assessment unavailable'
    }
  }

  /**
   * Generate follow-up recommendations
   */
  static generateFollowUpRecommendations(
    riskLevel: 'low' | 'mild_impairment' | 'moderate' | 'high'
  ): string[] {
    const recommendations = [
      'Review results with primary care physician',
      'Maintain cognitive activities and mental stimulation',
      'Ensure adequate sleep and nutrition',
    ]

    if (riskLevel === 'mild_impairment') {
      recommendations.push('Repeat screening in 6-12 months')
      recommendations.push('Consider comprehensive neuropsychological evaluation')
    } else if (riskLevel === 'moderate' || riskLevel === 'high') {
      recommendations.push('Urgent comprehensive neuropsychological evaluation recommended')
      recommendations.push('Consider specialist referral (neurology, geriatrics)')
      recommendations.push('Evaluate for modifiable risk factors')
    }

    return recommendations
  }

  /**
   * Calculate Alzheimer's risk index (0-100)
   */
  static calculateAlzheimersRiskIndex(
    totalScore: number,
    domainScores: DomainScores,
    age: number = 65
  ): number {
    let baseRisk = 0

    // Score-based risk (low score = high risk)
    if (totalScore >= 26) baseRisk = 5
    else if (totalScore >= 20) baseRisk = 25
    else if (totalScore >= 13) baseRisk = 50
    else baseRisk = 75

    // Age adjustment (higher age = higher risk)
    const ageAdjustment = Math.min(20, Math.max(0, (age - 65) / 2))

    // Domain severity adjustment
    const severeImpairments = Object.values(domainScores).filter((score) => (score || 0) < 2).length
    const domainAdjustment = Math.min(15, severeImpairments * 5)

    const totalRisk = baseRisk + ageAdjustment + domainAdjustment
    return Math.min(100, Math.round(totalRisk))
  }
}

export default PatternService
