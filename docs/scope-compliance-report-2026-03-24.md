# Proofound Scope Compliance Report

Date: `2026-03-24`

## Authority

This audit uses the locked MVP authority stack in this order:

1. `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`
2. `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md`
3. `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`
4. `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md`
5. `Proofound_Project_Specification_2026-03-11.md`

Reference and audit files are treated as evidence only and do not override the locked MVP.

## Current-state inventory snapshot

- Page routes classified by `src/lib/launch/surface-policy.ts`: `47` active, `3` internal-only, `41` archived.
- API routes classified by `src/lib/launch/surface-policy.ts`: `117` active, `14` internal-only, `56` archived.
- Public launch drift found in three places:
  - archived public pages that still rendered real content
  - archived app surfaces and APIs that still expose non-MVP behavior
  - launch-visible copy and crawl surfaces that still describe a broader platform than the locked MVP

## Minimal launch allowlist

### Keep

- `/`
- `/login`, `/auth/login`, `/signup/**`, `/reset-password/**`, `/verify-email/**`, `/onboarding`
- `/accept-invite`, `/verify-work-email`
- `/privacy`, `/terms`, `/cookies`, `/cookies/settings`
- `/portfolio/[handle]`
- `/portfolio/org/[slug]`
- `/candidate-invite/[token]`, `/feedback/[token]`, `/verify/[token]`, `/verify/custom/[token]`
- Individual app corridor:
  - `/app/i/home`
  - `/app/i/profile`
  - `/app/i/portfolio`
  - `/app/i/matching`
  - `/app/i/matching/preferences`
  - `/app/i/messages`
  - `/app/i/interviews`
  - `/app/i/verifications`
  - `/app/i/settings`
  - `/app/i/settings/privacy`
  - `/app/i/settings/audit-log`
- Organization app corridor:
  - `/app/o/[slug]/home`
  - `/app/o/[slug]/matching`
  - `/app/o/[slug]/assignments`
  - `/app/o/[slug]/assignments/new`
  - `/app/o/[slug]/assignments/[id]/review`
  - `/app/o/[slug]/shortlist`
  - `/app/o/[slug]/messages`
  - `/app/o/[slug]/interviews`
  - `/app/o/[slug]/profile`
  - `/app/o/[slug]/portfolio`
  - `/app/o/[slug]/invitations/[token]`

### Internal-only

- `/admin`
- `/admin/verification`
- `/admin/audit`
- launch-critical admin and cron APIs listed as `internal_only_launch_ops` in `src/lib/launch/surface-policy.ts`

### Hard-gate

- Locked-MVP surfaces that exist in the product narrative but are intentionally still gated in the repo because they are under-implemented:
  - `/app/i/opportunities`
  - `/app/o/[slug]/candidates`
  - `/app/o/[slug]/members`
  - `/app/o/[slug]/opportunities`
  - `/app/o/[slug]/settings`
  - `/app/o/[slug]/settings/team`
  - `/app/o/[slug]/team`
- Current behavior:
  - individual gated notice: `src/app/app/i/opportunities/page.tsx`
  - org gated notices and fallback policy: `src/lib/org/mvp-surface-policy.ts`

### Archive

- Archived public marketing pages and retired public utilities
- Archived individual and organization app surfaces outside the narrow corridor
- Archived compatibility APIs that still compile but are outside launch scope

### Delete

- No additional deletions were required for this pass.
- Existing live archived APIs should be deletion candidates in a follow-up once compatibility risk is reviewed.

## Page route violations

