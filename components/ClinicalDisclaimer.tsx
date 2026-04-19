/**
 * CLINICAL DISCLAIMER & COMPLIANCE COMPONENT (PHASE 9)
 * React component displaying clinical assessment disclaimers and limitations
 */

'use client'

import React, { useState } from 'react'

interface ClinicalDisclaimerProps {
  showAtStart?: boolean
  showAtEnd?: boolean
  variant?: 'modal' | 'banner' | 'expandable'
  onAccept?: () => void
  onReject?: () => void
}

/**
 * Clinical Disclaimer Component
 * Displays important legal and clinical disclaimers required for clinical screening tools
 */
export const ClinicalDisclaimer: React.FC<ClinicalDisclaimerProps> = ({
  showAtStart = true,
  showAtEnd = true,
  variant = 'modal',
  onAccept,
  onReject,
}) => {
  const [isAccepted, setIsAccepted] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const disclaimerContent = `
⚠️ CLINICAL SCREENING TOOL ONLY - NOT A DIAGNOSTIC INSTRUMENT

IMPORTANT DISCLAIMER AND LIMITATIONS

This assessment is a cognitive screening tool designed to identify individuals who may benefit 
from further neuropsychological evaluation. Results should NOT be interpreted as a diagnosis.

DIAGNOSTIC LIMITATIONS:
• Definitive diagnosis of cognitive impairment, mild cognitive impairment, or dementia requires 
  comprehensive evaluation by a qualified healthcare professional
• Must include detailed history, physical examination, and neuropsychological testing
• This tool cannot and should not be used as a standalone diagnostic instrument

ASSESSMENT FACTORS:
Results depend on multiple factors beyond cognitive ability:
• Patient cooperation and effort during testing
• Depression, anxiety, and mood disorders (can impair performance)
• Medication effects (psychotropic drugs, sedatives, etc.)
• Educational background (higher education may improve scores)
• Cultural and linguistic factors
• Fatigue, stress, and environmental factors
• Vision and hearing impairment

CLINICAL CONTEXT:
• This is a preliminary screening tool only
• Abnormal results warrant further evaluation by specialists (Neurology, Geriatrics, Psychiatry)
• Normal results do not exclude underlying cognitive pathology
• Results should be interpreted in the context of clinical presentation and history
• Serial assessments (repeat testing) are recommended for monitoring changes over time

CONFIDENTIALITY & DATA HANDLING:
• All assessment results are confidential medical information
• Results should be securely stored and protected
• Access should be limited to authorized healthcare providers
• HIPAA and applicable privacy laws apply

MEDICAL PROFESSIONAL CONSULTATION:
Patients should discuss results with their healthcare provider. Results should NOT be used for:
• Self-diagnosis or self-management of neurological conditions
• Treatment decisions without medical consultation
• Employment or legal decisions
• Screening in non-clinical settings without professional oversight

VALIDITY & RELIABILITY:
This tool has been validated for screening purposes in specific populations. However:
• Performance may vary in different cultural/linguistic groups
• Validity may be reduced in patients with significant sensory impairment
• Results may not be applicable to all age groups or medical conditions

LIABILITY:
This tool is provided for educational and screening purposes. The developers, administrators, 
and hosting organizations assume no liability for:
• Misinterpretation of results
• Use of results without professional consultation
• Clinical decisions based on this tool alone
• Unexpected outcomes from assessment

USER RESPONSIBILITIES:
• Users acknowledge this is NOT a diagnostic tool
• Users agree to seek professional medical evaluation for abnormal results
• Users understand the limitations of cognitive screening tools
• Users agree not to use results for medical decisions without professional guidance

REGULATORY COMPLIANCE:
• This tool may be subject to medical device regulations
• Use should comply with applicable healthcare laws and regulations
• Professional licensing and credentialing may apply
• Proper informed consent should be obtained before assessment

By proceeding with this assessment, you acknowledge:
✓ You understand this is a screening tool, not a diagnostic instrument
✓ You will seek professional medical evaluation if indicated by results
✓ You understand the limitations and factors that may affect results
✓ You will handle results as confidential medical information
✓ You will not rely solely on this tool for medical decisions
`

  const handleAccept = () => {
    setIsAccepted(true)
    onAccept?.()
  }

  const handleReject = () => {
    setIsAccepted(false)
    onReject?.()
  }

  if (variant === 'modal' && !isAccepted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 text-white p-6">
            <h2 className="text-2xl font-bold">⚠️ Clinical Disclaimer</h2>
            <p className="text-sm mt-2">Please read and acknowledge before proceeding</p>
          </div>

          <div className="p-6">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> This is a screening tool only and does not constitute 
                a medical diagnosis. Always consult with a healthcare professional for actual 
                medical evaluation.
              </p>
            </div>

            <div className="prose prose-sm max-w-none">
              <pre className="bg-gray-50 p-4 rounded text-xs whitespace-pre-wrap font-sans text-gray-700">
                {disclaimerContent}
              </pre>
            </div>

            <div className="mt-6 flex items-center gap-2">
              <input
                type="checkbox"
                id="acknowledge"
                checked={isAccepted}
                onChange={(e) => setIsAccepted(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <label htmlFor="acknowledge" className="text-sm text-gray-700">
                I have read and understood the clinical disclaimer and limitations
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleReject}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAccept}
                disabled={!isAccepted}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                I Accept & Proceed
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'banner') {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded mb-6">
        <div className="flex items-start gap-3">
          <div className="text-2xl">⚠️</div>
          <div className="flex-1">
            <h3 className="font-bold text-red-800">Clinical Screening Tool Disclaimer</h3>
            <p className="text-sm text-red-700 mt-2">
              This assessment is a screening tool only and does not constitute a medical diagnosis. 
              Results should be interpreted by qualified healthcare professionals. Always consult 
              with your doctor before making any medical decisions.
            </p>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-red-600 hover:text-red-800 font-medium mt-2"
            >
              {isExpanded ? 'Hide' : 'Show'} Full Disclaimer
            </button>

            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-red-200">
                <pre className="text-xs whitespace-pre-wrap font-sans text-red-700">
                  {disclaimerContent.substring(0, 500)}...
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'expandable') {
    return (
      <div className="border rounded-lg overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full bg-amber-50 p-4 flex items-center justify-between hover:bg-amber-100 transition"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="text-left">
              <h3 className="font-bold text-amber-900">Clinical Disclaimer</h3>
              <p className="text-sm text-amber-700">Screening tool - not a diagnostic instrument</p>
            </div>
          </div>
          <span className="text-xl">{isExpanded ? '−' : '+'}</span>
        </button>

        {isExpanded && (
          <div className="p-4 bg-amber-50 border-t border-amber-200">
            <pre className="text-xs whitespace-pre-wrap font-sans text-amber-900">
              {disclaimerContent}
            </pre>
          </div>
        )}
      </div>
    )
  }

  return null
}

