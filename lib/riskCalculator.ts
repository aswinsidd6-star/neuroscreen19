/**
 * COGNITIVE DECLINE RISK ASSESSMENT
 * Comprehensive risk scoring based on domains and patterns
 */

export interface RiskFactors {
  memoryRisk: number
  executiveRisk: number
  languageRisk: number
  visuospatialRisk: number
  orientationRisk: number
}

export interface RiskAssessment {
  overallRisk: number // 0-100
  category: "normal" | "mild_cognitive_decline" | "moderate_decline" | "significant_decline"
  riskFactors: RiskFactors
  recommendations: string[]
  followUpTimeframe: string
}

/**
 * Calculate comprehensive risk score
 */
export function calculateRiskScore(domains: Record<string, number>, totalScore: number, maxScore: number = 30): RiskAssessment {
  const percentile = (totalScore / maxScore) * 100

  // Calculate individual domain risks (0-100, higher = more risk)
  const riskFactors: RiskFactors = {
    memoryRisk: calculateDomainRisk(domains.recall || 0, 4),
    executiveRisk: calculateDomainRisk(domains.executive || 0, 4),
    languageRisk: calculateDomainRisk(domains.language || 0, 8),
    visuospatialRisk: calculateDomainRisk(domains.visuospatial || 0, 5),
    orientationRisk: calculateDomainRisk(domains.orientation || 0, 6),
  }

  // Weighted overall risk (memory is weighted heavily)
  const overallRisk = Math.round(
    riskFactors.memoryRisk * 0.35 +
    riskFactors.executiveRisk * 0.25 +
    riskFactors.languageRisk * 0.2 +
    riskFactors.visuospatialRisk * 0.1 +
    riskFactors.orientationRisk * 0.1
  )

  // Categorize risk
  let category: "normal" | "mild_cognitive_decline" | "moderate_decline" | "significant_decline"
  if (percentile >= 85) {
    category = "normal"
  } else if (percentile >= 70) {
    category = "mild_cognitive_decline"
  } else if (percentile >= 50) {
    category = "moderate_decline"
  } else {
    category = "significant_decline"
  }

  return {
    overallRisk,
    category,
    riskFactors,
    recommendations: generateRecommendations(category, riskFactors),
    followUpTimeframe: getFollowUpTimeframe(category),
  }
}

/**
 * Calculate risk for individual domain (0-100)
 * Compares score to max possible and converts to risk
 */
function calculateDomainRisk(score: number, maxScore: number): number {
  const percentile = (score / maxScore) * 100
  // Convert percentile to risk (0-100, higher = more risk)
  return Math.round(100 - percentile)
}

/**
 * Generate clinical recommendations based on risk category
 */
function generateRecommendations(category: string, riskFactors: RiskFactors): string[] {
  const recommendations: string[] = []

  switch (category) {
    case "normal":
      recommendations.push("Continue regular cognitive activities and exercise")
      recommendations.push("Maintain healthy diet and sleep patterns")
      recommendations.push("Routine annual cognitive screening recommended")
      break

    case "mild_cognitive_decline":
      recommendations.push("Schedule comprehensive neuropsychological evaluation")
      recommendations.push("Increase cognitive training and mental stimulation")
      recommendations.push("Implement memory aids and organizational strategies")
      recommendations.push("Neurology or geriatry consultation advised")
      break

    case "moderate_decline":
      recommendations.push("Urgent referral to neurologist for evaluation")
      recommendations.push("Consider MRI brain imaging to rule out structural causes")
      recommendations.push("Neuropsychological testing battery recommended")
      recommendations.push("Discuss medication options with healthcare provider")
      break

    case "significant_decline":
      recommendations.push("Immediate medical evaluation required")
      recommendations.push("Comprehensive diagnostic workup including MRI, labs")
      recommendations.push("Neurology/neuroscience specialist consultation urgent")
      recommendations.push("Caregiver support and safety planning")
      break
  }

  // Add domain-specific recommendations
  if (riskFactors.memoryRisk > 70) {
    recommendations.push("Focus on memory rehabilitation and coping strategies")
  }
  if (riskFactors.executiveRisk > 70) {
    recommendations.push("Executive function assessment and training indicated")
  }
  if (riskFactors.visuospatialRisk > 70) {
    recommendations.push("Screen for visual-spatial processing disorders")
  }

  return recommendations
}

/**
 * Get recommended timeframe for follow-up assessment
 */
function getFollowUpTimeframe(category: string): string {
  switch (category) {
    case "normal":
      return "12 months"
    case "mild_cognitive_decline":
      return "3-6 months"
    case "moderate_decline":
      return "1-3 months"
    case "significant_decline":
      return "Urgent - within 2 weeks"
    default:
      return "As clinically indicated"
  }
}

/**
 * Generate risk summary for clinical documentation
 */
export function generateRiskSummary(assessment: RiskAssessment): string {
  const categoryLabels = {
    normal: "Normal cognition",
    mild_cognitive_decline: "Mild Cognitive Impairment",
    moderate_decline: "Moderate Cognitive Decline",
    significant_decline: "Significant Cognitive Decline",
  }

  return `Overall Risk Score: ${assessment.overallRisk}/100 (${categoryLabels[assessment.category]}). ` +
    `Memory risk: ${assessment.riskFactors.memoryRisk}%, Executive: ${assessment.riskFactors.executiveRisk}%, ` +
    `Language: ${assessment.riskFactors.languageRisk}%, Visuospatial: ${assessment.riskFactors.visuospatialRisk}%, ` +
    `Orientation: ${assessment.riskFactors.orientationRisk}%. ` +
    `Follow-up recommended: ${assessment.followUpTimeframe}.`
}