| Surface | Current behavior | Locked-MVP expectation | Classification | Rationale |
| --- | --- | --- | --- | --- |
| `/about` via `src/app/(marketing)/about/page.tsx` | Public marketing page with broad platform copy | Not in the locked MVP sitemap or public allowlist | `hard-gate` | Archived public marketing page should not stay live |
| `/careers` via `src/app/(marketing)/careers/page.tsx` | Public careers marketing page | Not in the locked MVP public launch surface | `hard-gate` | Broadens scope and creates extra crawl surface |
| `/contact` via `src/app/(marketing)/contact/page.tsx` | Public contact page | Not in the locked MVP public launch surface | `hard-gate` | Contact should be email-based from legal pages, not a separate public surface |
| `/manifesto` via `src/app/(marketing)/manifesto/page.tsx` | Public manifesto page with broad philosophy copy | Not in the locked MVP public launch surface | `hard-gate` | Governance-heavy homepage-adjacent messaging broadens the product story |
| `/support` via `src/app/(marketing)/support/page.tsx` | Public support hub | Not in the locked MVP public launch surface | `hard-gate` | Legal/contact flows should not depend on an archived support surface |
| `/accessibility` via `src/app/accessibility/page.tsx` | Public accessibility statement | Archived by current launch policy | `hard-gate` | Launch allowlist keeps legal/cookie pages only |
| `/fairness` via `src/app/fairness/page.tsx` | Public transparency note | Archived by current launch policy | `hard-gate` | Fairness monitoring is internal and must not act like a public product surface |
| `/p/[token]` via `src/app/p/[token]/page.tsx` | Public snippet-share page | Archived by current launch policy and outside locked MVP public surface | `hard-gate` | Legacy public snippet URLs broaden the portfolio model beyond the locked MVP |
| `/p/[token]/embed` via `src/app/p/[token]/embed/page.tsx` | Embeddable public snippet page | Archived by current launch policy and outside locked MVP public surface | `hard-gate` | Legacy embed surface is outside the launch corridor |
| `/app/i/notifications` via `src/app/app/i/notifications/page.tsx` | Fully functional notification center backed by archived APIs | Archived outside locked MVP corridor | `archive` | Keeps non-MVP notification suite live |
| `/app/i/settings/notifications` via `src/app/app/i/settings/notifications/page.tsx` | Fully functional notification preferences page backed by archived APIs | Archived outside locked MVP corridor | `archive` | Keeps non-MVP notification preferences live |
| `/app/i/opportunities` via `src/app/app/i/opportunities/page.tsx` | Gated notice instead of live discovery | Surface exists in locked MVP narrative but is under-implemented | `hard-gate` | Keep gated for this pass and report as MVP gap |
| `/app/o/[slug]/settings` via `src/app/app/o/[slug]/settings/page.tsx` | Gated notice instead of live settings hub | Locked MVP names settings and audit surfaces | `hard-gate` | Keep gated for this pass and report as MVP gap |
| `/app/o/[slug]/team` via `src/app/app/o/[slug]/team/page.tsx` | Gated notice instead of live team surface | Locked MVP names org team and roles surfaces | `hard-gate` | Keep gated for this pass and report as MVP gap |

## API family violations

| API family | Representative files | Current behavior | Locked-MVP expectation | Classification | Rationale |
| --- | --- | --- | --- | --- | --- |
| Notifications API | `src/app/api/notifications/route.ts`, `src/app/api/notifications/preferences/route.ts`, `src/app/api/notifications/unread-count/route.ts` | Full in-app notification behavior remains live | Archived outside locked MVP corridor | `archive` | Broad notification suite is out of scope at launch |
| Updates API | `src/app/api/updates/route.ts` | Live update feed behavior | Archived outside locked MVP corridor | `archive` | Not part of proof-first corridor |
| Policy explainers | `src/app/api/policy/explain/route.ts` | Live policy explainer endpoint | Archived outside locked MVP corridor | `archive` | Broad policy explainer surface is not launch-critical |
| Data import adapters | `src/app/api/data-import/route.ts`, `src/app/api/data-import/preview/route.ts` | Compatibility adapters remain callable | Archived outside locked MVP corridor | `archive` | Import adapters broaden the MVP into legacy ingestion workflows |
| Legacy messages | `src/app/api/messages/route.ts`, `src/app/api/messages/[conversationId]/route.ts` | Compatibility message routes still compile and respond | Archived in favor of canonical conversations APIs | `archive` | Legacy transport expands the surface beyond the locked corridor |
| Org goals and ownership | `src/app/api/organizations/[orgId]/goals/route.ts`, `src/app/api/organizations/[orgId]/goals/[id]/route.ts`, `src/app/api/organizations/[orgId]/ownership/route.ts` | Live org-suite behavior remains present | Archived outside locked MVP corridor | `archive` | Governance-heavy org-suite APIs are outside launch scope |
| Org causes and partnerships | `src/app/api/organizations/[orgId]/causes/route.ts`, `src/app/api/organizations/[orgId]/partnerships/route.ts` | Live org-suite behavior remains present | Archived outside locked MVP corridor | `archive` | Broad org trust extensions exceed locked MVP |
| Moderation and SUS survey APIs | `src/app/api/moderation/**`, `src/app/api/feedback/sus/**`, `src/app/api/surveys/sus/**` | Live compatibility behavior remains present | Archived outside locked MVP corridor | `archive` | These are evidence-only surfaces for follow-up retirement |