/**
 * Clinical Report with Embedded Disclaimers
 */
export const ClinicalReportDisplay: React.FC<{
  patientName: string
  totalScore: number
  adjustedScore: number
  clinicalInterpretation: string
  recommendations: string[]
  riskLevel: string
}> = ({
  patientName,
  totalScore,
  adjustedScore,
  clinicalInterpretation,
  recommendations,
  riskLevel,
}) => {
  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low':
        return 'green'
      case 'mild_impairment':
        return 'yellow'
      case 'moderate':
        return 'orange'
      case 'high':
        return 'red'
      default:
        return 'gray'
    }
  }

  const color = getRiskColor(riskLevel)

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg mb-6">
        <h1 className="text-3xl font-bold">Cognitive Assessment Report</h1>
        <p className="text-blue-100 mt-2">
          Generated on {new Date().toLocaleDateString()} for {patientName}
        </p>
      </div>

      {/* Pre-Report Disclaimer */}
      <ClinicalDisclaimer variant="banner" />

      {/* Results Section */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded border border-gray-200">
          <p className="text-sm text-gray-600">Total Score</p>
          <p className="text-3xl font-bold text-gray-800">{totalScore}/30</p>
        </div>
        <div className="bg-gray-50 p-4 rounded border border-gray-200">
          <p className="text-sm text-gray-600">Adjusted Score</p>
          <p className="text-3xl font-bold text-gray-800">{adjustedScore}/30</p>
        </div>
      </div>

      {/* Risk Level */}
      <div className={`bg-${color}-50 border-l-4 border-${color}-400 p-4 rounded mb-6`}>
        <p className={`text-sm text-${color}-700 font-semibold`}>Risk Classification</p>
        <p className={`text-2xl font-bold text-${color}-800`}>{riskLevel.toUpperCase().replace(/_/g, ' ')}</p>
      </div>

      {/* Clinical Interpretation */}
      <div className="bg-white border border-gray-200 p-6 rounded mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Clinical Interpretation</h2>
        <p className="text-gray-700 leading-relaxed">{clinicalInterpretation}</p>
      </div>

      {/* Recommendations */}
      <div className="bg-white border border-gray-200 p-6 rounded mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Recommendations</h2>
        <ul className="space-y-2">
          {recommendations.map((rec, idx) => (
            <li key={idx} className="flex items-start gap-3 text-gray-700">
              <span className="text-blue-600 font-bold flex-shrink-0">{idx + 1}.</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Post-Report Disclaimer */}
      <div className="bg-red-50 border border-red-200 p-6 rounded mb-6">
        <h3 className="font-bold text-red-800 mb-3">⚠️ Important Notice</h3>
        <ul className="text-sm text-red-700 space-y-2">
          <li>• This is a screening tool only; not a diagnostic instrument</li>
          <li>• Results should be reviewed with a qualified healthcare professional</li>
          <li>• Do not rely on this tool alone for medical decisions</li>
          <li>• Follow-up evaluation is recommended as noted above</li>
          <li>• Keep this report confidential and secure</li>
        </ul>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-600 py-4 border-t border-gray-200">
        <p>This report is confidential medical information intended for healthcare professionals only.</p>
        <p className="mt-2">
          Generated by NeuroScreen Cognitive Assessment System -{' '}
          <span className="text-gray-500">v2.0 Clinical Edition</span>
        </p>
      </div>
    </div>
  )
}

export default ClinicalDisclaimer
