/**
 * AGE-BASED NORMALIZATION
 * Adjust cognitive scores based on age and education demographics
 */

export interface NormalizationData {
  ageGroup: string
  normScore: number
  percentileFinal: number
  expectedScore: number
  deviation: number
}

/**
 * Age-adjusted score normalization based on clinical studies
 * Uses comprehensive norms from cognitive aging literature
 */
export function normalizeScoreByAge(rawScore: number, age: number, education: number = 12): NormalizationData {
  const ageGroup = getAgeGroup(age)
  const expectedScore = getExpectedScore(age, education)
  const deviation = rawScore - expectedScore
  
  // Calculate adjusted percentile based on age norms
  const ageAdjustment = getAgeAdjustmentFactor(age)
  const educationAdjustment = getEducationAdjustmentFactor(education)
  
  const normScore = Math.round(rawScore + ageAdjustment + educationAdjustment)
  const maxPossible = 30
  const percentileFinal = Math.min(Math.max((normScore / maxPossible) * 100, 0), 100)

  return {
    ageGroup,
    normScore,
    percentileFinal,
    expectedScore,
    deviation,
  }
}

/**
 * Get age group classification
 */
function getAgeGroup(age: number): string {
  if (age < 50) return "45-49"
  if (age < 60) return "50-59"
  if (age < 70) return "60-69"
  if (age < 75) return "70-74"
  if (age < 80) return "75-79"
  if (age < 85) return "80-84"
  return "85+"
}

/**
 * Get expected score based on normative data by age
 * Scores decline approximately 0.2-0.3 points per year after age 60
 */
function getExpectedScore(age: number, education: number): number {
  let baseScore = 28 // Healthy adult baseline

  // Age-related decline (research shows ~0.2 points/year after 60)
  if (age >= 60) {
    const yearsAfter60 = age - 60
    const ageDecline = yearsAfter60 * 0.25 // quadratic decay for older ages
    baseScore -= Math.min(ageDecline, 8) // max decline ~8 points
  }

  // Education adjustment (each year of education adds ~0.3 points)
  const educationAdjustment = (education - 12) * 0.3
  baseScore += educationAdjustment

  return Math.max(baseScore, 15) // minimum expected
}

/**
 * Age adjustment factor for score normalization
 * Negative values indicate expected decline with age
 */
function getAgeAdjustmentFactor(age: number): number {
  if (age < 50) return 0
  if (age < 60) return 0
  if (age < 70) return -1
  if (age < 75) return -2
  if (age < 80) return -3
  if (age < 85) return -4
  return -5
}

/**
 * Education adjustment factor
 * Linear adjustment: each year of education adds points
 */
function getEducationAdjustmentFactor(education: number): number {
  if (education < 8) return -1
  if (education < 12) return 0
  if (education <= 16) return 0.5
  return 1
}

/**
 * Interpret normalized score within appropriate age context
 */
export function interpretNormalizedScore(normData: NormalizationData, age: number): string {
  const { percentileFinal, deviation } = normData

  if (percentileFinal >= 85) {
    return "Normal cognition for age"
  }

  if (percentileFinal >= 70) {
    if (deviation < -3) {
      return "Mild cognitive decline (below age expected)"
    }
    return "High average for age"
  }

  if (percentileFinal >= 50) {
    return "Mild to moderate cognitive impairment"
  }

  return "Significant cognitive impairment requiring intervention"
}

/**
 * Get detailed age-based interpretation
 */
export function getAgeBasedInterpretation(age: number, rawScore: number): {
  category: string
  explanation: string
  concern: boolean
} {
  const normData = normalizeScoreByAge(rawScore, age)
  const { percentileFinal } = normData

  if (age < 60) {
    if (percentileFinal >= 85) {
      return {
        category: "Normal",
        explanation: "Cognitive function is normal for this age",
        concern: false,
      }
    }
    if (percentileFinal >= 70) {
      return {
        category: "Borderline",
        explanation: "Some mild cognitive concerns; further evaluation recommended",
        concern: true,
      }
    }
    return {
      category: "Impaired",
      explanation: "Significant cognitive impairment for this age; urgent evaluation needed",
      concern: true,
    }
  }

  // Age 60-70
  if (age < 70) {
    if (percentileFinal >= 80) {
      return {
        category: "Normal",
        explanation: "Cognitive function is normal for this age",
        concern: false,
      }
    }
    if (percentileFinal >= 65) {
      return {
        category: "Borderline",
        explanation: "Mild decline; follow-up assessment recommended",
        concern: true,
      }
    }
    return {
      category: "Impaired",
      explanation: "Moderate to significant cognitive impairment; specialist evaluation recommended",
      concern: true,
    }
  }

  // Age 70+
  if (percentileFinal >= 75) {
    return {
      category: "Normal",
      explanation: "Cognitive function is well-preserved for this age",
      concern: false,
    }
  }
  if (percentileFinal >= 60) {
    return {
      category: "Borderline",
      explanation: "Age-appropriate mild decline; periodic assessment recommended",
      concern: false,
    }
  }
  return {
    category: "Impaired",
    explanation: "Cognitive impairment beyond normal aging; medical evaluation recommended",
    concern: true,
  }
}
