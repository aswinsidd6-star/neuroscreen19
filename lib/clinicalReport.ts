/**
 * CLINICAL REPORT GENERATION
 * Comprehensive medical-grade cognitive assessment report
 */

import { DomainScores } from "./mmseEnhanced"
import { PatternAnalysis } from "./patternAnalysis"
import { RiskAssessment, generateRiskSummary } from "./riskCalculator"
import { NormalizationData, interpretNormalizedScore } from "./ageNormalization"

export interface ClinicalReport {
  reportId: string
  createdDate: string
  patientInfo: PatientInfo
  testResults: TestResults
  clinicalInterpretation: string
  recommendations: string[]
  impressionSummary: string
}

export interface PatientInfo {
  name: string
  age: number
  education: number
  testDate: string
}

export interface TestResults {
  domainScores: DomainScores
  totalScore: number
  percentile: number
  normalizedData: NormalizationData
  patterns: PatternAnalysis
  riskAssessment: RiskAssessment
}

/**
 * Generate comprehensive clinical report
 */
export function generateClinicalReport(
  patientName: string,
  age: number,
  education: number,
  domains: DomainScores,
  totalScore: number,
  patterns: PatternAnalysis,
  riskAssessment: RiskAssessment,
  normData: NormalizationData
): ClinicalReport {
  const reportId = generateReportId()
  const createdDate = new Date().toISOString().split("T")[0]

  return {
    reportId,
    createdDate,
    patientInfo: {
      name: patientName,
      age,
      education,
      testDate: createdDate,
    },
    testResults: {
      domainScores: domains,
      totalScore,
      percentile: normData.percentileFinal,
      normalizedData: normData,
      patterns,
      riskAssessment,
    },
    clinicalInterpretation: generateClinicalInterpretation(domains, patterns, riskAssessment, age),
    recommendations: riskAssessment.recommendations,
    impressionSummary: generateImpression(totalScore, age, patterns, riskAssessment),
  }
}

/**
 * Generate detailed clinical interpretation
 */
function generateClinicalInterpretation(
  domains: DomainScores,
  patterns: PatternAnalysis,
  risk: RiskAssessment,
  age: number
): string {
  const domainFindings = analyzeDomainFindings(domains)
  const primaryConcerns = patterns.primaryRisk === "high" 
    ? `Primary concerns include ${patterns.keyFindings.join(", ")}.` 
    : ""

  return (
    `Cognitive Assessment Results: \n\n` +
    `Domain Analysis:\n${domainFindings}\n\n` +
    `Overall Cognitive Status:\n` +
    `The patient demonstrates ${describeOverallCognition(risk.category, age)}. ` +
    `${primaryConcerns} ` +
    `Risk assessment indicates ${risk.category.replace(/_/g, " ")} with an overall risk score of ${risk.overallRisk}/100. ` +
    `The pattern of deficits is consistent with ${patterns.primaryRisk === "low" ? "normal aging" : "possible early cognitive decline"}.`
  )
}

/**
 * Analyze domain-by-domain findings
 */
function analyzeDomainFindings(domains: DomainScores): string {
  const findings: string[] = []

  if (domains.orientation >= 5) findings.push(`• Orientation: Intact (${domains.orientation}/6)`)
  else if (domains.orientation >= 3) findings.push(`• Orientation: Mild deficits (${domains.orientation}/6)`)
  else findings.push(`• Orientation: Significant deficits (${domains.orientation}/6)`)

  if (domains.registration === 3) findings.push(`• Registration: Normal word recall (${domains.registration}/3)`)
  else findings.push(`• Registration: Impaired (${domains.registration}/3) - difficulty storing new information`)

  if (domains.attention >= 4) findings.push(`• Attention/Working Memory: Normal (${domains.attention}/5)`)
  else findings.push(`• Attention/Working Memory: Reduced (${domains.attention}/5)`)

  if (domains.recall >= 2) findings.push(`• Recall: Adequate (${domains.recall}/4)`)
  else findings.push(`• Recall: Impaired (${domains.recall}/4) - difficulty retrieving information`)

  if (domains.language >= 7) findings.push(`• Language: Normal (${domains.language}/8)`)
  else findings.push(`• Language: Mildly impaired (${domains.language}/8) - naming or fluency difficulty`)

  if (domains.visuospatial >= 4) findings.push(`• Visuospatial: Normal (${domains.visuospatial}/5)`)
  else findings.push(`• Visuospatial: Impaired (${domains.visuospatial}/5)`)

  if (domains.executive >= 2) findings.push(`• Executive Function: Normal (${domains.executive}/4)`)
  else findings.push(`• Executive Function: Reduced (${domains.executive}/4)`)

  return findings.join("\n")
}

