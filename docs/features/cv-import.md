> Doc Class: `historical`
> Last Verified: `2026-05-19`

# Archived CV Import Feature Documentation

> Launch status: archived/non-launch. The CV import wizard is not an active MVP feature and is explicitly excluded from the controlled assistive AI / Document AI OCR rollout. Keep this document as historical implementation context only. Do not use it as launch evidence or as approval to reactivate CV import, taxonomy shortlist, ranking, or OCR import flows.

## Overview

This document describes a retired CV Import implementation that historically extracted and added skills to Expertise Atlas from pasted text and uploaded PDFs. It is not a current launch workflow. The locked MVP corridor now routes proof import and review work through the active proof/onboarding surfaces, and any approved Start from CV or proof-artifact extraction work must stay separate from this archived wizard.

## Launch Status

- `/app/i/expertise` is not a compiled active MVP page.
- `/api/expertise/cv-import/wizard-*` routes are archived compatibility endpoints and should return `410`.
- This document must not be used as setup, QA, product, or launch-smoke guidance for the MVP.
- Keep any future OCR or CV-assisted work behind an explicitly approved route-surface change.

## Historical User Flow

The old flow below is retained only to explain what was removed:

1. Open the old Expertise Atlas page.
2. Use an Import from CV tab.
3. Paste CV/JD/general text or upload a PDF.
4. Analyze and rank suggested taxonomy skills.
5. Select suggested skills and add them to a profile.
6. Refresh the old Expertise Atlas skill list.

## Technical Architecture

### Components

#### 1. Frontend Component

**File**: `/src/components/expertise/CVJDAutoSuggest.tsx`

A React component that provides the UI for CV import:

- Text input with context selection (CV/JD/General)
- Skill suggestion display with selection
- Loading states and error handling
- Integration with the auto-suggest API

**Key Props**:

```typescript
interface CVJDAutoSuggestProps {
  onSkillsAdded?: (skills: Suggestion[]) => void;
}
```

**Data Structure**:

```typescript
interface Suggestion {
  id: string; // skill code (unique identifier)
  code: string; // skill code in taxonomy
  name: string; // skill name (English)
  aliases: string[]; // alternative names
  description: string | null;
  slug: string; // URL-friendly identifier
  tags: string[] | null;
  score: number; // relevance score
  confidence: number; // 0-1 confidence rating
}
```

#### 2. Auto-Suggest API

**Endpoint**: `POST /api/expertise/auto-suggest`

**File**: `/src/app/api/expertise/auto-suggest/route.ts`

Analyzes text and returns skill suggestions.

**Request Body**:

```json
{
  "text": "Your CV or JD text here...",
  "context": "cv" | "jd" | "general"
}
```

**Response**:

```json
{
  "success": true,
  "suggestions": [
    {
      "id": "01.03.01.142",
      "code": "01.03.01.142",
      "name": "JavaScript",
      "aliases": ["JS", "ECMAScript"],
      "description": "Programming language for web development",
      "slug": "javascript",
      "tags": ["programming", "web"],
      "score": 10,
      "confidence": 0.95
    }
  ],
  "metadata": {
    "textLength": 1500,
    "uniqueTerms": 45,
    "totalMatches": 12,
    "context": "cv"
  }
}
```

**Historical Runtime Modes**:

These modes describe the retired CV import implementation. They are not approval to make any CV import route launch-active.

- `engine=auto` (default) - deterministic JSON path, Python for multipart.
- `engine=typescript` - deterministic TypeScript path.
- `engine=python` - Python path for JSON and multipart.
- `engine=gemini` - Gemini extraction with deterministic fallback.

**Historical Gemini-enabled Endpoints**:

- `POST /api/expertise/cv-import/suggest`
- `POST /api/expertise/cv-import/wizard-suggest`
- `POST /api/expertise/auto-suggest`

**Gemini Request Controls**:

- `x-idempotency-key` (optional) for idempotent replay and no double charging on retries.
- `x-request-id` is accepted and echoed back for observability.

**Response Metadata Additions**:

- `engine_mode`: `auto | typescript | python | gemini`
- `engine_used`: `typescript | python | gemini`
- `ai_provider`: `gemini` when Gemini path is used
- `ai_model`: resolved Gemini model (or `null` on deterministic fallback)
- `ai_key_slot`: `primary | secondary` (or `null` on fallback)
- `ai_fallback_reason`: reason when deterministic fallback is used
- `cost_ore`: request cost in ore
- `currency`: `SEK`

**Stable Error Codes**:

