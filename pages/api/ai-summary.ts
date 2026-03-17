import type { NextApiRequest, NextApiResponse } from 'next'
import { evaluateAllTests } from '@/lib/evaluation'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { answers, results } = req.body

  try {
    // Run comprehensive cognitive evaluation
    const cognitiveProfile = evaluateAllTests(answers)

    // Build structured report sections
    const reportSections = {
      overallScore: cognitiveProfile.overallPercentage,
      overallStatus: cognitiveProfile.overallStatus,
      totalScore: cognitiveProfile.totalScore,
      maxScore: cognitiveProfile.maxScore,
      domains: cognitiveProfile.domainScores,
      keyFindings: cognitiveProfile.keyFindings,
      recommendations: cognitiveProfile.recommendations,
      clinicalSummary: cognitiveProfile.clinicalSummary,
      testResults: cognitiveProfile.testResults.map(test => ({
        testName: test.testName,
        domain: test.domain,
        score: `${test.score}/${test.maxScore}`,
        percentage: test.percentage,
        status: test.status,
        components: test.components,
      })),
    }

    // Generate AI narrative report if API key available
    let narrativeReport = ''
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const prompt = buildPrompt(reportSections, answers)
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2600,
            messages: [{ role: 'user', content: prompt }],
          }),
        })

        const data = await response.json()
        narrativeReport = data.content?.map((c: any) => c.text || '').join('') || ''
      } catch (aiError) {
        console.error('AI report generation failed:', aiError)
        narrativeReport = 'AI report generation unavailable.'
      }
    }

    res.json({
      success: true,
      evaluation: reportSections,
      narrative: narrativeReport || 'Review structured report above.',
    })
  } catch (error) {
    console.error('Evaluation error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate cognitive evaluation',
    })
  }
}

function buildPrompt(report: any, answers: Record<string, any>): string {
  return `You are an expert neuropsychologist. Write a professional cognitive assessment report.

PATIENT INFORMATION:
Name: ${answers.name}
Age: ${answers.age}
Gender: ${answers.gender}
Date: ${new Date().toLocaleDateString()}

COGNITIVE ASSESSMENT RESULTS:
Overall Score: ${report.overallScore}% (${report.overallStatus})
Total: ${report.totalScore}/${report.maxScore}

TEST RESULTS SUMMARY:
${report.testResults.map((t: any) => `- ${t.testName}: ${t.score} (${t.percentage}%) [${t.status}]`).join('\n')}

DOMAIN BREAKDOWN:
${Object.entries(report.domains).map(([domain, scores]: any) => `- ${domain.toUpperCase()}: ${scores.score}/${scores.max} (${scores.percentage}%)`).join('\n')}

KEY CLINICAL FINDINGS:
${report.keyFindings.join('\n')}

RECOMMENDATIONS:
${report.recommendations.join('\n')}

TASK: Write a professional 7-paragraph cognitive assessment report suitable for medical records:

1. OVERVIEW - Overall cognitive score, status level, and general assessment
2. MEMORY - Hippocampal function, free vs cued recall patterns, encoding quality
3. ATTENTION - Serial 7s, digit span, working memory capacity
4. LANGUAGE - Object naming test, fluency scores, semantic vs phonemic patterns
5. VISUOSPATIAL - Pentagon drawing, clock drawing, executive function integration
6. FUNCTIONAL STATUS - ADL impacts, real-world cognitive effects
7. RECOMMENDATIONS - Clinical next steps, specialist referrals, monitoring plan

Requirements:
- Precise with all test scores (use exact numbers)
- Professional medical tone
- Suitable for medical record documentation
- Address any clinical patterns or concerns
- Provide specific action recommendations
- 600-800 words total
- No unnecessary explanations or padding

Generate the report now:`
}
