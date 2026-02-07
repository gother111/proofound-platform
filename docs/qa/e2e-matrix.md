# E2E Test Matrix (Actors and Critical Flows)

References used (repo source of truth):

- Product overview and persona routing: `README.md`
- Project memory and guardrails: `project/Prompt.md`, `project/Architecture.md`, `project/Plans.md`, `project/Implement.md`, `project/Documentation.md`
- Setup and verification checklists: `agent/runbooks/setup.md`, `agent/checklists/preflight.md`, `agent/checklists/verification.md`

## Actors

- Individual user
  - Unauthenticated
  - Newly registered
  - Returning (authenticated)
- Organization user
  - Org owner/admin
  - Org member (limited permissions)
- Platform admin
  - Platform admin (read mostly)
  - Super admin (full access)

## Critical Flows by Actor

### Individual (Unauthenticated)

- Landing and navigation
  - Visit `/`
  - Primary CTA to `/signup`
  - Login link to `/login`
- Auth
  - Signup `/signup` (individual path)
  - Login `/login`
  - Password reset `/reset-password`
  - Email verification `/verify-email`
- Access control
  - Visiting `/app/i/*` redirects to `/login` (real Supabase) or provides safe mock behavior (mock mode)

### Individual (Authenticated)

- App shell and navigation
  - Home `/app/i/home`
  - Profile `/app/i/profile`
  - Expertise `/app/i/expertise`
  - Matching `/app/i/matching`
  - Messages `/app/i/messages`
  - Interviews `/app/i/interviews`
  - Notifications `/app/i/notifications`
  - Settings
    - `/app/i/settings/privacy`
    - `/app/i/settings/notifications`
    - `/app/i/settings/integrations`
- Core CRUD (discoverable from routes)
  - Projects `/app/i/projects` and `/app/i/projects/[id]`
  - Skill gaps `/app/i/skill-gaps`
- Error and empty states
  - No data: lists show empty states, not crashes
  - API failures: show a user-facing message and allow retry

### Organization (Owner/Admin)

- Workspace entry
  - Org home `/app/o/[slug]/home`
  - Org profile `/app/o/[slug]/profile`
- Members and invitations
  - Members `/app/o/[slug]/members`
  - Invitations `/app/o/[slug]/invitations`
  - Invite member, accept invite, role assignment, removal
- Core org actions (discoverable from routes)
  - Assignments `/app/o/[slug]/assignments`
  - Candidates `/app/o/[slug]/candidates`
  - Matching `/app/o/[slug]/matching`
  - Shortlist `/app/o/[slug]/shortlist`
  - Interviews `/app/o/[slug]/interviews`
  - Analytics `/app/o/[slug]/analytics`
  - Settings `/app/o/[slug]/settings`
- Permission enforcement
  - Members cannot access admin-only actions (invite, billing, destructive changes)

### Organization (Member, Limited Permissions)

- Read access where expected
  - Org home and allowed modules
- Write access blocked where expected
  - Cannot manage members/invitations unless role allows
  - Cannot modify org settings unless role allows

### Platform Admin (Admin Dashboard)

- Admin dashboard entry
  - Admin home `/admin`
  - Users `/admin/users`
  - Organizations `/admin/organizations`
  - Audit `/admin/audit`
  - Verification queues `/admin/verification`
  - Performance `/admin/performance`
  - Cron summary `/admin/cron`
  - Fairness `/admin/fairness` and notes `/admin/fairness/notes`
- Admin actions
  - User role changes (where present)
  - User suspension (where present)
  - Org verification (where present)
- Permissions
  - Non-admin users are redirected to `/403`

## Cross-Cutting Checks (All Personas)

- Permissions
  - Users cannot access others' resources by ID/slug guessing
  - Org member cannot access other orgs
  - Admin-only routes blocked for non-admins
- Validation
  - Required fields and invalid formats show clear messages
  - Server errors are mapped to user-safe strings
- Loading and empty states
  - No infinite spinners
  - Empty lists render a clear empty state and CTA
- Accessibility basics
  - Keyboard navigation for key flows
  - Labels on inputs
  - Skip link works
  - Axe WCAG tags pass on public auth + landing pages
- Security basics
  - No secrets logged to browser console
  - Auth guards present on protected routes

## Automation Coverage (Current and Planned)

Current (verified passing locally):

- Auth smoke (mock Supabase): `e2e/auth.spec.ts` via `npm run test:e2e:auth`
- Accessibility (public pages): `tests/a11y/*` via `npm run test:a11y`

Planned next (to implement in this QA pass):

- Smoke navigation for Individual and Organization shells in mock mode.
- Admin dashboard smoke in a deterministic test environment.
- Role based access tests (org member vs admin, non-admin vs admin dashboard).
