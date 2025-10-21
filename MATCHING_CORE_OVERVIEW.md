# Matching Engine – Core Platform Overview

**Last Updated**: Current Session
**Status**: Core service live and iterating (~75%)

## ✅ Completed Components

### Phase 0: Platform Infrastructure

- ✅ Feature flag system (`src/lib/featureFlags.ts`)
  - Matching engine boots with the platform (no flag required)
  - `WIREFRAME_MODE` flag for dev-only mock data
- ✅ Structured logging (`src/lib/log.ts`)

### Phase 1: Database Schema & Migrations

- ✅ Drizzle schema definitions (`src/db/schema.ts`)
  - `matching_profiles` table (1:1 with profiles)
  - `skills` table (many-to-one with profiles)
  - `assignments` table (org job postings)
  - `matches` table (cached match results)
  - `match_interest` table (mutual reveal tracking)
- ✅ SQL migration (`drizzle/0002_matching_tables.sql`)
  - All tables with proper constraints
  - GIN indexes for array/JSONB fields
  - Check constraints for levels, dates, modes
  - Updated_at triggers
- ✅ Controlled taxonomies (`src/lib/taxonomy/data.ts`)
  - 20 values (collaboration, innovation, etc.)
  - 25 causes/SDGs
  - 45+ skills across categories
  - Language & currency options

### Phase 2: Core Matching Logic

- ✅ Pure scoring functions (`src/lib/core/matching/scorers.ts`)
  - Jaccard similarity for sets
  - Values, causes, skills scoring
  - Experience (logistic curve)
  - Verifications (binary gates)
  - Availability (date window overlap)
  - Location (mode compatibility)
  - Compensation (range overlap)
  - Language (CEFR levels)
  - Weighted composition with contributions
  - Deterministic tie-breaking
- ✅ Attribute firewall (`src/lib/core/matching/firewall.ts`)
  - Scrubs 20+ PII fields
  - Recursive object traversal
  - Validation helpers
- ✅ Weight presets (`src/lib/core/matching/presets.ts`)
  - Mission-first (values 35%, skills 25%)
  - Skills-first (skills 40%, experience 25%)
  - Balanced (equal distribution)
  - Normalization utility
- ✅ Unit tests
  - `src/lib/core/matching/__tests__/firewall.test.ts` (8 tests)
  - `src/lib/core/matching/__tests__/scorers.test.ts` (45+ tests)

### Phase 3: API Layer

- ✅ Taxonomy endpoints (`src/app/api/taxonomy/[kind]/route.ts`)
  - GET /api/taxonomy/values
  - GET /api/taxonomy/causes
  - GET /api/taxonomy/skills
  - Auth required, part of core API surface
- ✅ Matching profile CRUD (`src/app/api/core/matching/matching-profile/route.ts`)
  - GET /api/matching-profile
  - PUT /api/matching-profile (upsert with skills)
  - Zod validation
- ✅ Assignments CRUD
  - `src/app/api/assignments/route.ts` (GET, POST)
  - `src/app/api/assignments/[id]/route.ts` (PUT, DELETE)
  - Org membership verification
  - Zod validation
- ✅ Match interest tracking (`src/app/api/core/matching/interest/route.ts`)
  - POST /api/match/interest (record interest)
  - GET /api/match/interest (list interests)
  - Mutual reveal detection
- ✅ Matching computation
  - `src/app/api/core/matching/assignment/route.ts` (org → candidates)
  - `src/app/api/core/matching/profile/route.ts` (individual → assignments)
  - Hard filters enforced
  - PII scrubbed via firewall
  - Deterministic sorting
  - Top-k results

### Phase 4: Shared UI Components

- ✅ shadcn/ui Sheet component installed
- ✅ TypeaheadChips (`src/components/matching/TypeaheadChips.tsx`)
  - Multi-select with typeahead
  - Max selections limit
  - Keyboard accessible
- ✅ SkillLevelRow (`src/components/matching/SkillLevelRow.tsx`)
  - Level selector (L0-L5)
  - Months experience input
  - Remove button
- ✅ CEFRLanguageRow (`src/components/matching/CEFRLanguageRow.tsx`)
  - Language selector
  - CEFR level dropdown (A1-C2)