- `CV_IMPORT_BUDGET_EXCEEDED`
- `CV_IMPORT_GEMINI_QUOTA_EXCEEDED`
- `CV_IMPORT_GEMINI_INVALID_JSON`
- `CV_IMPORT_OCR_FAILED`
- `CV_IMPORT_RATE_LIMIT_EXCEEDED`

**Deterministic Fallback Algorithm**:

1. **Tokenization**: Split text into words and filter out common words
2. **Pattern Matching**: Extract multi-word skill patterns (e.g., "project management")
3. **Database Search**: Search taxonomy using ILIKE on name, aliases, and description
4. **Scoring**: Rank by match quality:
   - Exact name match: +10 points
   - Alias match: +7 points
   - Description match: +3 points
   - Context boost: +1 point for management skills in JD context
5. **Normalization**: Convert score to 0-1 confidence
6. **Limiting**: Return top 20 results

#### 3. User Skills API

**Endpoint**: `POST /api/expertise/user-skills`

**File**: `/src/app/api/expertise/user-skills/route.ts`

Adds a skill to the user's profile.

**Request Body**:

```json
{
  "skill_code": "01.03.01.142",
  "level": 2,
  "months_experience": 0,
  "last_used_at": "2025-11-05T12:00:00Z",
  "relevance": "current"
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "skill": {
    "id": "uuid-here",
    "profile_id": "user-uuid",
    "skill_code": "01.03.01.142",
    "level": 2,
    "months_experience": 0,
    "last_used_at": "2025-11-05T12:00:00Z",
    "relevance": "current",
    "created_at": "2025-11-05T12:00:00Z"
  }
}
```

**Error Response** (409 Conflict):

```json
{
  "error": "Skill already exists in your profile"
}
```

### Database Schema

**Skills Taxonomy Table**: `skills_taxonomy`

```sql
CREATE TABLE skills_taxonomy (
  code TEXT PRIMARY KEY,              -- "01.03.01.142"
  cat_id INTEGER NOT NULL,            -- L1 category
  subcat_id INTEGER NOT NULL,         -- L2 subcategory
  l3_id INTEGER NOT NULL,             -- L3 specialization
  skill_id INTEGER NOT NULL,          -- L4 skill ID
  slug TEXT UNIQUE NOT NULL,          -- "javascript"
  name_i18n JSONB NOT NULL,           -- {"en": "JavaScript"}
  aliases_i18n JSONB DEFAULT '[]',    -- ["JS", "ECMAScript"]
  description_i18n JSONB,             -- {"en": "Programming language..."}
  tags TEXT[],                        -- ["programming", "web"]
  status TEXT DEFAULT 'active',       -- 'active' | 'deprecated' | 'merged'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**User Skills Table**: `skills`

```sql
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL,             -- For taxonomy: matches code
  skill_code TEXT,                    -- Link to taxonomy
  level INTEGER NOT NULL,             -- 1-5 (Beginner to Expert)
  months_experience INTEGER DEFAULT 0,
  last_used_at TIMESTAMP,
  relevance TEXT DEFAULT 'current',   -- 'obsolete' | 'current' | 'emerging'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(profile_id, skill_id)        -- One skill per user
);
```

## Testing

### Active Launch Gate

**File**: `e2e/cv-import-non-launch.spec.ts`

The active test is a non-launch hard gate. It proves the archived wizard API returns `410` and `/app/i/expertise` stays unavailable, rather than proving a CV import workflow works.

**Run Test**:

```bash
npx playwright test e2e/cv-import-non-launch.spec.ts
```

### Archived Historical Coverage

Old integration and UI tests for skill suggestion, confidence scores, import tabs, and CV wizard interactions are historical only. Do not move them back into default launch checks unless the route-surface policy is deliberately changed.

## Historical Performance Considerations

### Text Processing

- **Input Limit**: No hard limit, but optimal performance with CVs under 10,000 characters
- **Processing Time**: ~500ms average for typical CV (1-2 pages)
- **Result Limit**: Top 20 suggestions to maintain UI responsiveness

### Database Queries

- Uses indexes on `skills_taxonomy.name_i18n`, `aliases_i18n`, and `code`
- ILIKE search with 200 result limit to prevent performance degradation
- Consider adding full-text search for large taxonomies (10,000+ skills)

### Optimization Tips

1. **Pre-filter common words**: Reduces database queries by ~40%
2. **Multi-word pattern matching**: Catches compound skills like "project management"
3. **Score-based ranking**: Most relevant skills appear first
4. **Client-side caching**: Suggestions are cached in component state

## Historical Known Limitations

1. **Text-based PDFs only**: The CV upload wizard is Python-only and does not fall back to browser OCR or local PDF parsing.
2. **Upload Guardrails**: Default parser limits are strict (`5MB`, `4` pages) to control latency and spend.
3. **Budget Enforcement**: Conservative reservation can block near-limit requests even if final token usage would have fit.
4. **Language Quality Variance**: Non-English CVs can still reduce mapping quality depending on taxonomy coverage.
5. **GCP OCR Provider**: The Cloud Run + Document AI smoke path is internal-only and not connected to the user CV/import review flow until explicitly approved. It uses service account ADC, not browser-created API keys.

## Future / Post-MVP Ideas

### Near Term

- [ ] Improve budget reservation estimation to reduce false budget blocks near monthly cap.
- [ ] Add richer admin charting for key-slot failover rates and invalid JSON retries.
- [ ] Add OCR quality diagnostics per document page for clearer user guidance.

### Mid Term

- [ ] Add richer evidence linking between extracted candidates and source text spans.
- [ ] Expand document support beyond PDF while preserving current privacy guarantees.
- [ ] Add adaptive per-user throttling based on abuse signals.

## Historical Troubleshooting

### No Skills Found

**Problem**: User pastes CV but gets "No skills found" message

**Solutions**:

1. Ensure CV contains technical skill keywords
2. Try different context (CV vs JD)
3. Check that skills exist in taxonomy database
4. Verify CV text is in English

### Skills Not Saving

**Historical problem**: User selected skills but they did not appear in the retired Expertise Atlas.

**Check**:

1. Browser console for JavaScript errors
2. Network tab for failed API requests
3. User authentication status
4. Database connection

**Debug Steps**:

```bash
# Check user skills in database
psql $DATABASE_URL -c "SELECT * FROM skills WHERE profile_id = 'user-id';"

