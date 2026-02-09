# Key Flows (Sequence Diagrams)

![Key flows infographic](./assets/key-flows.png)

This doc focuses on the flows that matter most for onboarding and system evaluation. Each flow lists:

- Entrypoints (routes and key modules)
- A Mermaid sequence diagram (high level)
- Storage touched
- Side effects and failure modes
- Debug notes

## Flow 1: Auth and Session Bootstrapping

Entrypoints:

- `src/lib/supabase/server.ts` (server Supabase SSR client)
- `src/lib/supabase/client.ts` (browser Supabase client)
- `src/lib/auth.ts` (`getCurrentUser`, `requireAuth`)
- Protected pages under `src/app/app/*`

```mermaid
sequenceDiagram
  autonumber
  participant B as Browser
  participant N as Next.js server (RSC or route handler)
  participant A as requireAuth() (src/lib/auth.ts)
  participant S as Supabase SSR client (src/lib/supabase/server.ts)
  participant SA as Supabase Auth
  participant SP as Supabase Postgres (profiles)

  B->>N: Request protected page (for example /app/i/home)
  N->>A: requireAuth()
  A->>S: createClient()
  S->>SA: auth.getUser()
  SA-->>S: user or null

  alt user is null
    A-->>N: redirect(/login)
    N-->>B: 302 /login
  else user present
    A->>S: from('profiles').select(...).eq(id, user.id)
    S->>SP: SELECT profiles WHERE id = user.id
    SP-->>S: profile row
    S-->>A: ProfileRow
    A-->>N: ProfileRow
    N-->>B: Render page
  end
```

Storage touched:

- Supabase Auth session (cookie-based)
- `profiles` table (Supabase query via SSR client)

Failure modes:

- Supabase credentials missing causes server client creation to throw (`src/lib/supabase/server.ts`).
- Missing `profiles` row returns null user (caller usually treats as unauthenticated).

Debug notes:

- Check `docs/ENV_VARIABLES.md` for required Supabase vars.
- Verify cookies exist for Supabase SSR session on requests.

## Flow 2: Request Pipeline and Security (CSP, CSRF, Rate Limiting)

Entrypoints:

- `src/middleware.ts`
- `src/lib/csrf.ts`
- `src/lib/rate-limit/index.ts`
- `next.config.js` (additional headers)

```mermaid
sequenceDiagram
  autonumber
  participant B as Browser
  participant E as Vercel Edge
  participant M as Next middleware (src/middleware.ts)
  participant R as Route handler (src/app/api/*)

  B->>E: HTTPS request
  E->>M: Invoke middleware
  M->>M: Assign x-request-id
  M->>M: Block scanner paths (404) if matched

  opt KV configured
    M->>M: Rate limit check (src/lib/rate-limit/index.ts)
  end

  alt /api route
    M->>M: CSRF protection (src/lib/csrf.ts)
    alt CSRF invalid for mutating request
      M-->>B: 403 JSON (CSRF validation failed)
    else CSRF ok
      M->>R: NextResponse.next()
      R-->>B: Response
    end
  else non-/api route
    M->>R: NextResponse.next()
    R-->>B: Response
  end

  Note over M,R: Middleware also sets CSP and other security headers
  Note over R: next.config.js also defines security headers
```

Storage touched:

- Optional Vercel KV for rate limiting
- CSRF token cookie (`csrf_token`)

Failure modes:

- CSP drift between `next.config.js` and `src/middleware.ts` can break embeds, websockets, or dev tooling.
- KV outages or misconfiguration: rate limiting fails open, but logs warn (`src/middleware.ts`, `src/lib/rate-limit/index.ts`).

Debug notes:

- Check response headers for `Content-Security-Policy` and `x-request-id`.
- For 403 CSRF: confirm request includes `x-csrf-token` header and `csrf_token` cookie, or that the endpoint is intentionally exempt.

## Flow 3: Persona Routing and App Shells (Individual vs Org Member)

Entrypoints:

- `src/lib/auth.ts` (`resolveUserHomePath`, `getActiveOrg`, `getUserOrganizations`)
- Individual shell: `src/app/app/i/*`
- Org shell: `src/app/app/o/[slug]/*`

```mermaid
sequenceDiagram
  autonumber
  participant B as Browser
  participant N as Next.js server
  participant S as Supabase SSR client
  participant SP as Supabase Postgres (profiles + org membership)

  B->>N: Request /app (or a redirect target)
  N->>S: auth.getUser()
  S-->>N: user
  N->>S: SELECT platform_role, persona FROM profiles
  S->>SP: profiles query
  SP-->>S: row
  S-->>N: persona + role

  alt platform admin
    N-->>B: redirect(/admin)
  else persona == individual
    N-->>B: redirect(/app/i/home)
  else persona == org_member
    N->>S: Query organizations joined with organization_members (by slug or first membership)
    S->>SP: organizations join organization_members
    SP-->>S: org + membership
    S-->>N: org slug
    N-->>B: redirect(/app/o/{slug}/home)
  else unknown
    N-->>B: redirect(/onboarding or selection flow)
  end
```