- ✅ LocationInput (`src/components/matching/LocationInput.tsx`)
  - Work mode selector
  - Conditional country/city fields
  - Radius input for on-site
- ✅ CompensationInput (`src/components/matching/CompensationInput.tsx`)
  - Min/max range
  - Currency selector
- ✅ DateWindowInput (`src/components/matching/DateWindowInput.tsx`)
  - Earliest/latest date pickers

### Phase 5: Individual Flow

- ✅ IndividualMatchingEmpty (`src/components/matching/IndividualMatchingEmpty.tsx`)
  - Centered empty state
  - Explains blind-first matching
  - CTA to setup
- ✅ MatchingProfileSetup (`src/components/matching/MatchingProfileSetup.tsx`)
  - 5-step wizard (Skills, Values, Work, Languages, Review)
  - Progress bar
  - Form validation
  - Fetches taxonomies from API
  - Saves to /api/matching-profile
  - Completeness indicators
- ✅ Matching page integration (`src/app/app/i/matching/page.tsx`)
  - Loads as part of core pipeline
  - Conditional rendering (empty/setup/filled)
  - Fetches profile & matches
  - Result cards display

### Phase 6: Organization Flow (Partial)

- ✅ OrganizationMatchingEmpty (`src/components/matching/OrganizationMatchingEmpty.tsx`)
  - Empty state for orgs
  - CTA to create assignment

### Phase 7: Matching Results UI

- ✅ MatchResultCard (`src/components/matching/MatchResultCard.tsx`)
  - Blind variant (PII scrubbed)
  - Revealed variant placeholder
  - Match score display
  - Top skills badges
  - Values/causes chips
  - Location, hours, compensation details
  - Contribution breakdown bars
  - Interested/Hide actions
  - Skill gaps display

---

## 🚧 Remaining Work

### High Priority (Core Functionality)

1. **Weights & Filters Sheet** (`src/components/matching/WeightsFiltersSheet.tsx`)
   - Right-side sheet with sliders
   - Per-category weight adjustment
   - Hard filter toggles
   - Preset selector
   - Apply button triggers re-fetch

2. **Explain Panel** (`src/components/matching/ExplainPanel.tsx`)
   - Detailed score breakdown
   - Per-category subscores with bars
   - Gap analysis
   - "Why this match?" narrative

3. **Organization Filled View** (`src/components/matching/MatchingOrganizationView.tsx`)
   - Assignment tabs
   - Match results per assignment
   - Create new assignment button
   - Fetches from /api/match/assignment

4. **Assignment Builder Integration**
   - Wire existing `AssignmentBuilder.tsx` component
   - Ensure it saves via /api/assignments
   - Navigate to filled view after creation

### Medium Priority (Polish & Completeness)

5. **Dashboard Integration**
   - Update `src/components/dashboard/MatchingResultsCard.tsx`
     - Link "Open preferences" to `/app/i/matching`
   - Update `src/components/dashboard/ExploreOpportunitiesCard.tsx`
     - Add "View Matches" button if profile exists

6. **Reveal Flow**
   - Implement mutual interest detection in UI
   - Switch MatchResultCard to revealed variant
   - Show identity after mutual interest
   - Link to full profiles

7. **Interest Actions**
   - Wire "Interested" button to POST /api/match/interest
   - Handle mutual reveal response
   - Show revealed card on success

8. **Enhanced Empty States**
   - Add illustrations/graphics
   - Improve copy based on user feedback

### Low Priority (Nice-to-Haves)

9. **Filtering & Sorting**
   - Client-side filters (remote only, etc.)
   - Sort options (best match, recent, etc.)

10. **Match History**
    - View past interests
    - Hidden matches management

11. **Notifications**
    - New match notifications
    - Mutual interest alerts

12. **Analytics**
    - Match rate tracking
    - Profile completeness tips

---

## 🔧 Setup Instructions

### 1. Environment Variables

No additional variables are required. Matching boots with the platform by default.

### 2. Database Migration

Run the migration:

```bash
npm run db:push
```

Or manually apply `/drizzle/0002_matching_tables.sql` to your database.

### 3. Verify Installation

