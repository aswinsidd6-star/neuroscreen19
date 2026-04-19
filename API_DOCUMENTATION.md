# API Documentation: Comprehensive Assessment Endpoint

## Endpoint
```
POST /api/comprehensive-assessment
```

---

## Overview

The comprehensive assessment endpoint provides advanced cognitive analysis by combining:
- Domain-based MMSE scoring
- Alzheimer-specific pattern detection
- Risk assessment with recommendations
- Age-normalized interpretation
- Clinical report generation

This endpoint runs in parallel with existing scoring and adds no latency to the assessment flow.

---

## Request

### URL
```
POST /api/comprehensive-assessment
```

### Headers
```
Content-Type: application/json
```

### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `answers` | Object | ✅ Yes | Complete test answer object from assessment |
| `patientName` | String | ✅ Yes | Patient's full name (for report) |
| `patientAge` | Number | ✅ Yes | Patient's age in years (integer) |
| `patientEducation` | Number | ⭕ No | Years of education (default: 12) |

### Example Request

```bash
curl -X POST http://localhost:3000/api/comprehensive-assessment \
  -H "Content-Type: application/json" \
  -d '{
    "answers": {
      "name": "John Doe",
      "age": "72",
      "gender": "Male",
      "orient_year": "2024",
      "orient_month": "january",
      "orient_day": "monday",
      "orient_date": "15",
      "orient_place": "hospital",
      "location_state": "california",
      "memory_plant_repeat": "apple table penny",
      "s7_1": "93",
      "s7_2": "86",
      "s7_3": "79",
      "s7_4": "72",
      "s7_5": "65",
      "name_pencil": "pencil",
      "name_watch": "watch",
      "name_key": "key",
      "name_scissors": "scissors",
      "name_thermometer": "thermometer",
      "name_compass": "compass",
      "clock_score": "5",
      "pentagon_score": "2",
      "animal_fluency_count": "18",
      "letter_fluency_count": "15",
      "speech_record": "3",
      "memory_recall": "apple table penny",
      "sr_forgot": "insurance documents",
      "_word_set": "[\"Apple\",\"Table\",\"Penny\"]",
      "_serial_answers": "[93,86,79,72,65]",
      "_digit_answers": "[\"42\",\"375\",\"8421\",\"72493\"]",
      "_letter_used": "F",
      "_story_text": "Maria went to the market...",
      "_story_name": "Maria",
      "_picture_desc": "A woman at sink with child reaching for jar...",
      "_picture_name": "Kitchen - Cookie Theft"
    },
    "patientName": "John Doe",
    "patientAge": 72,
    "patientEducation": 14
  }'
```

### JavaScript/TypeScript Example

```typescript
const response = await fetch('/api/comprehensive-assessment', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    answers: completeAnswersObject,
    patientName: 'John Doe',
    patientAge: 72,
    patientEducation: 14
  })
})

const data = await response.json()
```