# Check taxonomy data
psql $DATABASE_URL -c "SELECT COUNT(*) FROM skills_taxonomy WHERE status = 'active';"
```

### Low Confidence Scores

**Problem**: All suggestions show low confidence (<40%)

**Possible Causes**:

1. CV contains non-standard skill terminology
2. Taxonomy missing relevant skills
3. Text quality issues (formatting, special characters)

**Solutions**:

1. Add aliases to taxonomy for alternative skill names
2. Expand taxonomy coverage
3. Improve text preprocessing

### Duplicate Skills Error

**Problem**: User sees "Skill already exists in your profile" error

**Behavior**: This is expected! The system prevents duplicate skills.

**User Action**: Skill is already in their profile - no action needed.

## Security Considerations

### Input Validation

- Text input sanitized before processing
- Maximum text length enforced (configurable)
- SQL injection prevented via parameterized queries

### Authentication

- All endpoints require valid Supabase auth token
- User can only add skills to their own profile
- RLS policies enforce data isolation

### Rate Limiting

- Consider adding rate limiting for auto-suggest endpoint
- Prevent abuse via multiple rapid requests

## Historical Monitoring & Analytics

### Key Metrics to Track

1. **Usage Metrics**:
   - Number of CV imports per day/week/month
   - Average skills suggested per import
   - Average skills added per import
   - Completion rate (started vs finished)

2. **Performance Metrics**:
   - API response time (p50, p95, p99)
   - Database query time
   - Error rate

3. **Quality Metrics**:
   - Average confidence score of suggestions
   - Percentage of low-confidence suggestions
   - Skill retention rate (skills not deleted)

### Logging

Key events are logged with structured logging:

```typescript
logger.info('CV import completed', {
  userId: user.id,
  suggestionsCount: suggestions.length,
  selectedCount: skillsToAdd.length,
  successCount,
  failureCount,
  duration: Date.now() - startTime,
});
```

## Historical API Rate Limits

Historical limits (configurable via env):

- CV import suggest routes: `CV_IMPORT_USER_RATE_LIMIT_MAX` requests per `CV_IMPORT_USER_RATE_LIMIT_WINDOW_SECONDS` per user and route.
- Add skill route: global API limiter defaults still apply.

## Historical Support Notes

For archived implementation context:

- File a GitHub issue with label `feature:cv-import`
- Do not use the old Slack `#expertise-atlas` ownership model as current launch ownership.
- Check troubleshooting section above

---

**Last Updated**: May 19, 2026
**Version**: 2.0
**Maintainers**: Archived reference; current launch ownership follows the locked MVP authority stack.
