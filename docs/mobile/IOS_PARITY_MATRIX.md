> Doc Class: `reference-spec`
> Last Verified: `2026-05-19`

# iOS Parity Matrix (SwiftUI)

Last updated: 2026-05-19

> Launch boundary: this matrix is retained post-MVP mobile planning context only.
> It is not active MVP launch evidence. The current route-surface policy
> classifies `/api/mobile/*` as archived for the locked launch MVP, and active
> web launch work must not revive mobile BFF routes unless the MVP authority
> stack is explicitly changed.

## Scope

- Platform: iOS (SwiftUI), iPhone-first, iOS 18+.
- Locales: English + Swedish.
- Backend mode, post-MVP only: hybrid (`/api/mobile/v1/*` + direct Supabase RLS reads where safe).

## Endpoint Ownership Rules

- Direct Supabase RLS (client): simple profile reads, selected list views, realtime subscriptions.
- Mobile BFF (`/api/mobile/v1`), post-MVP only: auth-context bootstrap, matching orchestration, privacy-sensitive actions, admin views, device token registration, push delivery.
- Legacy web APIs remain unchanged and continue serving web.

## Individual Flows (I-01 to I-20)

| Flow                              | iOS Screen Module                 | Primary Data/API                                                     |
| --------------------------------- | --------------------------------- | -------------------------------------------------------------------- |
| I-01 Authenticate                 | `Auth/*`                          | Supabase Auth + `/api/mobile/v1/bootstrap`                           |
| I-02 Consent & Policies           | `Auth/Consent`                    | Supabase `user_consents` + policy docs                               |
| I-03 Guided Onboarding            | `Onboarding/*`                    | Supabase profile writes + bootstrap refresh                          |
| I-04 Profile Basics               | `Individual/Profile`              | Supabase `profiles`, `individual_profiles`                           |
| I-05 Experience & Education       | `Individual/Profile`              | Supabase `experiences`, `education`                                  |
| I-06 Mission/Vision/Values        | `Individual/Profile`              | Supabase `individual_profiles`                                       |
| I-07 Proof Packs                  | `Individual/ProofPacks`           | Proof Pack, skill, taxonomy, and proof endpoints                     |
| I-08 Attach Proofs                | `Individual/ProofPacks/Proofs`    | Upload + proof endpoints                                             |
| I-09 Request Verification         | `Individual/Verifications`        | verification endpoints                                               |
| I-10 Matching Preferences         | `Individual/Matching/Preferences` | matching profile endpoints                                           |
| I-11 Recommended Feed             | `Individual/Matching/Feed`        | `POST /api/mobile/v1/matching/feed`                                  |
| I-12 Search & Filter              | `Individual/Matching/Search`      | feed filtering + query layer                                         |
| I-13 Assignment Detail            | `Individual/Assignments/Detail`   | assignment + explain endpoints                                       |
| I-14 Apply / Interest             | `Individual/Assignments/Interest` | `POST /api/mobile/v1/matching/interest`                              |
| I-15 Messaging                    | `Shared/Messaging`                | `/api/mobile/v1/conversations`, `/api/mobile/v1/messages`            |
| I-16 Schedule Interview           | `Shared/Interviews`               | `/api/mobile/v1/interviews`                                          |
| I-17 Decision / Feedback          | `Individual/Decisions`            | decisions + feedback APIs                                            |
| I-18 Engagement Verification      | `Individual/Engagements`          | engagement verification APIs                                         |
| I-19 Post-Engagement Verification | `Individual/Verifications`        | verification APIs                                                    |
| I-20 Account & Privacy            | `Settings/Privacy`                | `/api/mobile/v1/profile/visibility`, `/api/mobile/v1/account/status` |

## Organization Flows (O-01 to O-20)

| Flow                          | iOS Screen Module                        | Primary Data/API                            |
| ----------------------------- | ---------------------------------------- | ------------------------------------------- |
| O-01 Authenticate             | `Auth/*`                                 | Supabase Auth + bootstrap persona context   |
| O-02 Org Setup & Team Roles   | `Organization/Settings`                  | org + team endpoints                        |
| O-03 Verify Org & Consent     | `Organization/Verification`              | verification APIs                           |
| O-04 Org Profile              | `Organization/Profile`                   | `/api/mobile/v1/organizations/[orgId]`      |
| O-05 Create Assignment        | `Organization/Assignments/Create`        | `/api/mobile/v1/assignments`                |
| O-06 Matching Weights & Gates | `Organization/Assignments/Weights`       | assignment payload                          |
| O-07 Publish Assignment       | `Organization/Assignments`               | assignment status updates                   |
| O-08 View Ranked Matches      | `Organization/Matching`                  | matching feed + explain                     |
| O-09 Proof Submission Review  | `Organization/Matching/SubmissionDetail` | match explain + proof-submission data       |
| O-10 Shortlist                | `Organization/Shortlist`                 | match action endpoints                      |
| O-11 Messaging                | `Shared/Messaging`                       | conversations/messages APIs                 |
| O-12 Schedule Interviews      | `Shared/Interviews`                      | `/api/mobile/v1/interviews`                 |
| O-13 Interview Feedback       | `Organization/Interviews`                | interview completion APIs                   |
| O-14 Decision / Engage        | `Organization/Decisions`                 | decisions + engagement APIs                 |
| O-15 Engagement Verification  | `Organization/Engagements`               | engagement verification APIs                |
| O-16 Issue Verifications      | `Organization/Verifications`             | verification response APIs                  |
| O-17 Manage Assignments       | `Organization/Assignments`               | assignments APIs                            |
| O-18 Team & Permissions       | `Organization/Team`                      | `/api/mobile/v1/organizations/[orgId]/team` |
| O-19 Launch Ops Snapshot      | `Organization/LaunchOps`                 | readiness and internal launch-ops evidence  |
| O-20 Org Admin & Compliance   | `Organization/Settings`                  | profile, visibility, audit, and privacy     |

## Admin Flows

| Area               | Mobile API                                    |
| ------------------ | --------------------------------------------- |
| Analytics overview | `GET /api/mobile/v1/admin/analytics/overview` |
| Moderation queue   | `GET /api/mobile/v1/admin/moderation/queue`   |

## Push Delivery

| Capability          | API / Infra                           |
| ------------------- | ------------------------------------- |
| Register APNs token | `POST /api/mobile/v1/devices/token`   |
| Disable APNs token  | `DELETE /api/mobile/v1/devices/token` |
| Delivery audit      | `push_delivery_attempts`              |
| Device registry     | `mobile_device_tokens`                |