---

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "domainScores": {
    "orientation": 6,
    "registration": 3,
    "attention": 5,
    "recall": 4,
    "language": 7,
    "visuospatial": 4,
    "executive": 3,
    "speech": 3
  },
  "totalScore": 35,
  "percentile": 88,
  "patterns": {
    "patterns": [
      {
        "name": "Memory Decline",
        "score": 7,
        "risk": "low",
        "indicators": [
          "Normal delayed recall",
          "Good cue responsiveness"
        ]
      },
      {
        "name": "Executive Function Impairment",
        "score": 3,
        "risk": "low",
        "indicators": [
          "Normal verbal fluency"
        ]
      },
      {
        "name": "Language/Naming Difficulty",
        "score": 7,
        "risk": "low",
        "indicators": []
      },
      {
        "name": "Visuospatial Impairment",
        "score": 4,
        "risk": "low",
        "indicators": []
      },
      {
        "name": "Disorientation",
        "score": 6,
        "risk": "low",
        "indicators": []
      }
    ],
    "primaryRisk": "low",
    "keyFindings": []
  },
  "riskAssessment": {
    "overallRisk": 12,
    "category": "normal",
    "riskFactors": {
      "memoryRisk": 25,
      "executiveRisk": 25,
      "languageRisk": 12,
      "visuospatialRisk": 20,
      "orientationRisk": 0
    },
    "recommendations": [
      "Continue regular cognitive activities and exercise",
      "Maintain healthy diet and sleep patterns",
      "Routine annual cognitive screening recommended"
    ],
    "followUpTimeframe": "12 months"
  },
  "normalization": {
    "ageGroup": "70-74",
    "normScore": 28,
    "percentileFinal": 90,
    "expectedScore": 26,
    "deviation": 2
  },
  "report": {
    "reportId": "NSR-XY2A5NZ-K8P92M",
    "createdDate": "2024-01-15",
    "patientInfo": {
      "name": "John Doe",
      "age": 72,
      "education": 14,
      "testDate": "2024-01-15"
    },
    "testResults": {
      "domainScores": { /* ... */ },
      "totalScore": 35,
      "percentile": 88,
      "normalizedData": { /* ... */ },
      "patterns": { /* ... */ },
      "riskAssessment": { /* ... */ }
    },
    "clinicalInterpretation": "Cognitive Assessment Results: ...",
    "recommendations": [ /* ... */ ],
    "impressionSummary": "IMPRESSION: NORMAL COGNITION\n\nScore: 35/30 percentile..."
  },
  "reportText": "============================================================\nNEUROPSYCHOLOGICAL ASSESSMENT REPORT\n============================================================\n\nREPORT ID: NSR-XY2A5NZ-K8P92M\nDATE: 2024-01-15\n..."
}
```

### Error Response (400/500)

```json
{
  "success": false,
  "error": "Missing required fields: patientName, patientAge"
}
```

---

## Response Fields

### Top Level
- **success** (boolean): Operation success indicator
- **error** (string): Error message if success=false
- **domainScores** (object): 8 domain scores (0-30 total)
- **totalScore** (number): Aggregated score
- **percentile** (number): Raw percentile (0-100)
- **patterns** (object): Alzheimer pattern analysis
- **riskAssessment** (object): Risk scoring & recommendations
- **normalization** (object): Age-adjusted metrics
- **report** (object): Complete structured report
- **reportText** (string): PDF-ready report text

### Domain Scores
```json
{
  "orientation": 0-6,
  "registration": 0-3,
  "attention": 0-5,
  "recall": 0-4,
  "language": 0-8,
  "visuospatial": 0-5,
  "executive": 0-4,
  "speech": 0-3
}
```

### Patterns Object
```json
{
  "patterns": [
    {
      "name": "string (pattern name)",
      "score": "number (domain score)",
      "risk": "low|moderate|high",
      "indicators": ["array of findings"]
    }
  ],
  "primaryRisk": "low|moderate|high",
  "keyFindings": ["array of 3 key findings"]
}
```

### Risk Assessment Object
```json
{
  "overallRisk": 0-100,
  "category": "normal|mild_cognitive_decline|moderate_decline|significant_decline",
  "riskFactors": {
    "memoryRisk": 0-100,
    "executiveRisk": 0-100,
    "languageRisk": 0-100,
    "visuospatialRisk": 0-100,
    "orientationRisk": 0-100
  },
  "recommendations": ["array of 3+ clinical recommendations"],
  "followUpTimeframe": "string (e.g., '12 months')"
}
```

### Normalization Object
```json
{
  "ageGroup": "string (e.g., '70-74')",
  "normScore": "number (age-adjusted)",
  "percentileFinal": "number (0-100)",
  "expectedScore": "number (expected for age)",
  "deviation": "number (actual - expected)"
}
```

### Report Object
```json
{
  "reportId": "string (NSR-TIMESTAMP-RANDOM)",
  "createdDate": "string (ISO date)",
  "patientInfo": {
    "name": "string",
    "age": "number",
    "education": "number",
    "testDate": "string"
  },
  "testResults": {
    "domainScores": {},
    "totalScore": "number",
    "percentile": "number",
    "normalizedData": {},
    "patterns": {},
    "riskAssessment": {}
  },
  "clinicalInterpretation": "string (detailed analysis)",
  "recommendations": ["array"],
  "impressionSummary": "string (clinical summary)"
}
```

---

## Error Codes

| Code | Error | Cause | Solution |
|------|-------|-------|----------|
| 400 | Missing required fields | Missing `answers`, `patientName`, or `patientAge` | Include all required fields |
| 405 | Method not allowed | Using GET instead of POST | Use POST method |
| 500 | Internal server error | Unexpected error in processing | Check server logs, retry |

---

## Rate Limits

- No built-in rate limiting
- Recommended: 100 req/second per IP
- Implement application-level throttling if needed

---

## Performance

- **Typical Response Time**: 50-150ms
- **Max Response Time**: <500ms
- **Payload Size**: Response ~50KB JSON

---

## Integration Examples

### React Component

```typescript
import { useState } from 'react'

