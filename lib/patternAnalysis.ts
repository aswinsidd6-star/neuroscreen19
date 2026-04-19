/**
 * ALZHEIMER'S PATTERN DETECTION
 * Identifies specific cognitive patterns associated with early dementia
 */

export interface CognitivePattern {
  name: string
  score: number
  risk: "low" | "moderate" | "high"
  indicators: string[]
}

export interface PatternAnalysis {
  patterns: CognitivePattern[]
  primaryRisk: "low" | "moderate" | "high"
  keyFindings: string[]
}

/**
 * Detect Alzheimer-specific cognitive patterns
 */
export function analyzeAlzheimersPatterns(domains: Record<string, number>, answers: Record<string, string>): PatternAnalysis {
  const patterns: CognitivePattern[] = []

  // Pattern 1: Memory Decline (most significant early sign)
  const memoryScore = (domains.recall || 0) + (domains.registration || 0)
  const memoryPattern: CognitivePattern = {
    name: "Memory Decline",
    score: memoryScore,
    risk: memoryScore < 4 ? "high" : memoryScore < 6 ? "moderate" : "low",
    indicators: detectMemoryIndicators(answers),
  }
  patterns.push(memoryPattern)

  // Pattern 2: Executive Dysfunction
  const execScore = domains.executive || 0
  const execPattern: CognitivePattern = {
    name: "Executive Function Impairment",
    score: execScore,
    risk: execScore < 1 ? "high" : execScore < 2 ? "moderate" : "low",
    indicators: detectExecutiveIndicators(answers),
  }
  patterns.push(execPattern)

  // Pattern 3: Language Issues
  const langScore = domains.language || 0
  const langPattern: CognitivePattern = {
    name: "Language/Naming Difficulty",
    score: langScore,
    risk: langScore < 5 ? "high" : langScore < 7 ? "moderate" : "low",
    indicators: detectLanguageIndicators(answers),
  }
  patterns.push(langPattern)

  // Pattern 4: Visuospatial Decline
  const vsScore = domains.visuospatial || 0
  const vsPattern: CognitivePattern = {
    name: "Visuospatial Impairment",
    score: vsScore,
    risk: vsScore < 3 ? "moderate" : "low",
    indicators: detectVisuospatialIndicators(answers),
  }
  patterns.push(vsPattern)

  // Pattern 5: Orientation Issues
  const orientScore = domains.orientation || 0
  const orientPattern: CognitivePattern = {
    name: "Disorientation",
    score: orientScore,
    risk: orientScore < 3 ? "high" : orientScore < 5 ? "moderate" : "low",
    indicators: detectOrientationIndicators(answers),
  }
  patterns.push(orientPattern)

  // Determine primary risk level
  const highRiskPatterns = patterns.filter(p => p.risk === "high")
  const primaryRisk = highRiskPatterns.length >= 2 ? "high" : 
                     patterns.filter(p => p.risk !== "low").length >= 3 ? "moderate" : 
                     "low"

  return {
    patterns,
    primaryRisk,
    keyFindings: extractKeyFindings(patterns),
  }
}

function detectMemoryIndicators(answers: Record<string, string>): string[] {
  const indicators: string[] = []
  
  if (!answers.memory_recall || answers.memory_recall.trim().length < 5) {
    indicators.push("Difficulty recalling previously learned information")
  }
  if (!(answers.memory_plant_repeat || "").toLowerCase().includes("apple")) {
    indicators.push("Failed to retain complete word list")
  }
  if ((answers.sr_forgot || "").toLowerCase().length < 3) {
    indicators.push("Poor story recall")
  }
  
  return indicators
}

function detectExecutiveIndicators(answers: Record<string, string>): string[] {
  const indicators: string[] = []
  
  const animalCount = parseInt(answers.animal_fluency_count || "0")
  const letterCount = parseInt(answers.letter_fluency_count || "0")
  
  if (animalCount < 5 || letterCount < 4) {
    indicators.push("Reduced verbal fluency")
  }
  if (animalCount < 3 && letterCount < 2) {
    indicators.push("Significant executive dysfunction")
  }
  
  return indicators
}

function detectLanguageIndicators(answers: Record<string, string>): string[] {
  const indicators: string[] = []
  const namingErrors = ["pencil", "watch", "key", "scissors", "thermometer", "compass"]
    .filter(word =>
      !(answers[`name_${word}`] || "").toLowerCase().includes(word.substring(0, 3))
    ).length
  
  if (namingErrors >= 3) {
    indicators.push("Anomia (difficulty naming objects)")
  }
  if ((answers.writing || "").trim().split(/\s+/).length < 3) {
    indicators.push("Poor written language production")
  }
  if ((answers.language_repeat || "").toLowerCase().split(/\s+/).length < 5) {
    indicators.push("Verbal expression difficulty")
  }
  
  return indicators
}

function detectVisuospatialIndicators(answers: Record<string, string>): string[] {
  const indicators: string[] = []
  
  const clockScore = parseInt(answers.clock_score || "0")
  if (clockScore < 2) {
    indicators.push("Clock drawing impairment")
  }
  if (parseInt(answers.pentagon_score || "0") < 2) {
    indicators.push("Pentagon copying difficulty")
  }
  
  return indicators
}

function detectOrientationIndicators(answers: Record<string, string>): string[] {
  const indicators: string[] = []
  
  if (!answers.orient_year || !answers.orient_month) {
    indicators.push("Temporal disorientation")
  }
  if (!answers.orient_place) {
    indicators.push("Spatial disorientation")
  }
  if (!(answers.location_state || "").trim()) {
    indicators.push("Cannot identify location context")
  }
  
  return indicators
}

function extractKeyFindings(patterns: CognitivePattern[]): string[] {
  return patterns
    .filter(p => p.risk !== "low")
    .sort((a, b) => {
      const riskWeight = { high: 3, moderate: 2, low: 1 }
      return riskWeight[b.risk as keyof typeof riskWeight] - riskWeight[a.risk as keyof typeof riskWeight]
    })
    .slice(0, 3)
    .map(p => `${p.name}: ${p.indicators[0] || "Impairment detected"}`)
}