## Copy, navigation, and metadata violations

| Surface | File | Current behavior before this pass | Locked-MVP expectation | Classification | Rationale |
| --- | --- | --- | --- | --- | --- |
| Landing footer nav | `src/components/landing/sections/FooterSection.tsx` | Linked to `/about`, `/contact`, `/support` | Keep launch footer to legal/cookie pages and sign-in | `keep` | Public nav must not expose archived marketing routes |
| Shared marketing layout | `src/app/(marketing)/_components/MarketingPage.tsx` | Reused `/support` as a shared trust link | Keep shared public helpers limited to launch-safe legal links | `keep` | Component defaults should not reintroduce archived routes |
| Sitemap | `src/app/sitemap.ts` | Advertised `/about`, `/manifesto`, `/careers`, `/contact`, `/support` | Keep only launch-safe static routes plus published portfolios/trust pages | `keep` | Crawl surface must match locked MVP |
| Root metadata | `src/app/layout.tsx` | Described Proofound as a broad credibility and connection platform | Describe proof-first hiring corridor centered on Proof Packs | `keep` | Root metadata sets the default product story |
| Homepage metadata | `src/app/page.tsx` | Mostly aligned, but image alt and keyword set still implied broader profile framing | Keep homepage centered on stronger signal than CVs, assignment clarity, blind review | `keep` | Homepage metadata is launch-visible |
| JSON-LD website/org descriptions | `src/lib/seo/json-ld.ts` | Described matching and collaboration layered onto public portfolios | Keep product centered on Proof Packs, privacy-safe review, and trust surfaces | `keep` | Structured data should not overstate scope |
| LLM crawl copy | `src/lib/seo/llms.ts` | Listed archived marketing pages and described a broader trust-first platform | Keep only homepage plus legal/crawl-safe surfaces | `keep` | `llms.txt` and `llms-full.txt` are public crawl surfaces |
| Landing fallback strings | `src/i18n/messages/en.json` | Described a credibility and connection platform and governance-heavy principles | Keep messaging proof-first, privacy-safe, and assignment-centered | `keep` | Fallback copy should not reintroduce broad platform language |
| README overview | `README.md` | Mixed proof-first positioning with broader platform framing and archived public pages | Keep docs aligned to locked MVP and the current public allowlist | `keep` | README is a high-visibility product description |

## Workflow mismatches

| Workflow | Current repo behavior | Locked-MVP expectation | Classification | Rationale |
| --- | --- | --- | --- | --- |
| Public marketing discovery | Archived marketing pages were reachable and indexable | Public launch should center on `/`, legal pages, published public portfolio pages, and org trust pages | `hard-gate` | Reduces drift and crawl noise |
| Legal support handoff | Privacy, terms, and cookie settings linked users to `/support` | Legal and privacy pages should use direct contact paths | `keep` | Prevents active flows from depending on archived routes |
| Individual opportunity browsing | Gated notice only | Locked MVP narrative names opportunities, but repo implementation is not ready | `hard-gate` | Keep gated and report gap |
| Org team and settings surfaces | Gated notices or redirects only | Locked MVP narrative includes team roles and settings/audit | `hard-gate` | Keep gated and report gap |
| Notification workflow | Individual pages and APIs still support full notifications behavior | Notifications are not part of the locked launch corridor | `archive` | Needs a later retirement decision for runtime handlers |

## Evidence status

### Missing or stale references

- The repo-root references `proofound-route-inventory.md` and `proofound-priority-file-map.md` are stale.
  - Current repo truth: these files live under `.artifacts/` as `.artifacts/proofound-route-inventory.md` and `.artifacts/proofound-priority-file-map.md`.
- `Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md` is missing from the repo root.

These files were treated as unavailable evidence, not as truth.

### Stale claims superseded by current repo state

- Any audit that treats the public marketing pages as launch-safe is stale relative to `src/lib/launch/surface-policy.ts`.
- Any copy surface that presents Proofound as a broad credibility, matching, or collaboration platform is stale relative to the locked MVP.

## Remaining blockers

- Archived compatibility APIs still compile and can respond at runtime. This report classifies them as archived evidence surfaces, but this pass does not delete or hard-fail them.
- Some locked-MVP pages are still intentionally gated because the repo implementation is not ready. They remain gaps, not launch-visible features.