export function ComprehensiveAssessment({ answers, patientName, patientAge }) {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const analyze = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/comprehensive-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          patientName,
          patientAge
        })
      })
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error)
      }
      
      setResults(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button onClick={analyze} disabled={loading}>
        {loading ? 'Analyzing...' : 'Run Comprehensive Assessment'}
      </button>
      
      {error && <div className="error">{error}</div>}
      
      {results && (
        <div>
          <h2>Assessment Results</h2>
          <p>Overall Risk: {results.riskAssessment.overallRisk}/100</p>
          <p>Category: {results.riskAssessment.category}</p>
          <p>Total Score: {results.totalScore}/30</p>
          <p>Percentile: {results.percentile}%</p>
        </div>
      )}
    </div>
  )
}
```

### Python Example

```python
import requests
import json

def run_comprehensive_assessment(answers, patient_name, patient_age):
    url = "http://localhost:3000/api/comprehensive-assessment"
    
    payload = {
        "answers": answers,
        "patientName": patient_name,
        "patientAge": patient_age
    }
    
    response = requests.post(
        url,
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code == 200:
        data = response.json()
        if data['success']:
            return data
        else:
            raise Exception(data['error'])
    else:
        raise Exception(f"HTTP {response.status_code}: {response.text}")

# Usage
results = run_comprehensive_assessment(answers, "John Doe", 72)
print(f"Risk Score: {results['riskAssessment']['overallRisk']}")
print(f"Category: {results['riskAssessment']['category']}")
```

---

## Testing

### Test with cURL
```bash
curl -X POST http://localhost:3000/api/comprehensive-assessment \
  -H "Content-Type: application/json" \
  -d @test_payload.json
```

### Test with Postman
1. Create POST request to `http://localhost:3000/api/comprehensive-assessment`
2. Set Header: `Content-Type: application/json`
3. Paste request body from example above
4. Send

### Test with TypeScript
```typescript
// test.ts
import fetch from 'node-fetch'

async function test() {
  const response = await fetch('http://localhost:3000/api/comprehensive-assessment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      answers: { /* ... */ },
      patientName: 'Test Patient',
      patientAge: 65
    })
  })
  
  const data = await response.json()
  console.log(JSON.stringify(data, null, 2))
}

test()
```

---

## Changelog

### Version 2.0 (Current)
- ✅ Initial release of comprehensive assessment endpoint
- ✅ 8-domain cognitive scoring
- ✅ Alzheimer pattern detection
- ✅ Risk assessment with recommendations
- ✅ Age-based normalization
- ✅ Clinical report generation

---

## Support

For issues or questions:
1. Check `COMPREHENSIVE_ASSESSMENT_GUIDE.md` for detailed info
2. Check `QUICK_START.md` for usage examples
3. Review server logs for error details
4. Verify request format matches examples

---

**API Version**: 2.0  
**Last Updated**: 2024  
**Status**: Production Ready ✅
