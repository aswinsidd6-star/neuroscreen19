import type { NextApiRequest, NextApiResponse } from 'next'

type SpeechResponse = {
  score: number
  note: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SpeechResponse>
) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ score: 0, note: 'Method not allowed' })
    }

    const { transcript, sentence } = req.body

    // Validate input
    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ score: 0, note: 'Transcript is required' })
    }

    if (!sentence || typeof sentence !== 'string') {
      return res.status(400).json({ score: 0, note: 'Target sentence is required' })
    }

    const trimmedTranscript = transcript.trim()
    const trimmedSentence = sentence.trim()

    if (trimmedTranscript.length < 2) {
      return res.status(400).json({ score: 0, note: 'No speech was captured — unable to evaluate.' })
    }

    if (trimmedTranscript.length > 2000 || trimmedSentence.length > 2000) {
      return res.status(400).json({ score: 0, note: 'Input too long' })
    }

    console.log('[analyse-speech] Request received:', { transcriptLength: trimmedTranscript.length, sentenceLength: trimmedSentence.length })

    const result = await analyseWithAI(trimmedTranscript, trimmedSentence)
    return res.status(200).json(result)
  } catch (error) {
    console.error('[analyse-speech] Unexpected error:', error)
    return res.status(500).json({ score: 0, note: 'Server error during analysis' })
  }
}

async function analyseWithAI(transcript: string, sentence: string): Promise<SpeechResponse> {
  const prompt = `You are a clinical speech-language pathologist evaluating speech reading.

TARGET: "${sentence}"
TRANSCRIPT: "${transcript}"

Score 1-5:
- 5: Perfect or nearly perfect/fluent
- 4: Most words correct, missed 1-2 small words
- 3: Main content correct, missed several words
- 2: Only partial meaning, clearly struggled
- 1: Very few correct words
- 0: Completely different or nothing

Be GENEROUS - reward what was read correctly.

Reply ONLY with JSON: {"score":N,"note":"one clinical sentence about accuracy"}`

  try {
    if (!process.env.GROQ_API_KEY) {
      console.warn('[analyse-speech] GROQ_API_KEY not set, using fallback scoring')
      return fallbackScore(transcript, sentence)
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!response.ok) {
      console.error('[analyse-speech] API error:', response.status)
      return fallbackScore(transcript, sentence)
    }

    const data = await response.json()
    const txt = data.choices?.[0]?.message?.content || data.content?.map((c: any) => c.text || '').join('') || '{}'
    const clean = txt.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    let score = Math.max(0, Math.min(5, parseInt(String(parsed.score || 0))))
    const wordCount = transcript.split(/\s+/).length

    // Safety: if they said real words, minimum 1
    if (score === 0 && wordCount >= 2) score = 1

    return {
      score,
      note: parsed.note || 'Speech evaluation complete.'
    }
  } catch (error) {
    console.error('[analyse-speech] AI analysis failed:', error)
    return fallbackScore(transcript, sentence)
  }
}

function fallbackScore(transcript: string, sentence: string): SpeechResponse {
  const targetWords = sentence.toLowerCase().replace(/[.,!?]/g, '').split(/\s+/).filter((w: string) => w.length > 2)
  const transcriptLower = transcript.toLowerCase().replace(/[.,!?]/g, '')
  const matched = targetWords.filter((w: string) => transcriptLower.includes(w)).length
  const pct = targetWords.length > 0 ? matched / targetWords.length : 0

  const score = pct >= 0.85 ? 5
             : pct >= 0.70 ? 4
             : pct >= 0.50 ? 3
             : pct >= 0.25 ? 2
             : transcript.trim().length > 3 ? 1 : 0

  return {
    score,
    note: `Speech matched approximately ${Math.round(pct * 100)}% of target words.`
  }
}
