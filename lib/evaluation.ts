// Efficient and comprehensive evaluation engine for neuropsychological testing

export interface ComponentScore {
  name: string;
  score: number;
  max: number;
  passed: boolean;
}

export interface TestResult {
  testId: string;
  testName: string;
  domain: string;
  score: number;
  maxScore: number;
  percentage: number;
  status: 'normal' | 'mild' | 'moderate' | 'severe';
  components: ComponentScore[];
  interpretation: string;
}

export interface CognitiveProfile {
  totalScore: number;
  maxScore: number;
  overallPercentage: number;
  overallStatus: string;
  testResults: TestResult[];
  domainScores: Record<string, { score: number; max: number; percentage: number }>;
  keyFindings: string[];
  recommendations: string[];
  clinicalSummary: string;
}

export function evaluateAllTests(answers: Record<string, any>): CognitiveProfile {
  const testResults: TestResult[] = [];
  const domainScores: Record<string, { score: number; max: number; percentage: number }> = {
    orientation: { score: 0, max: 0, percentage: 0 },
    attention: { score: 0, max: 0, percentage: 0 },
    memory: { score: 0, max: 0, percentage: 0 },
    language: { score: 0, max: 0, percentage: 0 },
    visuospatial: { score: 0, max: 0, percentage: 0 },
  };

  // ───── ORIENTATION TEST ─────
  const now = new Date();
  const orientComponents: ComponentScore[] = [
    { name: 'Year', score: answers.orient_year?.trim() === String(now.getFullYear()) ? 1 : 0, max: 1, passed: answers.orient_year?.trim() === String(now.getFullYear()) },
    { name: 'Month', score: answers.orient_month?.trim().toLowerCase() === now.toLocaleString('en', { month: 'long' }).toLowerCase() ? 1 : 0, max: 1, passed: answers.orient_month?.trim().toLowerCase() === now.toLocaleString('en', { month: 'long' }).toLowerCase() },
    { name: 'Day', score: answers.orient_day?.trim().toLowerCase() === now.toLocaleString('en', { weekday: 'long' }).toLowerCase() ? 1 : 0, max: 1, passed: answers.orient_day?.trim().toLowerCase() === now.toLocaleString('en', { weekday: 'long' }).toLowerCase() },
    { name: 'Date', score: answers.orient_date?.trim() === String(now.getDate()) ? 1 : 0, max: 1, passed: answers.orient_date?.trim() === String(now.getDate()) },
    { name: 'Place', score: (answers.orient_place || '').trim().length > 1 ? 1 : 0, max: 1, passed: (answers.orient_place || '').trim().length > 1 },
  ];
  testResults.push(createTestResult('orientation', 'Orientation to Time & Place', 'orientation', orientComponents));
  updateDomainScore(domainScores, 'orientation', orientComponents);

  // ───── SERIAL 7s TEST ─────
  const serialCorrect = answers._serial_answers ? JSON.parse(answers._serial_answers) : [93, 86, 79, 72, 65];
  const serialComponents: ComponentScore[] = [
    { name: '100-7', score: parseInt(answers.s7_1) === serialCorrect[0] ? 1 : 0, max: 1, passed: parseInt(answers.s7_1) === serialCorrect[0] },
    { name: '93-7', score: parseInt(answers.s7_2) === serialCorrect[1] ? 1 : 0, max: 1, passed: parseInt(answers.s7_2) === serialCorrect[1] },
    { name: '86-7', score: parseInt(answers.s7_3) === serialCorrect[2] ? 1 : 0, max: 1, passed: parseInt(answers.s7_3) === serialCorrect[2] },
    { name: '79-7', score: parseInt(answers.s7_4) === serialCorrect[3] ? 1 : 0, max: 1, passed: parseInt(answers.s7_4) === serialCorrect[3] },
    { name: '72-7', score: parseInt(answers.s7_5) === serialCorrect[4] ? 1 : 0, max: 1, passed: parseInt(answers.s7_5) === serialCorrect[4] },
  ];
  testResults.push(createTestResult('serial7s', 'Serial 7s Subtraction', 'attention', serialComponents));
  updateDomainScore(domainScores, 'attention', serialComponents);

  // ───── DIGIT SPAN BACKWARD TEST ─────
  const digitCorrect = answers._digit_answers ? JSON.parse(answers._digit_answers) : { d2: '42', d3: '375', d4: '8421', d5: '72491' };
  const digitComponents: ComponentScore[] = [
    { name: '2-digit', score: (answers.dsb_2 || '').replace(/[\s\-,.]/g, '') === digitCorrect.d2 ? 1 : 0, max: 1, passed: (answers.dsb_2 || '').replace(/[\s\-,.]/g, '') === digitCorrect.d2 },
    { name: '3-digit', score: (answers.dsb_3 || '').replace(/[\s\-,.]/g, '') === digitCorrect.d3 ? 1 : 0, max: 1, passed: (answers.dsb_3 || '').replace(/[\s\-,.]/g, '') === digitCorrect.d3 },
    { name: '4-digit', score: (answers.dsb_4 || '').replace(/[\s\-,.]/g, '') === digitCorrect.d4 ? 1 : 0, max: 1, passed: (answers.dsb_4 || '').replace(/[\s\-,.]/g, '') === digitCorrect.d4 },
    { name: '5-digit', score: (answers.dsb_5 || '').replace(/[\s\-,.]/g, '') === digitCorrect.d5 ? 1 : 0, max: 1, passed: (answers.dsb_5 || '').replace(/[\s\-,.]/g, '') === digitCorrect.d5 },
  ];
  testResults.push(createTestResult('digitspan', 'Digit Span (Backward)', 'attention', digitComponents));
  updateDomainScore(domainScores, 'attention', digitComponents);

  // ───── NAMING TEST ─────
  const namingComponents: ComponentScore[] = [
    { name: 'Pencil', score: (answers.name_pencil || '').toLowerCase().includes('pencil') ? 1 : 0, max: 1, passed: (answers.name_pencil || '').toLowerCase().includes('pencil') },
    { name: 'Watch', score: (answers.name_watch || '').toLowerCase().match(/watch|clock/) ? 1 : 0, max: 1, passed: !!(answers.name_watch || '').toLowerCase().match(/watch|clock/) },
    { name: 'Key', score: (answers.name_key || '').toLowerCase().match(/key|keys/) ? 1 : 0, max: 1, passed: !!(answers.name_key || '').toLowerCase().match(/key|keys/) },
    { name: 'Scissors', score: (answers.name_scissors || '').toLowerCase().match(/scissor/) ? 1 : 0, max: 1, passed: !!(answers.name_scissors || '').toLowerCase().match(/scissor/) },
    { name: 'Thermometer', score: (answers.name_thermometer || '').toLowerCase().match(/thermo/) ? 1 : 0, max: 1, passed: !!(answers.name_thermometer || '').toLowerCase().match(/thermo/) },
    { name: 'Compass', score: (answers.name_compass || '').toLowerCase().match(/compass/) ? 1 : 0, max: 1, passed: !!(answers.name_compass || '').toLowerCase().match(/compass/) },
  ];
  testResults.push(createTestResult('naming', 'Boston Naming Test', 'language', namingComponents));
  updateDomainScore(domainScores, 'language', namingComponents);

  // ───── WORD RECALL TEST ─────
  const wordSet = answers._word_set ? JSON.parse(answers._word_set) : ['Apple', 'Table', 'Penny'];
  const freeRecall = (answers.memory_recall || '').toLowerCase();
  const cuedRecall = (answers.cued_recall || '').toLowerCase();
  const freeCount = wordSet.filter((w: string) => freeRecall.includes(w.toLowerCase())).length;
  const cuedCount = wordSet.filter((w: string) => cuedRecall.includes(w.toLowerCase())).length;
  
  const wordComponents: ComponentScore[] = [
    { name: 'Free Recall', score: freeCount, max: 3, passed: freeCount >= 2 },
    { name: 'Cued Recall', score: cuedCount, max: 3, passed: cuedCount >= 2 },
  ];
  testResults.push(createTestResult('wordrecall', 'Word Recall (Hippocampal)', 'memory', wordComponents));
  updateDomainScore(domainScores, 'memory', wordComponents);

  // ───── STORY RECALL TEST ─────
  const storyComponents: ComponentScore[] = [
    { name: 'Protagonist Name', score: (answers.sr_name || '').toLowerCase().match(/maria|james|priya/) ? 1 : 0, max: 1, passed: !!(answers.sr_name || '').toLowerCase().match(/maria|james|priya/) },
    { name: 'Day of Week', score: (answers.sr_day || '').toLowerCase().match(/monday|tuesday|friday/) ? 1 : 0, max: 1, passed: !!(answers.sr_day || '').toLowerCase().match(/monday|tuesday|friday/) },
    { name: 'What Forgotten', score: (answers.sr_forgot || '').toLowerCase().match(/list|shopping|card|document/) ? 1 : 0, max: 1, passed: !!(answers.sr_forgot || '').toLowerCase().match(/list|shopping|card|document/) },
    { name: 'Person Met', score: (answers.sr_neighbour || '').toLowerCase().match(/john|sarah|raju/) ? 1 : 0, max: 1, passed: !!(answers.sr_neighbour || '').toLowerCase().match(/john|sarah|raju/) },
    { name: 'No Intrusions', score: answers.intrusion_check === 'No, the story did not mention money' ? 1 : 0, max: 1, passed: answers.intrusion_check === 'No, the story did not mention money' },
  ];
  testResults.push(createTestResult('storyrecall', 'Story Recall (Episodic)', 'memory', storyComponents));
  updateDomainScore(domainScores, 'memory', storyComponents);

  // ───── FLUENCY TEST ─────
  const animalCount = parseInt(answers.animal_fluency_count || '0');
  const letterCount = parseInt(answers.letter_fluency_count || '0');
  const fluencyComponents: ComponentScore[] = [
    { name: `Animals (${animalCount})`, score: Math.min(animalCount, 25), max: 25, passed: animalCount >= 14 },
    { name: `Letter Words (${letterCount})`, score: Math.min(letterCount, 20), max: 20, passed: letterCount >= 10 },
  ];
  testResults.push(createTestResult('fluency', 'Verbal Fluency (Semantic)', 'language', fluencyComponents));
  updateDomainScore(domainScores, 'language', fluencyComponents);

  // ───── PENTAGON DRAWING TEST ─────
  const pentScore = parseInt(answers.pentagon_score || '0');
  const pentComponents: ComponentScore[] = [
    { name: 'Overlap', score: pentScore >= 1 ? 1 : 0, max: 1, passed: pentScore >= 1 },
    { name: '5 Sides', score: pentScore >= 2 ? 1 : 0, max: 1, passed: pentScore >= 2 },
    { name: 'Tremor Control', score: pentScore >= 3 ? 1 : 0, max: 1, passed: pentScore >= 3 },
    { name: 'Rotation OK', score: pentScore >= 4 ? 1 : 0, max: 1, passed: pentScore >= 4 },
    { name: 'Perfect Copy', score: pentScore === 5 ? 1 : 0, max: 1, passed: pentScore === 5 },
  ];
  testResults.push(createTestResult('pentagon', 'Pentagon Drawing', 'visuospatial', pentComponents));
  updateDomainScore(domainScores, 'visuospatial', pentComponents);

  // ───── CLOCK DRAWING TEST ─────
  const clockScore = parseInt(answers.clock_score || '0');
  const clockComponents: ComponentScore[] = [
    { name: 'Circle', score: clockScore >= 1 ? 1 : 0, max: 1, passed: clockScore >= 1 },
    { name: 'Numbers', score: clockScore >= 2 ? 1 : 0, max: 1, passed: clockScore >= 2 },
    { name: 'Position', score: clockScore >= 3 ? 1 : 0, max: 1, passed: clockScore >= 3 },
    { name: 'Hands', score: clockScore >= 4 ? 1 : 0, max: 1, passed: clockScore >= 4 },
    { name: 'Time Correct', score: clockScore === 5 ? 1 : 0, max: 1, passed: clockScore === 5 },
  ];
  testResults.push(createTestResult('clock', 'Clock Drawing (Executive)', 'visuospatial', clockComponents));
  updateDomainScore(domainScores, 'visuospatial', clockComponents);

  // ───── PICTURE DESCRIPTION TEST ─────
  const pictDesc = (answers.picture_describe || '');
  const pictComponents: ComponentScore[] = [
    { name: 'Scene Recognized', score: pictDesc.length > 20 ? 1 : 0, max: 1, passed: pictDesc.length > 20 },
    { name: 'Details Mentioned', score: pictDesc.length > 50 ? 1 : 0, max: 1, passed: pictDesc.length > 50 },
    { name: 'Coherent Narration', score: pictDesc.length > 80 ? 1 : 0, max: 1, passed: pictDesc.length > 80 },
  ];
  testResults.push(createTestResult('picture', 'Picture Description', 'language', pictComponents));
  updateDomainScore(domainScores, 'language', pictComponents);

  // ───── PROSPECTIVE MEMORY TEST ─────
  const prospComponents: ComponentScore[] = [
    { name: 'Remembered Instruction', score: answers.prospective_memory === 'remembered' ? 1 : 0, max: 1, passed: answers.prospective_memory === 'remembered' },
  ];
  testResults.push(createTestResult('prospective', 'Prospective Memory', 'memory', prospComponents));
  updateDomainScore(domainScores, 'memory', prospComponents);

  // ───── ADL (Functional) TEST ─────
  const adlComponents: ComponentScore[] = [
    { name: 'Medication', score: answers.adl_medicine === 'no' ? 1 : 0, max: 1, passed: answers.adl_medicine === 'no' },
    { name: 'Money', score: answers.adl_money === 'no' ? 1 : 0, max: 1, passed: answers.adl_money === 'no' },
    { name: 'Cooking', score: answers.adl_cooking === 'no' ? 1 : 0, max: 1, passed: answers.adl_cooking === 'no' },
    { name: 'Navigation', score: answers.adl_lostway === 'no' ? 1 : 0, max: 1, passed: answers.adl_lostway === 'no' },
    { name: 'Technology', score: answers.adl_phone === 'no' ? 1 : 0, max: 1, passed: answers.adl_phone === 'no' },
  ];
  testResults.push(createTestResult('adl', 'Functional Abilities (ADL)', 'attention', adlComponents));
  updateDomainScore(domainScores, 'attention', adlComponents);

  // ───── CALCULATE OVERALL SCORES ─────
  const totalScore = testResults.reduce((sum, t) => sum + t.score, 0);
  const maxScore = testResults.reduce((sum, t) => sum + t.maxScore, 0);
  const overallPercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  let overallStatus = 'NORMAL';
  if (overallPercentage >= 85) overallStatus = 'NORMAL - Excellent cognitive function';
  else if (overallPercentage >= 70) overallStatus = 'MILD - Age-related changes only';
  else if (overallPercentage >= 55) overallStatus = 'MODERATE - Clinically significant impairment';
  else overallStatus = 'SEVERE - Substantial cognitive decline';

  const keyFindings = generateKeyFindings(testResults, freeCount, cuedCount);
  const recommendations = generateRecommendations(testResults, domainScores);
  const clinicalSummary = generateClinicalSummary(totalScore, maxScore, overallPercentage, keyFindings);

  return {
    totalScore,
    maxScore,
    overallPercentage,
    overallStatus,
    testResults,
    domainScores,
    keyFindings,
    recommendations,
    clinicalSummary,
  };
}