/**
 * Describe overall cognitive status based on risk category
 */
function describeOverallCognition(category: string, age: number): string {
  switch (category) {
    case "normal":
      return `preserved cognitive function ${age >= 70 ? "well-maintained for age" : ""}`
    case "mild_cognitive_decline":
      return "mild cognitive impairment in specific domains that warrants follow-up"
    case "moderate_decline":
      return "moderate cognitive decline that requires specialist evaluation and possible intervention"
    case "significant_decline":
      return "significant cognitive decline requiring urgent medical evaluation and comprehensive diagnostic workup"
    default:
      return "cognitive function that requires clinical assessment"
  }
}

/**
 * Generate summary impression for report
 */
function generateImpression(
  totalScore: number,
  age: number,
  patterns: PatternAnalysis,
  risk: RiskAssessment
): string {
  const categoryLabel = risk.category.replace(/_/g, " ").toUpperCase()
  const timeframe = risk.followUpTimeframe

  const impression = [
    `IMPRESSION: ${categoryLabel}`,
    ``,
    `Score: ${totalScore}/30 percentile`,
    `Risk Level: ${risk.overallRisk}/100`,
    `Primary Findings: ${patterns.keyFindings.join(", ") || "Mild cognitive concerns"}`,
    `Follow-up: ${timeframe}`,
    ``,
    `This assessment suggests the patient would benefit from ` +
    (risk.category === "normal" ? "continued cognitive engagement and routine health maintenance" :
     risk.category === "mild_cognitive_decline" ? "neuropsychological evaluation and cognitive rehabilitation" :
     risk.category === "moderate_decline" ? "specialist neurology consultation and comprehensive diagnostic imaging" :
     "urgent medical evaluation and neurological assessment"),
  ]

  return impression.join("\n")
}

/**
 * Generate formatted PDF-ready report
 */
export function formatReportForPrint(report: ClinicalReport): string {
  const line = "=".repeat(60)

  return `
${line}
NEUROPSYCHOLOGICAL ASSESSMENT REPORT
${line}

REPORT ID: ${report.reportId}
DATE: ${report.createdDate}

PATIENT INFORMATION
${line}
Name: ${report.patientInfo.name}
Age: ${report.patientInfo.age} years
Education: ${report.patientInfo.education} years
Test Date: ${report.patientInfo.testDate}

TEST RESULTS SUMMARY
${line}
Total Score: ${report.testResults.totalScore}/30
Percentile: ${report.testResults.percentile}%
Normalized Score: ${report.testResults.normalizedData.normScore}

DOMAIN SCORES
${line}
Orientation:     ${report.testResults.domainScores.orientation}/6
Registration:    ${report.testResults.domainScores.registration}/3
Attention:       ${report.testResults.domainScores.attention}/5
Recall:          ${report.testResults.domainScores.recall}/4
Language:        ${report.testResults.domainScores.language}/8
Visuospatial:    ${report.testResults.domainScores.visuospatial}/5
Executive:       ${report.testResults.domainScores.executive}/4
Speech:          ${report.testResults.domainScores.speech}/3

CLINICAL INTERPRETATION
${line}
${report.clinicalInterpretation}

RECOMMENDATIONS
${line}
${report.recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n")}

CLINICAL IMPRESSION
${line}
${report.impressionSummary}

${line}
Report generated: ${new Date().toLocaleString()}
${line}
`
}

/**
 * Generate unique report ID
 */
function generateReportId(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `NSR-${timestamp}-${random}`
}
