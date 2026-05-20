> Doc Class: `reference-spec`
> Last Verified: `2026-05-20`

# LinkedIn Verification Reference

LinkedIn verification is outside the locked MVP launch corridor. This file is retained as reference context for preserved compatibility fields and historical integration work. Do not use it as a launch checklist, active trust model, public proof signal, or reason to broaden the MVP.

Current launch behavior:

- Work email is the only launch-active account-side check on the individual verification surface.
- LinkedIn may be available as a Supabase social login provider.
- LinkedIn login is authentication only; it is not proof, verification, trust lift, public reputation, organization review lift, intro eligibility, reveal readiness, or match/ranking advantage.
- LinkedIn state is read-only history when present.
- LinkedIn state never creates proof trust, public reputation, organization review lift, intro eligibility, reveal readiness, or match/ranking advantage by itself.
- LinkedIn-flavored admin review routes were archived for launch on `2026-03-25`.
- Current manual/internal queue work uses `/api/admin/internal-ops/queues` and `/api/admin/internal-ops/queues/[id]`.

Use the current source files before making any LinkedIn-related change:

- `src/components/settings/VerificationStatus.tsx`
- `src/lib/verification/status-contract.ts`
- `src/lib/verification/tier.ts`
- `src/app/api/verification/status/route.ts`
- `src/archive/non_launch_integrations/preserved/components/settings/LinkedInVerification.tsx`
- `src/archive/non_launch_integrations/linkedin-oauth/README.md`
- `src/archive/non_launch_integrations/linkedin-enrichment/README.md`
- `src/archive/non_launch_integrations/linkedin-scraper/README.md`

## Preserved Data Shape

Compatibility fields still exist so older records can be displayed safely:

- `individual_profiles.linkedin_verification_status`
- `individual_profiles.linkedin_verification_level`
- `individual_profiles.linkedin_verified_at`
- `individual_profiles.linkedin_verification_data`
- `individual_profiles.verification_tier`
- `individual_profiles.verification_tier_source`

These fields must stay bounded as read-only account-side history. They must not be projected as public trust, candidate proof quality, portfolio credibility, organization scoring, or assignment-match advantage.

## Current User Copy Contract

The settings verification UI intentionally frames LinkedIn this way:

- `Archived for launch`
- `LinkedIn checks are outside the launch corridor. Any earlier LinkedIn signal remains read-only and never creates proof trust.`
- `LinkedIn returned an identity signal. It stays account-side only.`
- `LinkedIn workplace verification was detected. It stays account-side only.`
- `An older LinkedIn check did not complete before LinkedIn checks were removed from the launch corridor.`

Do not replace this with broad identity verification, profile credibility, social proof, or trust-tier language.

## Archived Or Reference-Only Surfaces

The following are not active MVP launch surfaces:

- `/api/admin/verification/linkedin/queue`
- `/api/admin/verification/linkedin/[userId]/review`
- broad LinkedIn public-profile scraping UX
- LinkedIn confidence-score admin dashboard tabs
- LinkedIn-based public trust badges
- LinkedIn-driven match scoring or ranking
- LinkedIn import into broad Expertise Atlas flows

The preserved non-launch implementation reference lives under:

- `src/archive/non_launch_integrations/preserved/components/settings/LinkedInVerification.tsx`
- `src/archive/non_launch_integrations/linkedin-oauth/linkedin.archived.ts`
- `src/archive/non_launch_integrations/linkedin-oauth/linkedin-oauth-context.archived.ts`
- `src/archive/non_launch_integrations/linkedin-enrichment/linkedin-enrichment.archived.ts`
- `src/archive/non_launch_integrations/linkedin-scraper/linkedin-scraper.archived.ts`

## Environment Variables

LinkedIn social login is configured in Supabase Auth, not through the archived app-side LinkedIn
verification helpers. Historical environments may still contain old LinkedIn verification variables,
but active launch code must not depend on them and they must not be added to MVP launch gates.

If a future product decision reactivates LinkedIn verification, it must define:

- the exact active user and admin routes
- consent, retention, and deletion behavior
- whether the provider is OAuth-only, official API, manual review, or another approved method
- privacy/no-leak behavior for imported or fetched profile data
- how the result is bounded so it does not overstate proof trust
- tests proving public projection, matching, reveals, and org review do not leak or over-credit LinkedIn state

## Historical Setup Notes

Older setup notes mentioned LinkedIn OAuth callbacks, optional scraping, Proxycurl, PhantomBuster, confidence scoring, admin dashboard tabs, and direct Verified on LinkedIn API scopes. Treat those as historical or post-MVP exploration only.

Do not run old setup steps such as installing browser scraping dependencies, creating confidence thresholds, using ngrok for LinkedIn verification QA, or requesting additional LinkedIn scopes as part of launch readiness.

## Verification

For current launch safety, verify LinkedIn stays bounded:

```bash
npm run test -- tests/ui/verification-status-options.test.tsx
npm run test -- tests/lib/verification-tier.test.ts
npm run test -- tests/api/launch-surface-inventory.test.ts
npm run docs:freshness
```

Expected evidence:

- the verification UI says LinkedIn is outside the launch corridor
- any existing LinkedIn signal stays account-side only
- public projection and portfolio output do not present LinkedIn as proof trust
- archived LinkedIn admin routes are not active launch surfaces
- launch docs do not make LinkedIn credentials required by default

## Change Control

Before reactivating any LinkedIn verification, scraping, enrichment, import, or trust-lift flow, record the product decision in the current sweep or launch artifact and update route-surface policy, API docs, tests, privacy docs, and public/app copy together.

Until then, this document remains reference-only for verification behavior. LinkedIn social login is covered by the active auth docs.
