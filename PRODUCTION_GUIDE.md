/**
 * NEUROSCREEN PRODUCTION UPGRADE DOCUMENTATION
 * Complete Guide to 12-Phase Production-Grade Architecture
 */

export const PRODUCTION_UPGRADE_GUIDE = `
╔════════════════════════════════════════════════════════════════════════╗
║            NEUROSCREEN COGNITIVE ASSESSMENT SYSTEM                      ║
║              12-PHASE PRODUCTION UPGRADE DOCUMENTATION                  ║
║                         Version 2.0 (Production Ready)                   ║
╚════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════
TABLE OF CONTENTS
═══════════════════════════════════════════════════════════════════════════

1. OVERVIEW
2. ARCHITECTURE
3. IMPLEMENTED PHASES (1-12)
4. SERVICE LAYER REFERENCE
5. DATABASE SCHEMA
6. SECURITY IMPLEMENTATION
7. DEPLOYMENT GUIDE
8. MONITORING & MAINTENANCE
9. TROUBLESHOOTING
10. SUPPORT & UPDATES


═══════════════════════════════════════════════════════════════════════════
1. OVERVIEW
═══════════════════════════════════════════════════════════════════════════

Project: NeuroScreen Cognitive Assessment System v2.0
Purpose: Production-grade cognitive screening tool for Alzheimer's detection
Target Users: Healthcare professionals, clinicians, geriatricians
Status: ✅ FULLY PRODUCTION-GRADE

Key Improvements from v1.0:
  ✓ Modular service-based architecture (no monolithic code)
  ✓ Enterprise-grade authentication & authorization
  ✓ Comprehensive security hardening (CSRF, XSS, encryption)
  ✓ Structured logging with request tracing
  ✓ Multi-tier caching for performance
  ✓ Clinical compliance with disclaimers
  ✓ Professional UI/UX with clinician dashboard
  ✓ Comprehensive test coverage
  ✓ Production deployment readiness

Technology Stack:
  • Framework: Next.js 15.2.8 (React 18 + TypeScript 5)
  • Database: Supabase PostgreSQL
  • Authentication: Supabase Auth + JWT + RBAC
  • AI Integration: Anthropic Claude + Groq fallback
  • Styling: Tailwind CSS 3.4.1
  • Caching: In-memory with TTL
  • Logging: Structured multi-level
  • Security: HTTPS, CORS, Rate limiting, Encryption


═══════════════════════════════════════════════════════════════════════════
2. ARCHITECTURE
═══════════════════════════════════════════════════════════════════════════

CLASSIC LAYERED ARCHITECTURE

┌─────────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER                                              │
│  ├─ Pages: pages/index.tsx, pages/doctor/*                       │
│  ├─ Components: DoctorDashboard, ClinicalDisclaimer              │
│  └─ Styles: Tailwind CSS, global styles                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  API & MIDDLEWARE LAYER                                          │
│  ├─ Endpoints: /api/auth/*, /api/health, /api/ai-summary-v2    │
│  ├─ Middleware: auth.middleware, api.middleware                  │
│  └─ Security: CORS, rate-limiting, request logging              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  SERVICE LAYER (Business Logic)                                  │
│  ├─ AuthService: User authentication & session mgmt              │
│  ├─ ScoringService: Cognitive assessment scoring                 │
│  ├─ AIService: AI analysis with fallback/retry                   │
│  ├─ PatternService: Alzheimer's pattern detection                │
│  ├─ ReportService: Clinical report generation                    │
│  └─ CacheService: Performance optimization                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  REPOSITORY LAYER (Data Access)                                  │
│  ├─ PatientRepository: Patient CRUD & querying                   │
│  ├─ AssessmentRepository: Assessment session mgmt                │
│  ├─ ResultRepository: Score & result storage                     │
│  └─ DoctorRepository: Clinician access control                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  UTILITIES & HELPERS                                             │
│  ├─ Validator: Input validation & sanitization                   │
│  ├─ Logger: Structured logging with request IDs                  │
│  ├─ Security: CSRF, XSS, encryption utilities                    │
│  ├─ Config: Environment validation                               │
│  └─ Helpers: Response formatting, error handling                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  DATA LAYER (Supabase PostgreSQL)                                │
│  ├─ patients: Patient demographics                               │
│  ├─ assessments: Assessment sessions                             │
│  ├─ assessment_results: Scores & analysis                        │
│  ├─ doctors: Clinician profiles                                  │
│  └─ doctor_access_logs: Audit trail                              │
└─────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════
3. IMPLEMENTED PHASES (1-12)
═══════════════════════════════════════════════════════════════════════════

PHASE 1: ARCHITECTURE HARDENING ✅
Status: COMPLETE
Files Created:
  • /types/index.ts - Centralized TypeScript interfaces
  • /utils/logger.ts - Multi-level structured logging
  • /utils/validator.ts - Input validation framework
  • /utils/helpers.ts - Common utilities
  • /middleware/api.middleware.ts - Error handling & security headers
  • /services/scoring.service.ts - Scoring service wrapper
  • /services/ai.service.ts - AI operations with fallback
  • /services/pattern.service.ts - Pattern recognition

Key Features:
  ✓ Strict TypeScript everywhere
  ✓ Centralized type safety
  ✓ Request-scoped logging
  ✓ Comprehensive input validation
  ✓ Service-oriented architecture


PHASE 2: AUTHENTICATION & AUTHORIZATION ✅
Status: COMPLETE
Files Created:
  • /services/auth.service.ts - Supabase Auth wrapper
  • /middleware/auth.middleware.ts - JWT verification & RBAC
  • /pages/api/auth/[action].ts - Auth endpoints
  • /pages/api/ai-summary-v2.ts - Refactored with auth

Key Features:
  ✓ Email/password authentication
  ✓ JWT token management
  ✓ Role-based access control (RBAC)
  ✓ Session management
  ✓ Password reset flow


PHASE 3: SECURITY HARDENING ✅
Status: COMPLETE
Files Created:
  • /utils/security.ts - CSRF, XSS, encryption
  • /utils/config.ts - Environment validation
  • Enhanced .env.example with security docs
  • /pages/api/health.ts - Health check endpoint

Key Features:
  ✓ CSRF token generation/verification
  ✓ XSS sanitization
  ✓ AES-256 encryption
  ✓ Environment variable validation
  ✓ Security headers (CSP, X-Frame-Options)


PHASE 4: DATABASE LAYER IMPROVEMENT ✅
Status: COMPLETE
Files Created:
  • /repositories/patient.repository.ts - Patient CRUD
  • /repositories/assessment.repository.ts - Assessment mgmt
  • /repositories/result.repository.ts - Results storage
  • /repositories/doctor.repository.ts - Clinician access

Key Features:
  ✓ Repository pattern for data access
  ✓ Typed database queries
  ✓ Filtering & pagination
  ✓ Audit trail logging
  ✓ Access control enforcement


PHASE 5: LOGGING SYSTEM ENHANCEMENT ✅
Status: COMPLETE (via /utils/logger.ts)
Features:
  ✓ Multi-level logging (DEBUG, INFO, WARN, ERROR)
  ✓ Request ID tracking
  ✓ Timestamp recording
  ✓ Color-coded console output
  ✓ Ready for: File transport, Sentry integration


PHASE 6: AI RELIABILITY & FALLBACK ✅
Status: COMPLETE (via /services/ai.service.ts)
Features:
  ✓ Automatic retry mechanism (max 2 attempts)
  ✓ Claude API → Groq backup fallback
  ✓ Standardized JSON responses
  ✓ Rule-based scoring fallback
  ✓ Error handling & logging


PHASE 7: PERFORMANCE OPTIMIZATION ✅
Status: COMPLETE
Files Created:
  • /services/cache.service.ts - Multi-tier caching

Key Features:
  ✓ In-memory cache with TTL
  ✓ LRU eviction policy
  ✓ Automatic cleanup
  ✓ Cache statistics & monitoring
  ✓ Cache invalidation patterns


PHASE 8: UI/UX PROFESSIONALIZATION ✅
Status: COMPLETE
Files Created:
  • /components/DoctorDashboard.tsx - Professional dashboard
  • Patient management interface
  • Assessment history view
  • Results filtering & sorting

Key Features:
  ✓ Responsive design (Tailwind CSS)
  ✓ Patient list with real-time filtering
  ✓ Risk level visualization
  ✓ Quick action buttons
  ✓ Modal for new patient creation


PHASE 9: CLINICAL SAFETY & COMPLIANCE ✅
Status: COMPLETE
Files Created:
  • /components/ClinicalDisclaimer.tsx - Disclaimer UI

Key Features:
  ✓ Pre-assessment disclaimer modal
  ✓ Expandable disclaimer banner
  ✓ Clinical report with embedded disclaimers
  ✓ Risk level color-coding
  ✓ HIPAA compliance reminder


PHASE 10: FINAL REPORT SYSTEM ✅
Status: COMPLETE
Files Created:
  • /services/report.service.ts - Report generation

Key Features:
  ✓ Comprehensive clinical report creation
  ✓ Age/education-adjusted scoring
  ✓ Alzheimer's risk index calculation
  ✓ Domain score breakdown
  ✓ Clinical interpretation generation
  ✓ Formatted printing & PDF export ready


PHASE 11: TESTING & STABILITY ✅
Status: COMPLETE
Files Created:
  • /__tests__/neuroscreen.test.ts - Comprehensive test suite

Test Coverage:
  ✓ Validator tests (edge cases, validation logic)
  ✓ Cache service tests (TTL, LRU, statistics)
  ✓ Security utility tests (encryption, sanitization)
  ✓ Scoring service tests (calculation accuracy)
  ✓ Integration tests (end-to-end workflows)
  ✓ Error handling tests


PHASE 12: DEPLOYMENT READINESS ✅
Status: COMPLETE
Files Created:
  • /services/deployment.service.ts - Deployment verification

Key Features:
  ✓ Environment configuration checker
  ✓ Dependency verification
  ✓ Security configuration audit
  ✓ Database connectivity test
  ✓ Build output verification
  ✓ Deployment readiness report


═══════════════════════════════════════════════════════════════════════════
4. SERVICE LAYER REFERENCE
═══════════════════════════════════════════════════════════════════════════

AUTHSERVICE
──────────
Purpose: Handle Supabase authentication & session management
Location: /services/auth.service.ts
Methods:
  • login(email, password) → Promise<AuthSession>
  • register(email, password, userData) → Promise<AuthSession>
  • logout() → Promise<void>
  • resetPassword(email) → Promise<void>
  • getCurrentUser() → Promise<User | null>
  • refreshToken() → Promise<string>

Example Usage:
  const session = await AuthService.login('doctor@hospital.com', 'password')
  console.log(session.accessToken) // Use for API calls


SCORINGSERVICE
──────────────
Purpose: Calculate cognitive domain scores and total assessment score
Location: /services/scoring.service.ts
Methods:
  • calculateDomainScores(answers) → DomainScores
  • calculateTotalScore(answers) → number
  • getScorePercentile(score, maxScore) → number
  • computeScore(answers) → Promise<number>

Example Usage:
  const scores = ScoringService.calculateDomainScores(assessmentAnswers)
  const total = ScoringService.calculateTotalScore(assessmentAnswers)
  console.log(scores.orientation) // Individual domain score


AISERVICE
─────────
Purpose: Manage AI analysis with retry, fallback, and standardized responses
Location: /services/ai.service.ts
Methods:
  • analyzePictureDescription(description) → Promise<{score, issues}>
  • analyzeSpeech(text) → Promise<{score, interpretation}>
  • generateNarrativeReport(assessment) → Promise<string>
  • analyzeDrawing(description) → Promise<{score, details}>

Example Usage:
  const analysis = await AIService.generateNarrativeReport({
    totalScore: 26,
    answers: { /* ... */ }
  })
  // Falls back to Groq if Claude fails, or rule-based if both fail


PATTERNSERVICE
───────────────
Purpose: Detect Alzheimer's-related patterns and assess risk
Location: /services/pattern.service.ts
Methods:
  • analyzePatterns(scores, answers) → AlzheimersPattern
  • calculateRiskScore(scores, age) → number
  • assessFunctionalImpact(patterns) → string
  • getRecommendations(riskLevel) → string[]

Example Usage:
  const pattern = PatternService.analyzePatterns(domainScores, answers)
  console.log(pattern.riskLevel) // 'low' | 'mild_impairment' | 'moderate' | 'high'


REPORTSERVICE
──────────────
Purpose: Generate comprehensive clinical reports
Location: /services/report.service.ts
Methods:
  • generateReport(params) → ClinicalReport
  • formatForPrinting(report) → string
  • exportJSON(report) → string

Example Usage:
  const report = ReportService.generateReport({
    patientName: 'John Smith',
    patientAge: 72,
    totalScore: 26,
    maxScore: 30,
    domainScores: { /* ... */ },
    patternAnalysis: { /* ... */ }
  })


CACHESERVICE
────────────
Purpose: High-performance in-memory caching with TTL
Location: /services/cache.service.ts
Methods:
  • set(key, value, ttl) → void
  • get(key) → T | null
  • has(key) → boolean
  • delete(key) → boolean
  • clear() → void
  • getStats() → { size, maxSize, entries }

Example Usage:
  const cache = CacheService.getInstance()
  cache.set(CacheKeys.patient('patient-123'), patientData, 5 * 60 * 1000)
  const cached = cache.get(CacheKeys.patient('patient-123'))


═══════════════════════════════════════════════════════════════════════════
5. DATABASE SCHEMA
═══════════════════════════════════════════════════════════════════════════

PATIENTS TABLE
──────────────
CREATE TABLE patients (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  age INT NOT NULL,
  gender VARCHAR(1),
  doctor_id UUID NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

ASSESSMENTS TABLE
──────────────────
CREATE TABLE assessments (
  id UUID PRIMARY KEY,
  patient_id UUID NOT NULL,
  assessment_type VARCHAR(50),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  status VARCHAR(20),
  progress INT,
  answers JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

ASSESSMENT_RESULTS TABLE
─────────────────────────
CREATE TABLE assessment_results (
  id UUID PRIMARY KEY,
  patient_id UUID NOT NULL,
  assessment_type VARCHAR(50),
  total_score INT,
  adjusted_score INT,
  domain_scores JSONB,
  ai_analysis TEXT,
  alzheimer_risk_index INT,
  pattern_analysis JSONB,
  clinical_report JSONB,
  assessed_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

DOCTORS TABLE
───────────────
CREATE TABLE doctors (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL (Auth),
  first_name TEXT,
  last_name TEXT,
  email TEXT UNIQUE,
  license_number TEXT,
  specialty VARCHAR(50),
  role VARCHAR(30),
  is_active BOOLEAN,
  is_verified BOOLEAN,
  patient_ids UUID[],
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

DOCTOR_ACCESS_LOGS TABLE
──────────────────────────
CREATE TABLE doctor_access_logs (
  id UUID PRIMARY KEY,
  doctor_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  action VARCHAR(50),
  timestamp TIMESTAMP
)


═══════════════════════════════════════════════════════════════════════════
6. SECURITY IMPLEMENTATION
═══════════════════════════════════════════════════════════════════════════

AUTHENTICATION FLOW
────────────────────
1. User logs in with email/password
2. Supabase validates credentials
3. JWT token generated with 1-hour expiry
4. Refresh token stored in httpOnly cookie
5. Token verified on every protected API call
6. Automatic token refresh before expiry

AUTHORIZATION (RBAC)
─────────────────────
Roles:
  • admin: Full system access, user management
  • senior_clinician: Multiple patient access, dashboard
  • clinician: Single/assigned patient access
  • resident: Read-only access, supervised

Middleware:
  • requireAuth(): Verify JWT present
  • requireRole(role): Verify user has role
  • logAccess(): Audit trail of data access

ENCRYPTION
───────────
Algorithm: AES-256-GCM
Use Cases:
  • Sensitive patient data at rest
  • Medical history encryption
  • Assessment results encryption

Example:
  const encrypted = SecurityUtils.encrypt(sensitiveData)
  const decrypted = SecurityUtils.decrypt(encrypted)

XSSS & INJECTION PROTECTION
─────────────────────────────
Method: HTML entity escaping + input validation
Implementation:
  • sanitizeInput(): Removes script tags
  • validateInput(): Checks field constraints
  • parameterized queries: Prevents SQL injection

CSRF PROTECTION
─────────────────
Method: Token-based CSRF protection
Implementation:
  • generateCSRFToken(): Create token
  • verifyCSRFToken(): Validate on state-changing operations
  • SameSite=Strict on cookies

RATE LIMITING
───────────────
Configuration: 100 requests/minute per IP
Implementation: Ready in /middleware/api.middleware.ts
Usage: Apply to auth endpoints, API routes

CORS CONFIGURATION
───────────────────
Allowed: https://yourdomain.com, localhost:3000
Disallowed: Wildcard (*) in production
Headers: Proper CORS headers in responses


═══════════════════════════════════════════════════════════════════════════
7. DEPLOYMENT GUIDE
═══════════════════════════════════════════════════════════════════════════

PREREQUISITES
──────────────
✓ Node.js 18+ installed
✓ npm 9+ installed
✓ Supabase account with project
✓ Production domain with SSL/TLS
✓ Server with at least 512MB RAM

STEP 1: PREPARE ENVIRONMENT
────────────────────────────
1. Copy .env.example to .env.local
2. Fill in all required variables:
   - NEXT_PUBLIC_SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - ANTHROPIC_API_KEY
   - JWT_SECRET (generate: openssl rand -hex 32)

3. Set NODE_ENV=production

STEP 2: INSTALL & BUILD
────────────────────────
npm install
npm run build

Verify build succeeds without errors.

STEP 3: DATABASE SETUP
───────────────────────
1. Open Supabase dashboard
2. Run SQL setup script: SUPABASE_SETUP.sql
3. Create indexes for performance

STEP 4: DEPLOYMENT
────────────────────
Option A: Vercel (Recommended for Next.js)
  1. Push code to GitHub
  2. Connect project in Vercel dashboard
  3. Set environment variables
  4. Deploy with: npm run build && npm start

Option B: Docker/Kubernetes
  1. Create Dockerfile (sample provided)
  2. Build image: docker build -t neuroscreen:v2 .
  3. Push to registry
  4. Deploy with: docker run -p 3000:3000 neuroscreen:v2

Option C: Traditional VPS
  1. SSH to server
  2. Clone repository
  3. Install dependencies: npm install --production
  4. Build: npm run build
  5. Start with PM2: pm2 start "npm start" --name neuroscreen

STEP 5: VERIFICATION
─────────────────────
1. Check health endpoint: curl https://yourdomain.com/api/health
2. Verify authentication works
3. Test patient creation flow
4. Run: npm run test:e2e
5. Monitor logs for errors

STEP 6: MONITORING
────────────────────
1. Set up uptime monitoring
2. Configure log aggregation (optional: Sentry, DataDog)
3. Set up alerts for errors
4. Monitor response times
5. Configure automated backups


═══════════════════════════════════════════════════════════════════════════
8. MONITORING & MAINTENANCE
═══════════════════════════════════════════════════════════════════════════

HEALTH CHECKS
──────────────
Endpoint: /api/health
Frequency: Every 5 minutes
Alert: If down for > 5 minutes

LOGGING
────────
Levels: DEBUG, INFO, WARN, ERROR
Default Level: INFO (use DEBUG in development)
Output: Console + Optional file transport
Retention: 30 days recommended

PERFORMANCE MONITORING
───────────────────────
Key Metrics:
  • API response time (target: < 500ms)
  • Database query time (target: < 100ms)
  • Cache hit rate (target: > 70%)
  • Error rate (target: < 0.1%)

SECURITY SCANNING
──────────────────
Frequency: Weekly
Tools: npm audit, OWASP ZAP
Actions: Update vulnerable dependencies immediately

DATABASE MAINTENANCE
──────────────────────
Tasks:
  • Weekly vacuum: VACUUM; ANALYZE;
  • Monthly indexing review
  • Quarterly backup verification
  • Yearly performance tuning

DEPENDENCY UPDATES
────────────────────
Frequency: Monthly
Process:
  1. Check for updates: npm outdated
  2. Test updates locally: npm update
  3. Run test suite: npm test
  4. Deploy to staging first
  5. Verify in staging before production


═══════════════════════════════════════════════════════════════════════════
9. TROUBLESHOOTING
═══════════════════════════════════════════════════════════════════════════

AUTHENTICATION ISSUES
──────────────────────
Problem: Users can't login
Solution:
  1. Check Supabase credentials in .env.local
  2. Verify JWT_SECRET is set
  3. Check user exists in Supabase auth
  4. Review auth middleware logs

Problem: Token expired
Solution:
  1. Implement automatic token refresh
  2. Clear browser cookies and retry
  3. Extend tokenTTL if needed (default: 1 hour)

DATABASE CONNECTION ISSUES
───────────────────────────
Problem: Can't connect to Supabase
Solution:
  1. Verify SUPABASE_URL is correct
  2. Check service role key has permissions
  3. Ensure IP whitelist allows server IP
  4. Test connection: curl $SUPABASE_URL/rest/v1/

Problem: Slow queries
Solution:
  1. Add indexes: CREATE INDEX idx_patient_doctor ON patients(doctor_id);
  2. Use pagination: limit 100
  3. Cache frequently accessed data
  4. Monitor slow query log

PERFORMANCE ISSUES
────────────────────
Problem: High response times
Solution:
  1. Check cache hit rate: CacheService.getStats()
  2. Enable caching for frequent queries
  3. Reduce database query complexity
  4. Scale horizontally if needed

Problem: High memory usage
Solution:
  1. Reduce cache max size
  2. Implement cache cleanup
  3. Check for memory leaks in logs
  4. Restart application

AI SERVICE FAILURES
────────────────────
Problem: Claude API errors
Solution:
  1. Check ANTHROPIC_API_KEY is valid
  2. Verify rate limits not exceeded
  3. Check Groq fallback is working
  4. Review ai.service.ts error logs

DEPLOYMENT ISSUES
───────────────────
Problem: Build fails
Solution:
  1. Check TypeScript errors: npm run build
  2. Verify all dependencies installed
  3. Check for missing environment variables
  4. Review build logs for specific errors

Problem: Application won't start
Solution:
  1. Check all environment variables set
  2. Verify database is accessible
  3. Check port not in use
  4. Review startup logs


═══════════════════════════════════════════════════════════════════════════
10. SUPPORT & UPDATES
═══════════════════════════════════════════════════════════════════════════

GETTING HELP
─────────────
Documentation: See README files in each directory
Issues: Check /GitHub issues
Logs: Review application logs in /var/log/neuroscreen/

REPORTING BUGS
───────────────
Include:
  1. Error message and stack trace
  2. Steps to reproduce
  3. Environment (production/staging/dev)
  4. Browser/client information
  5. Relevant logs

FEATURE REQUESTS
──────────────────
Submit to: product@neuroscreen.io
Include:
  1. Use case & benefit
  2. Proposed implementation
  3. Priority & timeline
  4. Dependencies

SECURITY DISCLOSURES
──────────────────────
For security issues, email: security@neuroscreen.io
Do not publicly disclose vulnerabilities


═══════════════════════════════════════════════════════════════════════════
QUICK REFERENCE
═══════════════════════════════════════════════════════════════════════════

Commands:
  npm install          - Install dependencies
  npm run dev          - Start development server
  npm run build        - Build for production
  npm start            - Start production server
  npm test             - Run test suite
  npm run lint         - Check code quality

Environment Variables:
  NODE_ENV             - production | staging | development
  NEXT_PUBLIC_SUPABASE_URL - Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY - Supabase API key
  ANTHROPIC_API_KEY    - Claude API key
  JWT_SECRET           - Signing secret for JWTs

Key Directories:
  /pages               - Next.js pages & API routes
  /services            - Business logic services
  /repositories        - Data access layer
  /middleware          - Request handling
  /components          - React components
  /types               - TypeScript definitions
  /utils               - Utilities & helpers
  /__tests__           - Test suite


═══════════════════════════════════════════════════════════════════════════
VERSION HISTORY
═══════════════════════════════════════════════════════════════════════════

v2.0 - PRODUCTION RELEASE (current)
  • Complete 12-phase production upgrade
  • Enterprise-grade architecture
  • Full security hardening
  • Clinical compliance
  • Comprehensive testing

v1.0 - Initial Release
  • Basic cognitive screening
  • Simple scoring system
  • CLI-based interaction


═══════════════════════════════════════════════════════════════════════════

Last Updated: 2024-01-20
Maintained By: NeuroScreen Development Team
License: [Your License Here]

For latest updates, visit: https://github.com/yourusername/neuroscreen
`;

export default PRODUCTION_UPGRADE_GUIDE;
