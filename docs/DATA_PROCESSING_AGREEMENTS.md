> Doc Class: `active`
> Last Verified: `2026-05-19`

# Data Processing And Vendor Register

This document is a launch-safety register for vendors and processing paths that may touch Proofound
data. It is not legal advice, not a signed DPA repository, and not proof of GDPR, CCPA, SOC 2, ISO,
or SCC compliance by itself.

Use this with:

- `docs/ENV_VARIABLES.md`
- `docs/DEPLOYMENT_CHECKLIST.md`
- `docs/RESEND_SETUP.md`
- `docs/sentry-setup.md`
- `docs/SECURITY_INCIDENT_RESPONSE_RUNBOOK.md`
- `.artifacts/mvp-surface-sweep-2026-05-19/SURFACE_SWEEP.md`

Before any production-candidate or production signoff, the legal/privacy owner must verify actual
contracts, subprocessors, regions, retention terms, and transfer mechanisms outside this repository.
Do not infer a signed agreement from this file.

## Launch Processing Rules

- Minimize vendor data to what the locked MVP corridor needs.
- Do not send private proof content, raw evidence, hidden identity details, signed URLs, secrets,
  service-role data, internal queue notes, or diagnostic dumps to vendors unless the target,
  processor role, and privacy/legal approval are explicit.
- Treat optional connected-provider, LinkedIn, Veriff, OCR, and broad AI paths as conditional unless
  the current target explicitly enables them.
- Keep public projection, reveal, export/delete, upload, email, observability, and admin/internal
  data flows privacy/no-leak tested before launch.
- Record target-specific legal/privacy verification in the launch artifact, not in this guide.

## Active Or Conditional Vendor Inventory

| Vendor/path                    | Current launch posture                                                        | Data categories to minimize                                                      | Required evidence before launch signoff                                                                                                  |
| ------------------------------ | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Supabase                       | Active database, auth, storage provider                                       | account data, Proof Packs, uploaded-file metadata, workflow records, audit state | target env confirmation, RLS/privacy tests, storage policy tests, backup/restore evidence, current contract/DPA review                   |
| Vercel                         | Active hosting and function runtime                                           | request metadata, serverless logs, deployment artifacts, public assets           | production env confirmation, minimal public health, protected diagnostics, current contract/DPA/subprocessor review                      |
| Resend                         | Active transactional email provider when `RESEND_API_KEY` is configured       | recipient email, workflow email metadata, action links                           | domain verification, sampled delivery, email privacy/no-leak review, current DPA/subprocessor review                                     |
| Sentry                         | Optional launch-support observability                                         | scrubbed errors, route/release context, coarse workflow state                    | Sentry env confirmation, sample event scrub review, replay disabled unless approved, current DPA/subprocessor review                     |
| Google Gemini / AI provider    | Conditional assistive AI provider when enabled and smoke-verified             | redacted prompt context and selected proof/assignment text only                  | AI redaction tests, provider smoke artifact, hard-cap evidence, current provider terms/DPA review                                        |
| Google Cloud OCR / Document AI | Conditional and disabled by default                                           | uploaded document text/images only when explicitly enabled                       | expiry, auth, retention, budget, no-public-invocation, OCR privacy tests, current provider terms/DPA review                              |
| Google OAuth / Meet            | Conditional connected-provider path; manual-link interviews remain default    | OAuth tokens, calendar/meeting metadata only when enabled                        | `STRICT_PROVIDER_E2E_REQUIRE_CONNECTED=true` evidence only for targets that intentionally enable the flow, current provider terms review |
| LinkedIn                       | Conditional account-side/social integration only; does not create proof trust | OAuth/profile fields only when enabled                                           | route-surface policy confirmation, no trust/ranking advantage, current provider terms review                                             |
| Veriff                         | Archived/post-MVP identity-document path unless scope changes                 | government ID and biometric data only if explicitly revived                      | route remains archived unless product/legal scope changes, full privacy/legal review before any use                                      |

## No-Leak Requirements By Surface

- Public portfolios and organization trust pages must project only public-safe fields.
- Matching and review must stay blind by default until candidate-consented reveal.
- Reveal email, interview, decision, and engagement verification messages must not include hidden
  identity or private proof details beyond the authorized workflow state.
- Uploads must pass quarantine, validation, and manual-review lifecycle rules before any public
  promotion.
- Export/delete flows must remain owner-scoped, auditable, and blocked from public summary leakage.
- Admin/internal queue and audit details must remain protected and never appear in public health,
  public email, public portfolio, or support snippets.

## Evidence To Keep Current

Run the relevant checks for the affected surface:

```bash
npm run test:privacy
npm run test:privacy:extended
npm run test:launch:upload
npm run test:launch:portfolio
npm run test:launch:workflow
npm run test:e2e:privacy:strict
npm run docs:freshness
```

For production-candidate or production targets, also require:

```bash
npm run db:drift-check
npm run db:backup:checkpoint
npm run db:audit:migrations
npm run db:migrate
npm run db:restore:verify -- --checkpoint <checkpoint-dir> --out .artifacts/launch-restore-report.json
```

## Vendor Change Process

Before adding or enabling a new processing vendor:

1. Confirm the route/API/page belongs in active MVP, internal-only launch ops, archive, or post-MVP.
2. Identify the primary object and data categories the vendor would receive.
3. Remove private proof content, hidden identity details, internal notes, secrets, and diagnostics
   unless explicitly approved and necessary.
4. Verify contract/DPA, subprocessors, region, retention, deletion, and transfer mechanism with the
   legal/privacy owner.
5. Add env vars to `docs/ENV_VARIABLES.md` without secret values.
6. Add no-leak tests and route-surface tests for the affected workflow.
7. Record target-specific launch evidence in the current sweep or launch artifact.

## Incident Posture

If a vendor, log, email, AI/OCR call, public projection, or support workflow may have exposed private
data, follow `docs/SECURITY_INCIDENT_RESPONSE_RUNBOOK.md`. Do not paste private payloads into this
file, tickets, screenshots, email, or public reports.

External notification decisions require legal/privacy owner assessment. This document may help list
candidate vendors and processing paths, but it does not decide notification obligations.