1. Navigate to `/app/i/matching`
2. You should see the empty state (if no profile)
3. Click "Set Up Matching Profile"
4. Complete the wizard
5. You should see the filled view (may be empty if no assignments exist)

---

## 📊 API Endpoints Summary

| Endpoint                | Method | Purpose                        | Auth | Status      |
| ----------------------- | ------ | ------------------------------ | ---- | ----------- |
| `/api/taxonomy/values`  | GET    | Get values list                | ✅   | ✅ Complete |
| `/api/taxonomy/causes`  | GET    | Get causes list                | ✅   | ✅ Complete |
| `/api/taxonomy/skills`  | GET    | Get skills list                | ✅   | ✅ Complete |
| `/api/matching-profile` | GET    | Get user's profile             | ✅   | ✅ Complete |
| `/api/matching-profile` | PUT    | Upsert profile                 | ✅   | ✅ Complete |
| `/api/assignments`      | GET    | List org's assignments         | ✅   | ✅ Complete |
| `/api/assignments`      | POST   | Create assignment              | ✅   | ✅ Complete |
| `/api/assignments/[id]` | PUT    | Update assignment              | ✅   | ✅ Complete |
| `/api/assignments/[id]` | DELETE | Delete assignment              | ✅   | ✅ Complete |
| `/api/match/assignment` | POST   | Compute matches for assignment | ✅   | ✅ Complete |
| `/api/match/profile`    | POST   | Compute matches for profile    | ✅   | ✅ Complete |
| `/api/match/interest`   | POST   | Record interest                | ✅   | ✅ Complete |
| `/api/match/interest`   | GET    | List interests                 | ✅   | ✅ Complete |

---

> Canonical handlers live under `/api/core/matching/*`; legacy routes above re-export the same logic for backward compatibility.

## 🧪 Testing Coverage

### Unit Tests (Complete)

- ✅ Firewall (8 tests)
- ✅ Scorers (45+ tests covering all functions)

### Integration Tests (TODO)

- ⏸️ API endpoint tests
- ⏸️ Database schema tests
- ⏸️ Component integration tests

### E2E Tests (TODO)

- ⏸️ Full matching flow (individual)
- ⏸️ Full matching flow (organization)
- ⏸️ Mutual reveal flow

---

## 🎯 Acceptance Criteria Status

| Criteria                                         | Status           |
| ------------------------------------------------ | ---------------- |
| Matching engine loads with core app              | ✅               |
| No mock data in production                       | ✅               |
| Single matching route with conditional rendering | ✅               |
| Interest endpoint + mutual reveal                | ✅               |
| matching_profiles.profile_id is PRIMARY KEY      | ✅               |
| Availability window + radius + weights in schema | ✅               |
| Matching navigation works                        | ✅               |
| Empty states display                             | ✅               |
| Profile setup wizard works                       | ✅               |
| Assignment builder integrated                    | 🚧 Pending       |
| Match APIs return real data                      | ✅               |
| Result cards show blind-first info               | ✅               |
| Weights panel adjusts results                    | 🚧 Pending       |
| Firewall test passes                             | ✅               |
| API inputs validated with Zod                    | ✅               |
| Keyboard navigation works                        | ✅               |
| No console errors                                | ⏸️ Needs testing |

---

## 📝 Next Steps

### Immediate (Complete Core Functionality)

1. Build WeightsFiltersSheet component
2. Build ExplainPanel component
3. Build MatchingOrganizationView component
4. Wire Interest actions to API
5. Implement reveal flow

### Short-term (Polish)

1. Dashboard integration (link cards)
2. Add loading states
3. Error handling improvements
4. A11y audit

### Long-term (Future Enhancements)

1. Analytics dashboard
2. Notification system
3. Advanced filtering
4. Match history

---

## 🐛 Known Issues

- None currently identified

---

## 📚 Documentation Links

- [Original Plan](./matching-system.plan.md)
- [Audit Feedback](Incorporated in current implementation)
- [Database Schema](./src/db/schema.ts)
- [API Documentation](See API Endpoints Summary above)

---

**Notes**:

- All core matching logic is deterministic and tested
- Privacy firewall is active and tested
- All APIs load as part of the core platform pipeline
- Ready for end-to-end testing once remaining UI components are complete
