# CV Import Feature Documentation

## Overview

The CV Import feature allows users to extract and add skills to their Expertise Atlas from pasted text and uploaded PDFs. The runtime supports a cost-controlled Gemini extraction path with deterministic fallback, per-key monthly SEK budgets, request-level usage logging, and a Python-only PDF extraction queue for CV uploads.

## User Flow

### Step 1: Navigate to Import Tab

1. Go to **Expertise Atlas** page (`/app/i/expertise`)
2. Click the **"Import from CV"** tab

### Step 2: Select Context

Choose the type of text you're pasting:

- **CV/Resume**: For personal resumes and CVs
- **Job Description**: For job posting text
- **General Text**: For any other skill-related text

### Step 3: Paste Text or Upload PDF

Paste your CV, resume, or job description text, or upload PDF documents in the CV Import Wizard flow.

### Step 4: Analyze

Click **"Analyze & Suggest Skills"** to process the text. The system will:

- Extract potential skill keywords
- Match them against the skills taxonomy
- Rank results by confidence score

### Step 5: Review Suggestions

Review the suggested skills, which show:

- Skill name
- Confidence percentage (how well it matched)
- Alternative names (aliases)
- Description

### Step 6: Select & Add

1. Click on skills to select/deselect them
2. Click **"Add X Selected"** to add them to your profile
3. Skills are saved with default values:
   - Level: 2 (Competent)
   - Experience: 0 months
   - Last Used: Today
   - Relevance: Current

### Step 7: Verification

After import, the page refreshes to show your newly added skills in the Expertise Atlas.

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

**Current Runtime Modes**:

- `engine=auto` (default) - deterministic JSON path, Python for multipart.
- `engine=typescript` - deterministic TypeScript path.
- `engine=python` - Python path for JSON and multipart.
- `engine=gemini` - Gemini extraction with deterministic fallback.

**Gemini-enabled Endpoints**:

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

### Integration Tests

**File**: `/tests/integration/cv-import.test.ts`

Tests cover:

- Auto-suggest API with various CV texts
- Skill extraction accuracy
- Duplicate skill handling
- Error scenarios (unauthorized, invalid input)
- Multiple skill import workflow
- End-to-end CV import flow

**Run Tests**:

```bash
npm run test:integration -- cv-import
```

### E2E Tests

**File**: `tests/e2e/cv-import.spec.ts`

Tests cover:

- Complete user workflow
- Empty state handling
- Context switching (CV/JD/General)
- Confidence score display
- Skill selection/deselection
- Loading states
- Keyboard navigation
- ARIA labels for accessibility

**Run Tests**:

```bash
npm run test:e2e -- cv-import
```

## Performance Considerations

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

## Known Limitations

1. **Text-based PDFs only**: The CV upload wizard is Python-only and does not fall back to browser OCR or local PDF parsing.
2. **Upload Guardrails**: Default parser limits are strict (`5MB`, `4` pages) to control latency and spend.
3. **Budget Enforcement**: Conservative reservation can block near-limit requests even if final token usage would have fit.
4. **Language Quality Variance**: Non-English CVs can still reduce mapping quality depending on taxonomy coverage.

## Future Enhancements

### Near Term

- [ ] Improve budget reservation estimation to reduce false budget blocks near monthly cap.
- [ ] Add richer admin charting for key-slot failover rates and invalid JSON retries.
- [ ] Add OCR quality diagnostics per document page for clearer user guidance.

### Mid Term

- [ ] Add richer evidence linking between extracted candidates and source text spans.
- [ ] Expand document support beyond PDF while preserving current privacy guarantees.
- [ ] Add adaptive per-user throttling based on abuse signals.

## Troubleshooting

### No Skills Found

**Problem**: User pastes CV but gets "No skills found" message

**Solutions**:

1. Ensure CV contains technical skill keywords
2. Try different context (CV vs JD)
3. Check that skills exist in taxonomy database
4. Verify CV text is in English

### Skills Not Saving

**Problem**: User selects skills but they don't appear in Expertise Atlas

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

## Monitoring & Analytics

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

## API Rate Limits

Current limits (configurable via env):

- CV import suggest routes: `CV_IMPORT_USER_RATE_LIMIT_MAX` requests per `CV_IMPORT_USER_RATE_LIMIT_WINDOW_SECONDS` per user and route.
- Add skill route: global API limiter defaults still apply.

## Support & Contact

For issues or questions:

- File a GitHub issue with label `feature:cv-import`
- Contact engineering team via Slack #expertise-atlas channel
- Check troubleshooting section above

---

**Last Updated**: March 1, 2026  
**Version**: 2.0  
**Maintainers**: Expertise Atlas Team