Storage touched:

- `profiles` (persona, platform role)
- `organization_members` and `organizations` for org routing

Failure modes:

- Users with `persona=org_member` but no active org membership can land in a dead end unless handled.

Debug notes:

- `getActiveOrg(slug, userId)` uses an inner join on membership and returns null when not active (`src/lib/auth.ts`).

## Flow 4: Create Assignment and Generate Matches (Org Workflow)

Entrypoints:

- `POST /api/assignments` (`src/app/api/assignments/route.ts`)
- Match generation: `src/lib/matching/generate-matches-for-assignment.ts`
- Notifications: `src/lib/notifications/*`, `src/lib/email/*`
- Candidate scoring logic: `src/lib/core/matching/*`

```mermaid
sequenceDiagram
  autonumber
  participant B as Browser
  participant A as /api/assignments (route handler)
  participant AUTH as requireAuth() (src/lib/auth.ts)
  participant DB as Drizzle db (src/db/index.ts)
  participant M as generateMatchesForAssignment() (src/lib/matching/*)
  participant N as notifyAssignmentPublished() (src/lib/notifications)

  B->>A: POST /api/assignments (assignment payload)
  A->>AUTH: requireAuth()
  AUTH-->>A: userId
  A->>DB: Find org membership (organization_members)
  DB-->>A: orgId or null

  alt no org membership
    A-->>B: 403
  else org member
    A->>DB: INSERT assignments
    DB-->>A: assignment row

    opt assignment.status == active and activation criteria met
      A->>M: generateMatchesForAssignment(assignmentId)
      M->>DB: Read assignment + candidate profiles + skills
      M->>DB: INSERT/UPSERT matches
      M-->>A: matchesGenerated

      A->>N: create candidate notifications for top matches
      N-->>A: ok (best-effort)
    end

    A-->>B: 201 { assignment }
  end
```

Storage touched:

- `organization_members`, `organizations`, `assignments`, `matches`, `notifications`

Side effects:

- May trigger SUS survey logic (`src/lib/surveys/sus-triggers.ts`) and emit analytics events (`src/lib/analytics/events.ts`).
- May send notifications to matched candidates (`src/lib/notifications`).

Failure modes:

- Missing DB connectivity returns 503 with connection hints (`src/app/api/assignments/route.ts`).
- Match generation can be expensive; timeouts depend on runtime limits and dataset size.

Debug notes:

- Look for `assignment.matches.generated` and `assignment.notification.failed` logs (`src/app/api/assignments/route.ts`, `src/lib/log.ts`).

## Flow 5: Two-Stage Semantic Matching (ANN + Re-rank)

Entrypoints:

- Two-stage assignment matching: `src/app/api/match/assignment/route.ts`
- Semantic module: `src/lib/matching/semantic.ts`
- Embedding model loader: `src/lib/matching/embeddings.ts`
- pgvector migration and RPC functions: `supabase/migrations/20251109_add_embedding_columns.sql`

```mermaid
sequenceDiagram
  autonumber
  participant B as Browser
  participant R as /api/match/assignment
  participant DB as Drizzle db
  participant SEM as semantic.ts (ANN + PAC)
  participant SB as Supabase RPC (service role)
  participant PG as Postgres (pgvector)

  B->>R: POST /api/match/assignment { assignmentId, useTwoStage: true }
  R->>DB: Load assignment + verify org membership
  DB-->>R: ok

  R->>SEM: annRetrieveSimilarProfiles(assignmentId, annLimit)
  SEM->>SB: rpc(find_similar_profiles_by_embedding)
  SB->>PG: ANN search using HNSW index
  PG-->>SB: profile_ids + similarity
  SB-->>SEM: results

  alt ANN results empty
    R->>DB: Fallback: full scan matching_profiles
  else ANN results present
    R->>DB: Fetch only matching_profiles for ANN profile_ids
  end

  R->>DB: Fetch skills for candidate profiles
  R->>SEM: batchGetMissionVisionScores(profileIds, assignmentId)
  SEM-->>R: similarity scores (PAC input)
  R-->>B: ranked, scrubbed results
```

Storage touched:

- `matching_profiles`, `skills`, `assignments`, `matches` (depending on route)
- Embedding columns and RPC functions in Postgres when enabled

Failure modes:

- Missing `SUPABASE_SERVICE_ROLE_KEY` breaks semantic RPC calls (ANN stage) and embedding writes.
- If embeddings are not present, ANN returns no results and the route falls back to full scan.

Debug notes:

- Verify the pgvector migration exists and was applied: `supabase/migrations/20251109_add_embedding_columns.sql`.
- Search logs for `match.assignment.stage1.*` events (`src/app/api/match/assignment/route.ts`).

## Flow 6: Messaging With Staged Identity Reveal

Entrypoints:

- Conversation and message routes: `src/app/api/conversations/*`
- Identity reveal endpoint: `src/app/api/conversations/[conversationId]/reveal/route.ts`
- Email template: `emails/IdentityRevealed*`
- Admin Supabase client (email lookup): `src/lib/supabase/admin.ts`