function createTestResult(id: string, name: string, domain: string, components: ComponentScore[]): TestResult {
  const score = components.reduce((sum, c) => sum + c.score, 0);
  const max = components.reduce((sum, c) => sum + c.max, 0);
  const percentage = max > 0 ? Math.round((score / max) * 100) : 0;

  let status: 'normal' | 'mild' | 'moderate' | 'severe' = 'normal';
  if (percentage >= 85) status = 'normal';
  else if (percentage >= 70) status = 'mild';
  else if (percentage >= 55) status = 'moderate';
  else status = 'severe';

  const interpretations: Record<string, string> = {
    normal: 'Normal performance.',
    mild: 'Mild reduction.',
    moderate: 'Moderate impairment.',
    severe: 'Severe impairment.',
  };

  return { testId: id, testName: name, domain, score, maxScore: max, percentage, status, components, interpretation: interpretations[status] };
}

function updateDomainScore(domainScores: Record<string, any>, domain: string, components: ComponentScore[]): void {
  domainScores[domain].score += components.reduce((sum, c) => sum + c.score, 0);
  domainScores[domain].max += components.reduce((sum, c) => sum + c.max, 0);
  domainScores[domain].percentage = domainScores[domain].max > 0 ? Math.round((domainScores[domain].score / domainScores[domain].max) * 100) : 0;
}

