/**
 * AI SERVICE
 * Centralized AI operations with standardized responses, fallback, and retry logic
 */

import { AIAnalysisResponse } from '@/types'
import Logger from '@/utils/logger'

const ANTHROPIC_BASE_URL = 'https://api.anthropic.com/v1/messages'
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions'

export class AIService {
  /**
   * Call Claude API with retry logic
   */
  static async callClaude(
    prompt: string,
    maxTokens: number = 1000,
    retries: number = 1
  ): Promise<string> {
    const requestId = Logger.getRequestId()
    Logger.info('AIService: Calling Claude API', {
      promptLength: prompt.length,
      maxTokens,
      retries,
    })

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(ANTHROPIC_BASE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY || '',
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: maxTokens,
            messages: [{ role: 'user', content: prompt }],
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(
            `Claude API error: ${response.status} - ${error.error?.message || 'Unknown error'}`
          )
        }

        const data = await response.json()
        const content = data.content?.[0]?.text || ''

        Logger.info('AIService: Claude API success', {
          responseLength: content.length,
          attempt: attempt + 1,
        })

        return content
      } catch (error) {
        Logger.warn('AIService: Claude API attempt failed', {
          attempt: attempt + 1,
          error: error instanceof Error ? error.message : String(error),
        })

        if (attempt === retries) {
          Logger.error('AIService: Claude API failed after all retries', error)
          throw error
        }

        // Exponential backoff before retry
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000))
      }
    }

    throw new Error('AIService: All Claude API retry attempts exhausted')
  }

  /**
   * Call Groq API (faster alternative)
   */
  static async callGroq(
    prompt: string,
    model: string = 'mixtral-8x7b-32768',
    maxTokens: number = 500
  ): Promise<string> {
    Logger.info('AIService: Calling Groq API', { modelLength: model.length, maxTokens })

    try {
      const response = await fetch(GROQ_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY || ''}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Groq API error: ${response.status} - ${error.error?.message || 'Unknown'}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || ''

      Logger.info('AIService: Groq API success', { responseLength: content.length })
      return content
    } catch (error) {
      Logger.error('AIService: Groq API call failed', error)
      throw error
    }
  }

  /**
   * Standardize JSON response from AI
   */
  static parseAIResponse<T = any>(
    rawText: string,
    defaultValue?: T
  ): T {
    try {
      // Remove markdown code blocks
      const cleaned = rawText.replace(/```json\n?|```\n?/g, '').trim()

      // Try to parse as JSON
      const parsed = JSON.parse(cleaned)
      Logger.debug('AIService: Successfully parsed JSON response')
      return parsed as T
    } catch (error) {
      Logger.warn('AIService: Failed to parse JSON response, using default', {
        rawLength: rawText.length,
        error: error instanceof Error ? error.message : 'JSON parse error',
      })

      return defaultValue || ({} as T)
    }
  }

  /**
   * Generate cognitive analysis report
   */
  static async generateCognitiveReport(
    patientName: string,
    patientAge: number,
    townsendScores: any,
    assessmentResults: any
  ): Promise<string> {
    const prompt = `You are an expert neuropsychologist writing a professional cognitive assessment report.

PATIENT INFORMATION:
- Name: ${patientName}
- Age: ${patientAge}

ASSESSMENT RESULTS:
${JSON.stringify(assessmentResults, null, 2)}

Please write a professional, clinically appropriate narrative report (3-4 paragraphs) that:
1. Summarizes the patient's cognitive performance
2. Highlights areas of strength and concern
3. Places findings in context of age and education
4. Recommends appropriate follow-up

Format: Use clear clinical language. Avoid definitive diagnostic statements. Focus on screening results.`

    try {
      const response = await this.callClaude(prompt, 1500)
      Logger.info('AIService: Cognitive report generated successfully')
      return response
    } catch (error) {
      Logger.error('AIService: Failed to generate cognitive report', error)
      return `Clinical report generation failed. Please review structured assessment results above.`
    }
  }

  /**
   * Analyze picture description for score and feedback
   */
  static async analyzePictureDescription(
    description: string,
    pictureContext: string
  ): Promise<AIAnalysisResponse> {
    const prompt = `You are scoring a picture description task for cognitive assessment.

PATIENT DESCRIPTION: "${description}"
PICTURE CONTEXT: ${pictureContext}

Rate on 0-5 scale:
- 5: Rich detail, all major elements
- 4: Good detail, most elements
- 3: Main content identified
- 2: Minimal content
- 1: Very limited
- 0: Blank or completely wrong

Reply ONLY with JSON: {"score":N,"note":"brief clinical note","confidence":0.0-1.0}`

    try {
      const response = await this.callGroq(prompt, 'mixtral-8x7b-32768', 250)
      const parsed = this.parseAIResponse<AIAnalysisResponse>(response, {
        score: 2,
        note: 'Analyzed with fallback scoring',
        confidence: 0.6,
      })
      return parsed
    } catch (error) {
      Logger.warn('AIService: Picture analysis failed, using fallback', { error })
      return {
        score: 2, // Fallback to middle score
        note: 'Analyzed using fallback scoring due to API limitation',
        confidence: 0.4,
      }
    }
  }

  /**
   * Analyze speech transcript
   */
  static async analyzeSpeechTranscript(
    transcript: string,
    targetSentence: string
  ): Promise<AIAnalysisResponse> {
    const prompt = `Evaluate speech reading clarity and accuracy.

TARGET: "${targetSentence}"
PATIENT SPOKE: "${transcript}"

Rate on 0-5 scale based on:
- Word match percentage
- Clarity and fluency
- Pronunciation accuracy

Reply ONLY with JSON: {"score":N,"note":"evaluation note","confidence":0.0-1.0}`

    try {
      const response = await this.callGroq(prompt, 'mixtral-8x7b-32768', 200)
      const parsed = this.parseAIResponse<AIAnalysisResponse>(response, {
        score: 2,
        note: 'Analyzed with fallback scoring',
        confidence: 0.6,
      })
      return parsed
    } catch (error) {
      Logger.warn('AIService: Speech analysis failed, using fallback', { error })
      return {
        score: 2,
        note: 'Analyzed using fallback scoring due to API limitation',
        confidence: 0.4,
      }
    }
  }

  /**
   * Rule-based fallback scoring (when AI fails)
   */
  static fallbackScoring(
    input: string,
    type: 'picture' | 'speech' | 'drawing'
  ): number {
    const length = (input || '').trim().length
    const wordCount = length > 0 ? (input || '').trim().split(/\s+/).length : 0

    if (type === 'picture') {
      if (wordCount < 3) return 0
      if (wordCount < 10) return 1
      if (wordCount < 30) return 2
      if (wordCount < 60) return 3
      if (wordCount < 100) return 4
      return 5
    } else if (type === 'speech') {
      if (wordCount < 2) return 0
      if (wordCount < 5) return 1
      if (wordCount < 10) return 2
      if (wordCount < 15) return 3
      if (wordCount < 20) return 4
      return 5
    }

    return 2 // Default safe fallback
  }
}

export default AIService
