import type { NextApiRequest, NextApiResponse } from 'next'

type AnalyseResponse = {
  score: number
  note: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalyseResponse>
) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ score: 0, note: 'Method not allowed' })
    }

    const { description, type } = req.body

    // Validate input
    if (!description || typeof description !== 'string') {
      return res.status(400).json({ score: 0, note: 'Description is required' })
    }

    const trimmedDesc = description.trim()
    if (trimmedDesc.length === 0) {
      return res.status(400).json({ score: 0, note: 'No description was provided.' })
    }

    // Limit text size to prevent abuse
    const MAX_DESC_LENGTH = 2000
    if (trimmedDesc.length > MAX_DESC_LENGTH) {
      return res.status(400).json({ score: 0, note: 'Description too long' })
    }

    if (!type || typeof type !== 'string' || !['picture', 'clock', 'pentagon'].includes(type)) {
      return res.status(400).json({ score: 0, note: 'Invalid test type' })
    }

    console.log('[analyse-picture] Request received:', { type, descriptionLength: trimmedDesc.length })
    const result = await analyseWithAI(trimmedDesc, type)
    return res.status(200).json(result)
  } catch (error) {
    console.error('[analyse-picture] Unexpected error:', error)
    return res.status(500).json({ score: 0, note: 'Server error during analysis' })
  }
}

async function analyseWithAI(description: string, type: string): Promise<AnalyseResponse> {
  let prompt = ''

  if (type === 'picture') {
    prompt = `You are a clinical neuropsychologist scoring the Boston Cookie Theft Picture Description Test for an INDIAN POPULATION screening test.

The picture shows a kitchen scene:
- A WOMAN at a sink washing/drying dishes
- The sink is OVERFLOWING — water spilling onto the floor
- A BOY standing on a STOOL reaching up stealing COOKIES from a jar in a cupboard
- The STOOL is tipping/falling over
- A GIRL standing watching the boy
- A WINDOW on the wall
- DISHES and plates visible

Patient said: "${description}"

IMPORTANT CONTEXT:
- Patients may be elderly, uneducated, or describe in broken English
- Patients may use Indian English ("aunty", "amma", "child", "small boy", "vessel", "tumbler", "biscuits" instead of cookies)
- Short answers are okay — score based on what they noticed, not how they said it
- Even one correct observation deserves a score of 1

SCORE 1 TO 5 — here are MANY examples for each level so you understand the range:

SCORE 5 — Rich, detailed description. Mentioned 6 or more elements. Described actions, relationships, problems.
SCORE 4 — Good description. Mentioned 4-5 elements. Got main actions but missed 1-2 things.
SCORE 3 — Noticed main story. Mentioned 3 elements. Got the key idea but missed several details.
SCORE 2 — Basic observation. Mentioned 1-2 things but vague or incomplete.
SCORE 1 — Very vague. Only mentioned the setting or one very general thing. No specific details.
SCORE 0 — Blank, completely off-topic, or says they cannot see anything.

Be GENEROUS and FAIR. When in doubt, give the HIGHER score.
Short answers that correctly identify the main scene elements should score 3.

Reply ONLY with JSON (no markdown, no extra text):
{"score":N,"note":"one warm clinical sentence acknowledging what they got right and what was missed"}`
  } else if (type === 'clock') {
    prompt = `You are a clinical neuropsychologist scoring a Clock Drawing Test.

Patient described drawing a clock showing 10:10: "${description}"

SCORE 5: Perfect (circle + all 12 numbers correctly placed + two hands at 10 and 2)
SCORE 4: Nearly perfect (minor issue only)
SCORE 3: Decent attempt (circle and numbers done but hands wrong/missing)
SCORE 2: Partial attempt (circle exists but numbers or hands have major problems)
SCORE 1: Very poor attempt (tried but doesn't look like a clock)
SCORE 0: Could not draw

Reply ONLY with JSON: {"score":N,"note":"one sentence explaining what they drew well and what was wrong"}`
  } else if (type === 'pentagon') {
    prompt = `You are scoring the Intersecting Pentagons test.

Patient described their copy of two overlapping five-sided shapes: "${description}"

SCORE 2: Two five-sided shapes clearly overlapping, resembles original
SCORE 1: Two shapes overlapping but not clearly five-sided, OR five-sided but barely overlap
SCORE 0: Only one shape, no overlap, or could not do it

Reply ONLY with JSON: {"score":N,"note":"one sentence explaining the score"}`
  }

  try {
    if (!process.env.GROQ_API_KEY) {
      console.warn('[analyse-picture] GROQ_API_KEY not set, using fallback scoring')
      return fallbackScore(description, type)
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        max_tokens: 250,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!response.ok) {
      console.error('[analyse-picture] API error:', response.status)
      return fallbackScore(description, type)
    }

    const data = await response.json()
    const txt = data.choices?.[0]?.message?.content || data.content?.map((c: any) => c.text || '').join('') || '{}'
    const clean = txt.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    let finalScore = Math.max(0, Math.min(type === 'pentagon' ? 2 : 5, parseInt(String(parsed.score || 0))))
    const wordCount = description.split(/\s+/).length

    // Safety net
    if (finalScore === 0 && wordCount >= 3) finalScore = 1

    return {
      score: finalScore,
      note: parsed.note || 'Analysis complete.'
    }
  } catch (error) {
    console.error('[analyse-picture] AI analysis failed:', error)
    return fallbackScore(description, type)
  }
}

function fallbackScore(description: string, type: string): AnalyseResponse {
  const desc = description.toLowerCase()

  if (type === 'picture') {
    const elements: string[][] = [
      ['woman', 'lady', 'aunty', 'amma'],
      ['boy', 'child', 'kid'],
      ['cookie', 'biscuit', 'jar'],
      ['stool', 'chair', 'ladder'],
      ['sink', 'tap', 'overflow', 'flood', 'spill'],
      ['girl', 'watching'],
      ['steal', 'taking', 'reaching'],
      ['falling', 'tipping'],
    ]
    const matched = elements.filter(group => group.some((k: string) => desc.includes(k))).length
    const score = matched >= 7 ? 5 : matched >= 5 ? 4 : matched >= 3 ? 3 : matched >= 2 ? 2 : matched >= 1 ? 1 : 0
    return { score, note: `Identified ${matched} scene elements.` }
  } else if (type === 'clock') {
    const hasCircle = /circle|round|oval/.test(desc)
    const hasNumbers = /number|1|2|3|12/.test(desc)
    const hasHands = /hand|arrow|point/.test(desc)
    const score = hasCircle && hasNumbers && hasHands ? 4 : hasCircle && hasNumbers ? 2 : hasCircle ? 1 : 0
    return { score, note: 'Clock drawing evaluated.' }
  } else {
    const hasTwo = /two|both/.test(desc)
    const hasOverlap = /overlap|cross/.test(desc)
    const score = hasTwo && hasOverlap ? 2 : hasTwo ? 1 : 0
    return { score, note: 'Pentagon drawing evaluated.' }
  }
}