function generateKeyFindings(tests: TestResult[], freeRecall: number, cuedRecall: number): string[] {
  const findings: string[] = [];

  const worstTest = tests.reduce((min, t) => t.percentage < min.percentage ? t : min);
  if (worstTest.percentage < 70) findings.push(`CONCERN: ${worstTest.testName} significantly impaired (${worstTest.percentage}%)`);

  if (cuedRecall > freeRecall + 1) findings.push('PATTERN: Memory improves with cues - retrieval problem, not encoding');
  if (freeRecall <= 1 && cuedRecall <= 1) findings.push('PATTERN: Memory fails both free and cued - encoding problem, hippocampal concern');

  const fluencyTest = tests.find(t => t.testId === 'fluency');
  if (fluencyTest && fluencyTest.components[0].score < fluencyTest.components[1].score) {
    findings.push('PATTERN: Letter fluency better than category - atypical, consider non-Alzheimer\'s cause');
  }

  return findings;
}

function generateRecommendations(tests: TestResult[], domains: Record<string, any>): string[] {
  const recommendations: string[] = [];
  const failedDomains = Object.entries(domains).filter(([_, scores]) => scores.percentage < 70);
  const failedTests = tests.filter(t => t.percentage < 70);

  if (failedTests.length > 0) {
    recommendations.push(`Plan neuropsychological evaluation for: ${failedTests.map(t => t.testName).join(', ')}`);
  }

  if (failedDomains.length > 0) {
    recommendations.push(`Specialist assessment needed for: ${failedDomains.map(([d]) => d.toUpperCase()).join(', ')}`);
  }

  if (recommendations.length === 0) {
    recommendations.push('Continue annual cognitive health monitoring.');
  }

  return recommendations;
}

function generateClinicalSummary(score: number, max: number, percentage: number, findings: string[]): string {
  let summary = `Cognitive Score: ${score}/${max} (${percentage}%). `;
  summary += findings.length > 0 ? `Key Findings: ${findings[0]}` : 'No critical impairments detected.';
  return summary;
}