```mermaid
sequenceDiagram
  autonumber
  participant B as Browser
  participant R as /api/conversations/:id/reveal
  participant S as Supabase SSR client
  participant DB as Drizzle db
  participant ADM as Supabase admin (service role)
  participant RE as Resend

  B->>R: POST reveal request
  R->>S: auth.getUser()
  S-->>R: userId
  R->>DB: Load conversation by id
  DB-->>R: conversation row
  R->>DB: Update participant_*_wants_reveal = true
  DB-->>R: updated conversation

  alt both participants want reveal
    R->>DB: Update stage = revealed, set revealed_at
    R->>ADM: auth.admin.getUserById(participant ids)
    ADM-->>R: participant emails
    R->>RE: Send IdentityRevealed email to both
    RE-->>R: ok (best-effort)
    R-->>B: 200 { revealed: true }
  else waiting for other participant
    R-->>B: 200 { waitingForOther: true }
  end
```

Storage touched:

- `conversations`, `messages`, `profiles`
- Supabase Auth user records (admin getUserById) for email addresses

Failure modes:

- Missing `RESEND_API_KEY` or `EMAIL_FROM` causes reveal emails to be skipped (logs error) while the reveal may still succeed (`src/app/api/conversations/[conversationId]/reveal/route.ts`).
- Missing service role blocks email lookup of user emails (`src/lib/supabase/admin.ts`).

Debug notes:

- Check `conversation.reveal_requested` and `conversation.revealed` logs.
- Confirm conversation stage and reveal flags in DB when debugging stuck states.

## Flow 7: OAuth Integrations (Zoom, Google, LinkedIn)

Entrypoints:

- Zoom: `src/app/api/integrations/zoom/connect/route.ts`, `src/app/api/integrations/zoom/callback/route.ts`
- Google: `src/app/api/integrations/google/connect/route.ts`, `src/app/api/integrations/google/callback/route.ts`
- LinkedIn: `src/app/api/auth/linkedin/callback/route.ts`

```mermaid
sequenceDiagram
  autonumber
  participant B as Browser
  participant C as Connect route (Zoom/Google)
  participant P as Provider OAuth
  participant K as Callback route
  participant DB as Drizzle db

  B->>C: GET /api/integrations/{provider}/connect
  C->>C: Create state + set httpOnly cookie
  C-->>B: 302 redirect to Provider OAuth

  B->>P: User approves
  P-->>B: Redirect back with code + state
  B->>K: GET /api/integrations/{provider}/callback?code&state
  K->>K: Validate state cookie
  K->>P: Exchange code for tokens
  P-->>K: access_token + refresh_token
  K->>DB: UPSERT tokens into user_video_integrations
  K-->>B: Redirect or popup-close HTML
```

Storage touched:

- `user_video_integrations` (Zoom/Google)
- `user_integrations` (LinkedIn integration storage)

Failure modes:

- State cookie missing or mismatched rejects callback.
- Redirect URI mismatch in provider console breaks token exchange.

Debug notes:

- Confirm redirect URI logic uses `NEXT_PUBLIC_SITE_URL` (and fallback) in connect/callback routes.
- Check provider-specific setup docs for env vars (`docs/LINKEDIN_VERIFICATION_SETUP.md`, `OAUTH_SETUP_GUIDE.md`).

## Flow 8: Cron Workflows (Account Deletion, Decision Reminders, Health Checks)

Entrypoints:

- Schedule: `vercel.json`
- Account deletion: `src/app/api/cron/account-deletion-workflow/route.ts`
- Decision reminders and performance health check: `src/app/api/cron/decision-reminders/route.ts`
- Supporting libs: `src/lib/email/*`, `src/lib/decisions/automation.ts`, `src/lib/analytics/health-check.ts`

```mermaid
sequenceDiagram
  autonumber
  participant VC as Vercel Cron
  participant R as /api/cron/* route
  participant DB as Drizzle db
  participant SB as Supabase admin (SSR client or service role)
  participant RE as Resend

  VC->>R: GET cron endpoint (Authorization: Bearer CRON_SECRET)
  R->>R: Verify CRON_SECRET
  alt unauthorized
    R-->>VC: 401
  else authorized
    R->>DB: Query target rows (profiles, analytics_events, etc)
    DB-->>R: rows
    opt deletion reminders or completion emails
      R->>SB: auth.admin.getUserById(userId)
      SB-->>R: email
      R->>RE: send email (best-effort)
    end
    opt deletion processing
      R->>DB: SELECT anonymize_user_account(userId)
    end
    R-->>VC: 200 JSON summary
  end
```

Storage touched:

- `profiles` (deletion scheduling flags), `analytics_events` (reminder sent idempotency)
- Other tables via `anonymize_user_account` DB function, depending on implementation

Failure modes:

- Missing `CRON_SECRET` configuration can block cron calls or, if defaulted, weaken security (check each route for defaults).
- Email failures should not break deletion processing; the code logs and continues.

Debug notes:

- Use `docs/CRON_SETUP.md` and `VERCEL_CRON_LIMIT_WORKAROUND.md` for operational constraints and schedule behavior.
