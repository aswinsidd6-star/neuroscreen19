/**
 * MMSE-ENHANCED SCORING SYSTEM
 * Comprehensive cognitive domain assessment
 */

export interface DomainScores {
  orientation: number
  registration: number
  attention: number
  recall: number
  language: number
  visuospatial: number
  executive: number
  speech: number
  [key: string]: number
}

export interface DetailedScoring {
  domains: DomainScores
  total: number
  maxScore: number
  percentile: number
}

/**
 * Calculate domain-based scores from answer set
 */
export function calculateDomainScores(ans: Record<string, string>): DomainScores {
  const now = getNow()
  
  // ORIENTATION DOMAIN /6
  let orientation = 0
  if (ans.orient_year?.trim().toLowerCase() === now.year) orientation++
  if (ans.orient_month?.trim().toLowerCase() === now.month) orientation++
  if (ans.orient_day?.trim().toLowerCase() === now.day) orientation++
  if (ans.orient_date?.trim() === now.date) orientation++
  if ((ans.orient_place || "").trim().length > 1) orientation++
  // Add location point if available
  orientation = Math.min(orientation + (ans.location_state ? 1 : 0), 6)

  // REGISTRATION DOMAIN /3 (immediate memory)
  const registeredWords = ans._word_set ? JSON.parse(ans._word_set) : ["Apple", "Table", "Penny"]
  let registration = 0
  if (ans.memory_plant_repeat) {
    const repeated = (ans.memory_plant_repeat || "").toLowerCase()
    registeredWords.forEach((w: string) => {
      if (repeated.includes(w.toLowerCase())) registration++
    })
  }
  registration = Math.min(registration, 3)

  // ATTENTION DOMAIN /5 (working memory)
  const serialCorrect: number[] = ans._serial_answers
    ? JSON.parse(ans._serial_answers)
    : [93, 86, 79, 72, 65]
  
  let attention = 0
  ;(["s7_1", "s7_2", "s7_3", "s7_4", "s7_5"] as string[]).forEach((k, i) => {
    if (parseInt(ans[k]) === serialCorrect[i]) attention++
  })

  // RECALL DOMAIN /4 (delayed memory)
  const activeWords = registeredWords
  const recalled = (ans.memory_recall || "").toLowerCase()
  let recall = 0
  activeWords.forEach((w: string) => {
    if (recalled.includes(w.toLowerCase())) recall++
  })
  
  // Story recall adds to recall domain
  let storyPoints = 0
  if ((ans.sr_name || "").toLowerCase().includes("maria") ||
      (ans.sr_name || "").toLowerCase().includes("james") ||
      (ans.sr_name || "").toLowerCase().includes("priya")) storyPoints++
  if ((ans.sr_day || "").toLowerCase().match(/tuesday|friday|monday/)) storyPoints++
  if ((ans.sr_forgot || "").toLowerCase().match(/list|card|document|insurance/)) storyPoints++
  recall = Math.min(recall + storyPoints / 2, 4)

  // LANGUAGE DOMAIN /8
  let language = 0
  // Naming (6 objects)
  if ((ans.name_pencil || "").toLowerCase().includes("pencil")) language++
  if ((ans.name_watch || "").toLowerCase().match(/watch|clock/)) language++
  if ((ans.name_key || "").toLowerCase().match(/key|keys/)) language++
  if ((ans.name_scissors || "").toLowerCase().match(/scissor|shears/)) language++
  if ((ans.name_thermometer || "").toLowerCase().match(/thermo|temperature/)) language++
  if ((ans.name_compass || "").toLowerCase().match(/compass|direction/)) language++
  // Command + Writing
  language += (ans.command === "done" ? 1 : 0)
  language += ((ans.writing || "").trim().split(/\s+/).length >= 3 ? 1 : 0)
  language = Math.min(language, 8)

  // VISUOSPATIAL DOMAIN /5
  let visuospatial = 0
  visuospatial += parseInt(ans.clock_score || "0")
  visuospatial += parseInt(ans.pentagon_score || "0")
  visuospatial = Math.min(visuospatial, 5)

  // EXECUTIVE FUNCTION /4
  const fluencyAnimals = parseInt(ans.animal_fluency_count || "0")
  const fluencyLetter = parseInt(ans.letter_fluency_count || "0")
  let executive = 0
  if (fluencyAnimals > 10) executive += 2
  else if (fluencyAnimals > 5) executive += 1
  if (fluencyLetter > 8) executive += 2
  else if (fluencyLetter > 4) executive += 1
  executive = Math.min(executive, 4)

  // SPEECH DOMAIN /3
  const speechScore = parseInt(ans.speech_record || "0")
  const speech = Math.min(speechScore, 3)

  return {
    orientation,
    registration,
    attention,
    recall,
    language,
    visuospatial,
    executive,
    speech,
  }
}

/**
 * Calculate total MMSE-like score
 */
export function calculateTotalScore(domains: DomainScores): number {
  return (
    domains.orientation +
    domains.registration +
    domains.attention +
    domains.recall +
    domains.language +
    domains.visuospatial +
    domains.executive +
    domains.speech
  )
}

/**
 * Map score to percentile
 */
export function scoreToPercentile(score: number, maxScore: number): number {
  return Math.round((score / maxScore) * 100)
}

function getNow() {
  const d = new Date()
  return {
    year: String(d.getFullYear()),
    month: d.toLocaleString("en", { month: "long" }).toLowerCase(),
    day: d.toLocaleString("en", { weekday: "long" }).toLowerCase(),
    date: String(d.getDate()),
  }
}
