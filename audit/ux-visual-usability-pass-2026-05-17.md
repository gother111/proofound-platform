# UX Visual Usability Pass - 2026-05-17

## Verdict

Partially ready.

The public landing page and individual home surface are calm, coherent, and easy to understand on desktop and mobile. The app navigation is simple, with clear desktop side navigation and a useful mobile bottom bar.

Two app-surface issues made the experience feel less reliable before fixes:

- Matching could leave users in a placeholder state for too long when the matching data path was slow.
- Mobile privacy controls could clip content and buttons inside the main card, making the page feel cramped and unfinished.

Both issues were addressed in this pass.

## Surfaces Checked

- Desktop landing: `/`
- Mobile landing: `/`
- Desktop individual home: `/app/i/home`
- Mobile individual home: `/app/i/home`
- Desktop profile: `/app/i/profile?profileView=full&tab=proof_packs`
- Mobile profile: `/app/i/profile?profileView=full&tab=proof_packs`
- Desktop matching: `/app/i/matching`
- Mobile matching: `/app/i/matching`
- Desktop privacy settings: `/app/i/settings/privacy`
- Mobile privacy settings: `/app/i/settings/privacy`
- Public unavailable portfolio state: `/portfolio/demo`

Screenshots were captured under:

- `.artifacts/ux-visual-pass-2026-05-17/`

## Findings

### P1 - Matching slow state overwhelmed users with placeholders

Affected surface: `/app/i/matching`

Evidence:

- The page initially stayed on `Preparing matches...` with skeleton cards.
- On the local signed-in account, the useful browse-readiness state appeared only after a long wait.

Fix:

- Reduced the matching data wait from 30 seconds to 10 seconds.
- Added a calm fallback panel with clear actions:
  - `Retry matching`
  - `Review proof readiness`

### P2 - Mobile privacy settings clipped controls

Affected surface: `/app/i/settings/privacy`

Evidence:

- On a 390px mobile viewport, the privacy overview card extended beyond the visible content area.
- Buttons such as `Download my data` and `View account history` were visibly clipped.

Fix:

- Made the privacy settings content container explicitly full-width and shrink-safe.
- Changed the privacy overview action group to one-column mobile buttons.
- Changed the visibility summary grid to one column on mobile.
- Added shrink/wrap behavior to the card header content.

### P3 - Profile loading state looked blank

Affected surface: `/app/i/profile?profileView=full&tab=proof_packs`

Evidence:

- The profile page can show blank skeleton blocks while full profile data/editor code loads.

Fix:

- Added a visible loading label and short reassurance copy so the page feels intentional while loading.

## Verification

Browser:

- Desktop and mobile screenshots captured before and after fixes.
- Mobile privacy settings rechecked at `390x844`; content no longer clipped.
- Mobile matching rechecked; slow state now resolves to a clear retry/review panel.
- Mobile profile rechecked; loading state now has visible explanation.

Automated checks:

- `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test -- tests/ui/matching-page-gated.test.tsx tests/ui/privacy-overview-copy.test.tsx tests/ui/settings-privacy-visibility-placement.test.tsx` - pass
- `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run lint` - pass
- `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run typecheck` - pass
- `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run docs:freshness` - pass with existing warning-mode orphan-doc warnings

Note:

- The first focused test run without the Node 24 path failed because the default shell Node is too old for the current Vite dependency.
- The sandboxed Node 24 test run hit a local websocket bind restriction, then passed when rerun with permission.

## Remaining Risks

- Matching data itself can still be slow; this pass prevents the UI from feeling stuck but does not optimize the underlying matching request.
- Profile full-load can still take noticeable time; this pass makes the wait clearer rather than changing profile data loading behavior.

## Continuation Pass - Broader Readiness Sweep

### Updated Verdict

Partially ready, materially closer.

The core experience now feels calmer and easier to navigate across the main public,
individual, organization, signup, matching, communications, and privacy surfaces
tested in Browser. The UI is not yet finished at a full product-design level:
some lower-traffic public/auth and organization recovery surfaces would still
benefit from a deeper visual-system consolidation pass. The high-friction items
found in the broader sweep were safe frontend polish issues and were fixed.

### Additional Surfaces Checked

- Mobile and desktop landing: `/`
- Mobile signup choice: `/signup`
- Mobile individual signup: `/signup/individual`
- Mobile communications hub: `/app/i/communications`
- Mobile matching empty state: `/app/i/matching`
- Mobile privacy controls: `/app/i/settings/privacy`
- Organization home launch summary: `/app/o/[slug]/home`
- Assignment builder and review layout code paths
- Sitemap/public login URL exposure

Additional screenshots were captured under:

- `.artifacts/ux-readiness-continuation-2026-05-17/`

### Additional Findings And Fixes

#### P1 - Mobile landing hid the ordinary sign-in path

Affected surface: `/`

Evidence:

- Mobile header only exposed the organization-biased pilot action.
- An ordinary returning user had to scroll or infer where sign-in lived.

Fix:

- Added mobile-visible `Sign in`.
- Changed the mobile primary header action to neutral `Start`.
- Kept the organization `Request a pilot` action on desktop.

#### P1 - Communications hub presented too many overlapping choices

Affected surface: `/app/i/communications`

Evidence:

- Four top-level choices duplicated two actual workstreams, making the page feel
  more complex than the product behavior.

Fix:

- Reduced the hub to two clear choices: `Messages` and `Interviews`.
- Preserved legacy query compatibility by routing old `decisions` requests to
  interviews and old `intros` requests to messages.

#### P2 - Mobile privacy field controls were dense and hard to operate

Affected surface: `/app/i/settings/privacy`

Evidence:

- Field visibility rows squeezed text and selects into one horizontal row on
  mobile.

Fix:

- Stacked each privacy field row on mobile.
- Made selects and the save action full-width on mobile.

#### P2 - Matching empty state repeated similar proof actions

Affected surface: `/app/i/matching`

Evidence:

- Two actions pointed users toward similar proof-readiness work, increasing
  choice friction.

Fix:

- Kept one proof-readiness action.
- Replaced the duplicate with a privacy-review action.

#### P2 - Organization readiness used cryptic status shorthand

Affected surface: `/app/o/[slug]/home`

Evidence:

- The launch summary badge displayed `/3`, and individual trust rows used
  color-only dots.

Fix:

- Changed the summary badge to `{ready}/3 ready`.
- Added visible `Ready` and `Needed` labels beside each status dot.

#### P2 - Assignment builder and review layouts were desktop-first

Affected surfaces:

- `/app/o/[slug]/assignments/new`
- `/app/o/[slug]/assignments/[id]/review`

Evidence:

- The full stepper and review header/action layout were likely cramped on mobile.

Fix:

- Added a compact mobile step summary in the builder.
- Hid the full stepper until desktop/tablet width.
- Stacked review page header actions and practical-detail grids on mobile.

#### P3 - Signup felt heavier than needed on mobile

Affected surfaces:

- `/signup`
- `/signup/individual`
- `/signup/organization`

Evidence:

- The signup choice and form cards used desktop-scale padding on mobile.
- Signup form copy created more pressure than needed for the first step.

Fix:

- Reduced mobile card padding.
- Calmed the signup form introduction copy.

#### P3 - Sitemap advertised duplicate login URLs

Affected surface: public sitemap

Evidence:

- `/login` and `/auth/login` were both listed.

Fix:

- Kept the compatibility route but removed `/auth/login` from the sitemap.

### Continuation Verification

Browser:

- Desktop and mobile screenshots captured for the broader pass.
- Mobile rechecks captured after fixes for landing, signup choice, individual
  signup, communications, matching empty state, and privacy controls.
- Checked mobile horizontal overflow on the reworked surfaces; no overflow was
  detected on the tested routes.

Automated checks:

- `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test -- tests/ui/matching-page-gated.test.tsx tests/ui/privacy-overview-copy.test.tsx tests/ui/settings-privacy-visibility-placement.test.tsx tests/api/sitemap.test.ts tests/routes/portfolio-shortcuts.test.tsx` - pass
- `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run lint` - pass
- `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run typecheck` - pass
- `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run docs:freshness` - pass with existing warning-mode orphan-doc warnings

### Remaining Risks From Broader Sweep

- Public portfolio headers still deserve a separate, deeper pass to reduce
  equal-weight actions on mobile.
- Reset/verify and candidate-invite screens still show some older visual-system
  density compared with the redesigned public and app surfaces.
- Organization empty/recovery states could be simplified further, but the most
  visible readiness and assignment surfaces are calmer after this pass.

## Final Continuation - Remaining UX Risk Polish

### Updated Verdict

Partially ready, now close for the main MVP surfaces.

The primary public, individual, privacy, matching, signup, communications, and
organization readiness paths now feel calm and navigable on the tested mobile
and desktop viewports. The remaining concern is no longer obvious blocking
friction; it is a product-design finishing pass across less-traveled token,
invite, and recovery edge states.

### Additional Findings And Fixes

#### P2 - Public portfolio mobile header had too many equal-weight actions

Affected surface: `/portfolio/[handle]`

Fix:

- Kept sharing visible, but moved PDF/text export actions out of the smallest
  mobile header treatment.
- Removed the duplicate `Request contact` hero CTA and kept `Request
introduction` as the single primary visitor action.
- Clarified that private details remain hidden unless explicitly revealed.

#### P2 - Reset and verification screens felt older than the current Proofound UI

Affected surfaces:

- `/reset-password`
- `/reset-password/confirm`
- `/verify-email`

Fix:

- Moved the screens onto the warm Proofound auth card treatment.
- Calmed copy and punctuation.
- Stacked verification-error actions on mobile.
- Added an accessible label for the password visibility toggle.

#### P2 - Organization no-match recovery offered too many simultaneous actions

Affected surface: organization matching assignment empty state

Fix:

- Reframed the empty state as one clear primary next step.
- Moved secondary recovery choices below a divider as quieter alternatives.

#### P3 - Candidate invite completion/action areas were dense on mobile

Affected surface: `/candidate-invite/[token]`

Fix:

- Stacked final review actions on mobile.
- Kept `Open Proof Packs` as the primary completion action.
- Converted secondary completion actions to quieter text links.

### Final Continuation Browser Verification

Browser screenshots were captured under:

- `.artifacts/ux-readiness-final-continue-2026-05-17/`

Verified with the in-app Browser:

- Mobile `/reset-password` - no horizontal overflow; centered calm auth card.
- Mobile `/verify-email` - no horizontal overflow; centered loading state.
- Mobile `/reset-password/confirm` - no horizontal overflow; centered reset-link state.
- Mobile `/app/i/matching` - no horizontal overflow; slow matching resolves to
  the retry/review fallback.
- Desktop `/reset-password`, `/verify-email`, and `/app/i/matching` - no
  horizontal overflow at 1280px.

### Final Continuation Automated Checks

- `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test -- tests/ui/candidate-invite-client.test.tsx tests/ui/matching-organization-view-beta.test.tsx tests/ui/public-portfolio-page.test.tsx tests/routes/portfolio-shortcuts.test.tsx` - pass
- `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run lint` - pass
- `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run typecheck` - pass
- `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run docs:freshness` - pass with existing warning-mode orphan-doc warnings

### Remaining Follow-Up

- Public portfolio pages could still use a fuller visual-composition review with
  real accessible portfolio data rather than the unavailable/demo local route.
- Candidate invite token states should be visually checked with a real valid
  invite token when one is available.
- Organization matching empty states were improved in code and tests; a live org
  account with an assignment but no matches would be the strongest final visual
  confirmation.

## Edge-State Continuation - Token And Public Org Polish

### Updated Verdict

Partially ready, with edge states now aligned closely enough for MVP review.

This continuation focused on screens users usually see only when something is
pending, invalid, expired, or minimally public. These surfaces now feel more
intentional and less like raw system states.

### Additional Findings And Fixes

#### P2 - Work-email verification still used an older utility-card treatment

Affected surface: `/verify-work-email`

Fix:

- Moved loading, success, and error states onto the warm Proofound auth card
  treatment.
- Reduced oversized icons to the same quiet status-circle pattern used by reset
  and email verification.
- Calmed copy and button labels.
- Updated the Suspense fallback to match the same visual language.

#### P2 - Candidate invite loading/unavailable states felt too bare

Affected surface: `/candidate-invite/[token]`

Fix:

- Added an intentional loading card that explains invite/account checking.
- Restyled unavailable invites as a centered card with a clear next step.
- Added a `Return home` action for dead-end invite links.

#### P3 - Organization public portfolio header still exposed desktop actions on mobile

Affected surface: `/portfolio/org/[slug]`

Fix:

- Kept return/share/website visible.
- Hid organization PDF export from the smallest header treatment.
- Made footer labels wrap cleanly.

### Edge-State Browser Verification

Browser screenshots were captured under:

- `.artifacts/ux-readiness-edge-continue-2026-05-17/`

Verified with the in-app Browser:

- Mobile `/verify-work-email` - no horizontal overflow; calm centered loading
  state.
- Mobile `/candidate-invite/not-a-real-token` - no horizontal overflow; loading
  then unavailable card.
- Mobile `/portfolio/org/demo` and `/portfolio/demo` - no horizontal overflow on
  the local edge routes.
- Desktop `/verify-work-email`, `/candidate-invite/not-a-real-token`, and
  `/portfolio/org/demo` - no horizontal overflow at 1280px.

### Edge-State Automated Checks

- `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test -- tests/ui/candidate-invite-client.test.tsx tests/ui/public-org-portfolio-page.test.tsx tests/api/launch-page-inventory.test.ts tests/lib/work-email-delivery.test.ts` - pass
- `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run lint` - pass
- `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run typecheck` - pass
- `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run docs:freshness` - pass with existing warning-mode orphan-doc warnings

### Remaining Follow-Up

- A real valid candidate invite token should still be checked visually for the
  full accepted/submitted path.
- Real public organization and individual portfolio data should be used for a
  final visual-composition pass; the local demo routes mainly prove edge-state
  containment and responsive behavior.

## Token And Dead-End Continuation - Archived, Invite, Feedback, Verification

### Updated Verdict

Partially ready, with the remaining reachable dead-end and token-error surfaces
now calm enough for MVP review.

This pass focused on routes users see when something is missing, invalid,
expired, archived, or still loading. The key improvement was removing the sense
that these states are broken or outside the product's visual system.

### Additional Findings And Fixes

#### P2 - Archived launch fallback overflowed on mobile

Affected surface: middleware archived-page fallback

Evidence:

- Browser at 390px showed horizontal overflow on an unknown route because the
  archived route detail did not wrap inside the card.

Fix:

- Added border-box sizing, hidden horizontal overflow, and `overflow-wrap:
anywhere` for the long route detail text.
- Tightened mobile card padding/radius for the fallback HTML.

#### P2 - Organization invite dead ends felt bare

Affected surface: `/accept-invite`

Fix:

- Added a shared unavailable invite card for missing, invalid, expired, or
  revoked invite links.
- Added a clear `Return home` action.
- Restyled the valid invite card with the warm Proofound treatment.

#### P2 - Public verification token errors felt like generic utility screens

Affected surfaces:

- `/verify/[token]`
- `/verify/custom/[token]`

Fix:

- Restyled loading, error, non-pending, and submitted states with warm centered
  cards and quiet status circles.
- Changed generic `Go to Homepage` copy to `Return home`.

#### P3 - Public feedback token states needed calmer edge handling

Affected surface: `/feedback/[token]`

Fix:

- Moved the page into the same warm card shell.
- Made expired and already-submitted states feel intentional instead of raw
  inline status text.

### Token Edge Browser Verification

Browser screenshots were captured under:

- `.artifacts/ux-readiness-token-edge-2026-05-17/`

Verified with the in-app Browser:

- Mobile archived fallback route - no horizontal overflow after fix.
- Mobile `/accept-invite` missing-token state - no horizontal overflow.
- Mobile `/verify/custom/not-a-real-token` and `/verify/not-a-real-token` - no
  horizontal overflow; clear return action.
- Mobile `/feedback/not-a-real-token` - no horizontal overflow; falls into the
  calm not-found treatment.
- Desktop archived fallback, accept invite, and verification token error routes
  - no horizontal overflow at 1280px.

### Token Edge Automated Checks

- `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test -- tests/api/launch-page-inventory.test.ts tests/api/custom-verification-routes.test.ts tests/api/verify-impact-token-route.test.ts` - pass
- `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test -- src/lib/__tests__/middleware-launch-archive.test.ts` - pass
- `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test -- tests/ui/archived-mvp-routes.test.ts` - pass
- `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run lint` - pass
- `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run typecheck` - pass
- `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run docs:freshness` - pass with existing warning-mode orphan-doc warnings

### Remaining Follow-Up

- The full pending verification forms should still be checked with real valid
  verification tokens; this pass verified invalid/loading/dead-end behavior.
- `/403` was already dirty before this pass, so it was inspected but left
  untouched to avoid overwriting unrelated work.

## Settings Hub Continuation - Mobile Clarity And Containment

### Updated Verdict

Partially ready, with the individual settings hub now mobile-contained and less
overwhelming at the top-level control row.

### Additional Findings And Fixes

#### P2 - Settings tabs and long email could clip on mobile

Affected surface: `/app/i/settings`

Evidence:

- Browser at 390px showed the tab row pushing into the right edge and a long
  account email competing with the `Change Email` action on the same row.
- The page did not report document-level horizontal overflow, but visible
  content felt clipped and crowded because the controls sat too close to the
  viewport edge.

Fix:

- Added a shrink-safe settings content container.
- Put the settings tabs in a contained horizontal scroll area and shortened
  mobile-visible tab labels to `Interviews` and `Privacy`.
- Preserved full accessible tab names with `aria-label` so screen readers still
  announce `Interview Scheduling` and `Privacy & Data`.
- Made the account email row stack on mobile, wrap long email addresses, and
  keep the `Change Email` button inside the card.

### Settings Browser Verification

Browser screenshots were captured under:

- `.artifacts/ux-readiness-settings-expertise-2026-05-17/`

Verified with the in-app Browser:

- Mobile `/app/i/settings` at 390px - tabs, long email, and edit action remain
  contained with no horizontal overflow.
- Mobile `/app/i/settings?tab=privacy` at 390px - active tab remains clear and
  privacy controls remain readable with no horizontal overflow.
- Desktop `/app/i/settings` at 1280px - full tab labels remain visible and no
  horizontal overflow.
- Mobile archived surfaces such as `/app/i/expertise` and
  `/app/i/settings/fairness` correctly remain outside the locked launch MVP
  corridor and were not widened.

### Settings Automated Checks

- `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test -- tests/ui/settings-privacy-visibility-placement.test.tsx tests/ui/settings-integrations-discoverability.test.tsx tests/ui/launch-discoverability.test.tsx` - pass

### Remaining Follow-Up

- The settings content still has several deep account/security sections below
  the fold; this pass kept behavior unchanged and only fixed the mobile
  containment/readability problem at the top of the settings hub.

## Individual Core Continuation - Home, Profile, Portfolio Readiness

### Updated Verdict

Partially ready, with the individual profile and portfolio-redirect path now
less crowded on mobile and clearer about why the Public Page is locked.

### Additional Findings And Fixes

#### P2 - Full profile first mobile viewport was dominated by readiness chrome

Affected surfaces:

- `/app/i/profile?profileView=full&tab=proof_packs`
- `/app/i/profile?profileView=full&tab=visibility`
- `/app/i/portfolio` redirect target when Public Page is locked

Evidence:

- Browser at 390px showed the readiness banner plus large blank avatar taking
  nearly the whole first viewport before users reached the actual proof or
  visibility work.

Fix:

- Reduced mobile padding in the readiness banner.
- Reduced mobile hero spacing and avatar size while keeping desktop sizing.
- Kept the same proof-readiness checklist and trust language, but made the
  first mobile screen less visually heavy.

#### P2 - Public Page lock notice appeared too low after portfolio redirect

Affected surface: `/app/i/portfolio` redirect to locked profile state

Evidence:

- Browser showed the lock notice below the hero, where it could be crowded by
  the mobile bottom navigation and feel like an afterthought.

Fix:

- Moved the lock notice immediately under the readiness banner and before the
  profile hero.
- Retuned the notice from generic amber warning styling to Proofound
  terracotta/neutral styling.

### Individual Core Browser Verification

Browser screenshots were captured under:

- `.artifacts/ux-readiness-individual-core-2026-05-18/`

Verified with the in-app Browser:

- Mobile `/app/i/home` at 390px - no horizontal overflow; primary proof action
  remains clear.
- Mobile full profile Proof Packs tab at 390px - no horizontal overflow; compact
  readiness and hero fit better in the first viewport.
- Mobile `/app/i/portfolio` locked redirect at 390px - no horizontal overflow;
  lock notice appears before the hero.
- Desktop full profile at 1280px - no horizontal overflow; full desktop
  readiness layout remains intact.
- Desktop `/app/i/portfolio` locked redirect at 1280px - no horizontal overflow;
  lock notice appears near the top of the flow.

Note:

- One Browser attempt to `/app/i/portfolio` hit the local app error boundary
  because the server-side completion query temporarily failed DNS resolution to
  the Supabase pooler. A retry succeeded and verified the UI path.

### Individual Core Automated Checks

- `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test -- tests/ui/editable-profile-purpose-gating.test.tsx tests/ui/guided-profile-setup-view.test.tsx tests/ui/portfolio-readiness-checklist.test.tsx tests/ui/public-portfolio-ready-step.test.tsx tests/ui/left-nav-portfolio-gating.test.tsx` - pass

### Remaining Follow-Up

- Full profile data loading can still take several seconds in local Browser
  checks. The loading state is now explicit, but performance/data availability
  remains a separate reliability concern from this visual pass.

## Locked Portfolio Continuation - Readiness Copy Clarity

### Updated Verdict

Partially ready, with the locked Public Page path now clearer and less
contradictory for ordinary users.

### Additional Findings And Fixes

#### P2 - Locked Public Page copy mixed incomplete and completed wording

Affected surface:

- `/app/i/profile?profileView=full&tab=proof_packs&portfolioLocked=1&lockReason=safe_shell`

Evidence:

- Browser at 390px showed the lock notice saying the safe shell was incomplete
  while nearby checklist copy used completed-sounding labels such as `Safe shell
is complete`.
- This made the blocked state feel harder to trust even though the layout was
  contained.

Fix:

- Changed checklist labels to neutral nouns: `Safe shell basics` and
  `Public Page publication`.
- Changed the lock notice to `Public Page is locked until the safe-shell basics
are finished.`
- Applied the same safe-shell label to the deferred profile readiness preview
  so loading/preview and loaded states use the same language.

### Locked Portfolio Browser Verification

Browser screenshots were captured under:

- `.artifacts/ux-readiness-locked-portfolio-2026-05-18/`

Verified with the in-app Browser:

- Mobile locked profile/portfolio state at 390px - no horizontal overflow; lock
  notice and checklist wording now agree.
- Desktop locked profile/portfolio state at 1280px - no horizontal overflow;
  same neutral checklist wording is present.

### Locked Portfolio Automated Checks

- `PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run test -- tests/ui/portfolio-readiness-checklist.test.tsx tests/ui/editable-profile-purpose-gating.test.tsx tests/ui/left-nav-portfolio-gating.test.tsx` - pass

### Remaining Follow-Up

- The readiness banner still summarizes several conditions above the fold; this
  pass only clarified contradictory lock/checklist wording.

## Verifications Filled-State Continuation - Empty And Seeded Coverage

### Updated Verdict

Partially ready, improved for mobile clarity.

The verification request surface now has explicit Browser coverage for both
empty and filled states. Empty incoming requests remain calm and understandable,
while seeded local visual data proves the page can handle pending, accepted,
failed, bundled, long-email, long-proof-title, and long-outcome content without
horizontal overflow.

### Additional Findings And Fixes

#### P2 - Mobile verification filters overloaded the first viewport

Affected surface:

- `/app/i/verifications`

Evidence:

- Codex Browser with seeded local visual data at 390px showed seven status
  filter chips plus sort controls before the user reached the first proof
  request.

Fix:

- Added a local-only visual fixture path gated by
  `NEXT_PUBLIC_USE_MOCK_SUPABASE=true` and `PROOFOUND_VISUAL_FIXTURES=true`.
- Replaced the mobile status chip wall with one `Show requests` selector.
- Kept the richer chip controls on larger screens.
- Updated focused UI tests to account for the mobile selector and desktop chips
  both exposing the same status labels.

### Browser Verification

Verified with the Codex in-app Browser:

- Mobile filled `/app/i/verifications` at 390px - no horizontal overflow; two
  incoming seeded records render with long proof context.
- Mobile sent tab at 390px - no horizontal overflow; long reviewer email wraps
  inside the request card.
- Desktop filled `/app/i/verifications` at 1280px - no horizontal overflow;
  desktop filter chips remain available.
- Mobile empty incoming `/app/i/verifications` at 390px without
  `PROOFOUND_VISUAL_FIXTURES` - no horizontal overflow; empty state remains
  clear.

### Automated Checks

- `npm run test -- tests/ui/verifications-client.test.tsx tests/ui/verifications-page.test.tsx`
  - pass
- `npm run lint` - pass
- `npm run typecheck` - pass

## Messages Filled-State Continuation - List And Thread Coverage

### Updated Verdict

Partially ready, improved for seeded mobile thread review.

The messages surface now has Browser coverage for both empty and filled states.
The empty state remains clear, and local visual fixtures prove the list and
thread can handle masked conversations, revealed conversations, unread counts,
long assignment titles, and multi-message history without horizontal overflow.

### Additional Findings And Fixes

#### P2 - Filled message fixtures initially produced misleading realtime noise

Affected surface:

- `/app/i/messages`

Evidence:

- Codex Browser with seeded visual conversations showed the thread correctly,
  but the local fixture attempted to open a real realtime channel and surfaced a
  false reconnect toast.

Fix:

- Added local-only messaging fixtures gated by
  `NEXT_PUBLIC_USE_MOCK_SUPABASE=true` and `PROOFOUND_VISUAL_FIXTURES=true`.
- Disabled realtime subscriptions for `visual-*` seeded conversations so the
  Browser fixture shows stable UI state rather than false infrastructure noise.
- Shortened the mobile composer helper from a long sentence into a compact
  privacy note.
- Changed seeded timestamps to relative past times so the list never shows
  future-looking copy.

### Browser Verification

Verified with the Codex in-app Browser:

- Mobile empty `/app/i/messages` at 390px - no horizontal overflow; empty copy
  explains when conversations appear.
- Mobile filled `/app/i/messages` at 390px - no horizontal overflow; two seeded
  conversations render with unread count, masked status, long assignment title,
  and revealed reviewer.
- Mobile filled masked thread at 390px - no horizontal overflow; reveal status,
  messages, input, send action, and compact privacy helper remain usable.
- Desktop filled `/app/i/messages` at 1280px - no horizontal overflow; split
  list/detail layout remains calm.

### Automated Checks

- `npm run test -- tests/api/conversations-route.test.ts tests/api/conversation-detail-routes.test.ts tests/routes/organization-messages-page.test.tsx`
  - pass
- `npm run test -- tests/api/messages-legacy-route.test.ts`
  - skipped by repo test config because this file is in the default excluded
    non-launch route list.
- `npm run lint` - pass
- `npm run typecheck` - pass

## Organization Surface Continuation - Sparse And Filled Coverage

### Updated Verdict

Partially ready, improved for the organization home/profile corridor.

The organization home and profile surfaces now have Browser coverage for sparse
mock data and local filled-state fixture data. The pass fixed the awkward
desktop home hero composition, clarified the compressed mobile organization
navigation labels, and made the filled profile form calmer by avoiding internal
textarea scroll for representative content.

### Additional Findings And Fixes

#### P2 - Organization mobile navigation labels were clipped

Affected surfaces:

- `/app/o/test-org/home`
- `/app/o/test-org/profile`

Evidence:

- Codex Browser at 390px showed bottom navigation labels such as
  `Assignme...`, `Communi...`, `Organizati...`, and `Public Pre...`.

Fix:

- Kept full desktop labels and accessible labels.
- Added short mobile labels for the organization corridor: `Work`, `Inbox`,
  `Profile`, and `Preview`.

#### P2 - Organization home desktop hero squeezed the main copy

Affected surface:

- `/app/o/test-org/home`

Evidence:

- Codex Browser at 1280px showed the hero title/copy squeezed into a narrow
  column beside the primary CTA, leaving unnecessary blank space.

Fix:

- Reworked the hero content into a simple icon/copy grid with the primary CTA
  below the copy on larger screens.
- Preserved the existing mobile stack.

#### P3 - Filled profile form hid representative text in small internal scroll areas

Affected surface:

- `/app/o/test-org/profile`

Evidence:

- Codex Browser with local filled fixtures at 390px showed long mission/context
  values inside small textareas, with internal scrolling.

Fix:

- Added a local-only filled organization fixture gated by
  `NEXT_PUBLIC_USE_MOCK_SUPABASE=true`, `MOCK_ORG_MODE=true`, and
  `PROOFOUND_VISUAL_FIXTURES=true`.
- Increased the profile textarea heights for representative filled content.
- Changed the unchanged form submit state from a disabled `Save organization
profile` button to `No changes to save` with the helper `Edit a field to
enable saving.`

### Browser Verification

Verified with the Codex in-app Browser:

- Mobile sparse `/app/o/test-org/home` at 390px - no horizontal overflow; first
  action is `Complete organization profile`; bottom nav labels are readable.
- Desktop sparse `/app/o/test-org/home` at 1280px - no horizontal overflow; hero
  title/copy and CTA are balanced.
- Mobile sparse `/app/o/test-org/profile` at 390px - no horizontal overflow;
  launch profile state and form are understandable.
- Desktop sparse `/app/o/test-org/profile` at 1280px - no horizontal overflow;
  profile form and launch corridor summary are composed.
- Mobile filled `/app/o/test-org/home` at 390px - no horizontal overflow; seeded
  organization is ready and primary action changes to `Create assignment`.
- Desktop filled `/app/o/test-org/home` at 1280px - no horizontal overflow;
  seeded readiness and queue states remain clear.
- Mobile filled `/app/o/test-org/profile` at 390px - no horizontal overflow; no
  seeded textarea has internal scroll; unchanged form explains `No changes to
save`.
- Desktop filled `/app/o/test-org/profile` at 1280px - no horizontal overflow;
  seeded trust cards, form, and readiness summary remain readable.

### Automated Checks

- `npm run test -- tests/ui/organization-trust-profile-page.test.tsx` - pass
- `npm run lint` - pass
- `npm run typecheck` - pass
- `npm run docs:freshness` - pass in warning mode with the existing 32 orphan
  document warnings.

## Accept Invite Continuation - Stable Valid Organization Invite Fixture

### Findings Fixed

#### P2 - Valid organization invite acceptance lacked stable visual coverage

Affected surface:

- `/accept-invite?token=visual-org-member-invite-000000001`

Evidence:

- The real valid organization invite path needs an authenticated user,
  capability token inspection, and admin invite records, so the UX pass could
  only cover missing/invalid invite states without a local fixture.
- That left the highest-intent invite workflow unverified for mobile wrapping,
  long organization mission text, invited email overflow, success feedback, and
  the post-acceptance next action.

Fix:

- Added a local-only organization invite visual fixture gated by
  `NEXT_PUBLIC_USE_MOCK_SUPABASE=true`, `PROOFOUND_VISUAL_FIXTURES=true`, and
  non-production `VERCEL_ENV`.
- Added a focused visual accept client that keeps the simulated acceptance
  local, then replaces the primary action with a clear success state and
  workspace next step.
- Wrapped long organization names, mission copy, roles, and invited emails so
  mobile users do not get clipped text or horizontal scrolling.

### Browser Verification

Verified with the Codex in-app Browser:

- Mobile valid organization invite at 390px - initial state shows one clear
  action, organization details, role, and invited email with no horizontal
  overflow.
- Mobile accepted state at 390px - success feedback appears through a focused
  status message and the next action changes to `Open organization workspace`,
  with no horizontal overflow.
- Desktop valid organization invite at 1280px - initial state remains composed
  and centered with no horizontal overflow.
- Desktop accepted state at 1280px - success feedback and workspace next action
  remain composed with no horizontal overflow.

Evidence file:

- `.artifacts/ux-browser-goal-2026-05-18/accept-invite/visual-accept-invite-browser-state.json`

### Automated Checks

- `npm run test -- tests/ui/accept-invite-visual-client.test.tsx tests/ui/confirm-reset-password-form.test.tsx`
  - pass

## Organization Signup Continuation - Current Route Proof

### Updated Verdict

The organization signup route is no longer a Browser evidence risk in the
local mock UX pass.

The full coverage matrix still carried an older risk note saying
`/signup/organization` redirected to login during local validation. A fresh
Codex in-app Browser pass against the current implementation proved the direct
route, query-param entry route, mobile validation state, and mock success
handoff.

### Browser Verification

Verified with the Codex in-app Browser:

- Mobile `/signup/organization` at 390px - organization form renders directly
  with 316px-wide fields, named password reveal, consent controls, social
  actions, and no horizontal overflow.
- Mobile empty submit at 390px - the validation summary says
  `Please enter your email address.`, receives focus, and the route stays on
  `/signup/organization`.
- Mobile valid mock submit at 390px - keyboard-entered fixture credentials and
  required consent produce the `Check your email` success handoff with
  `Return to login`, no redirect to the login form, and no horizontal overflow.
- Narrow mobile initial render at 375px - the organization form renders with
  no horizontal overflow.
- Desktop `/signup/organization` at 1280px - the form remains centered and
  composed with no horizontal overflow.
- Desktop `/signup?type=organization` at 1280px - resolves into the
  organization form rather than the choice screen, with no horizontal overflow.

Evidence file:

- `.artifacts/ux-browser-goal-2026-05-18/organization-signup/browser-state.json`

### Automated Checks

- No product code changed in this continuation. The relevant verification is
  Browser-rendered evidence plus `npm run docs:freshness` for the audit/matrix
  update.

## Coverage Matrix Continuation - Token Fixture Risk Reconciliation

### Updated Verdict

The full coverage matrix no longer treats all valid token workflows as one
undifferentiated open risk.

Several deterministic local fixtures now prove the valid-state UX for the
public token workflows that previously depended on production-like signed
links. The remaining risk is narrower: real signed staging or production links
can still vary by data shape, expiry, and credentials, but the main visual
states are no longer missing from Browser evidence.

### Evidence Reconciled

- Email verification success:
  `.artifacts/ux-browser-goal-2026-05-18/verify-email/success-email-browser-state.json`
- Reset password confirm form, mismatch validation, and success:
  `.artifacts/ux-browser-goal-2026-05-18/reset-password-confirm/success-reset-browser-state.json`
- Work-email verification success:
  `.artifacts/ux-browser-goal-2026-05-18/work-email-verify/success-work-email-browser-state.json`
- Organization invite initial and accepted states:
  `.artifacts/ux-browser-goal-2026-05-18/accept-invite/visual-accept-invite-browser-state.json`
- Feedback token initial, validation, and submitted states:
  `.artifacts/ux-browser-goal-2026-05-18/feedback-token/visual-feedback-browser-state.json`
- Public verifier skill/custom filled and response states:
  recorded in this audit under
  `Verifier Link Continuation - Filled Skill And Custom Request States`.

### Matrix Update

- Marked `/verify-email`, `/verify-work-email`, `/reset-password/confirm`,
  `/accept-invite`, and `/feedback/[token]` as Browser-proven for their stable
  local valid-state fixtures.
- Kept real signed public-token variance as a remaining staging-data risk
  instead of claiming production links are fully covered by local fixtures.
- Raised the matrix Browser row count to include the reconciled token fixture
  evidence files.

### Automated Checks

- No product code changed in this continuation. The relevant verification is
  Browser artifact inspection plus `npm run docs:freshness` for the audit/matrix
  update.

## Public Feedback Token Continuation - Filled State Fixture And Embedded Form

### Updated Verdict

Improved for the public feedback-token workflow.

The valid feedback-link state now has a deterministic local fixture, so the
filled form can be checked without relying on protected production-like token
data. The public page also avoids a nested card inside the primary feedback
card, reducing visual weight and making the task clearer on mobile.

### Additional Findings And Fixes

#### P2 - Valid feedback links had no stable filled-state Browser coverage

Affected surface:

- `/feedback/[token]`

Evidence:

- Previous Browser coverage only proved the invalid token edge. The valid token
  form depended on protected API/token data, which made repeatable mobile and
  desktop inspection unreliable in local mock mode.

Fix:

- Added a local-only visual feedback token fixture gated by
  `NEXT_PUBLIC_USE_MOCK_SUPABASE=true`, `PROOFOUND_VISUAL_FIXTURES=true`, and
  non-production `VERCEL_ENV`.
- The fixture renders one required scale question and one optional text
  question for the candidate-to-organization feedback path.
- The visual fixture submit path records a local success message without
  calling the guarded feedback submit API.

#### P3 - Public feedback form rendered as a card inside a card

Affected surface:

- `/feedback/[token]`

Evidence:

- The public feedback page already frames the task in one card, while
  `FeedbackForm` rendered a second card inside it. This made the page feel
  heavier than the single-task feedback workflow needs.

Fix:

- Added an embedded feedback-form surface for the public token page while
  keeping the card surface for dashboard contexts.
- Stacked the submit action and validation/success message on narrow screens.

### Browser Verification

Verified with the Codex in-app Browser:

- Mobile valid fixture `/feedback/visual-feedback-token-candidate-0000001` at
  390px - no horizontal overflow; one clear feedback task; no nested card; the
  required scale question and optional detail field are visible.
- Mobile submit attempt with the required score empty - inline alert says
  `Please complete the required questions.`
- Mobile filled submit at 390px - entered score `4` and text detail; inline
  status says `Feedback submitted. Thank you!`; no horizontal overflow after
  success.
- Desktop valid fixture at 1280px - no horizontal overflow; no nested card; the
  same labels and submit action remain composed.

Evidence file:

- `.artifacts/ux-browser-goal-2026-05-18/feedback-token/visual-feedback-browser-state.json`

### Automated Checks

- `npm run test -- tests/ui/feedback-form.test.tsx tests/api/feedback-token-visual-route.test.ts`
  - pass

## Email Verification Continuation - Stable Valid-Link Success State

### Updated Verdict

Improved for the public email-verification workflow.

The valid `/verify-email` success state now has a deterministic local fixture
so the page can be inspected in Browser without a real Supabase email token.
The real token path keeps its timed redirect, while the visual fixture uses
stable copy so users and reviewers can clearly see the successful next action.

### Additional Findings And Fixes

#### P2 - Valid email verification state required a real auth token

Affected surface:

- `/verify-email`

Evidence:

- The full coverage matrix marked valid email verification as `PASS/RISK`
  because Browser could only prove the default/loading/invalid route without a
  production-like token.

Fix:

- Added a local-only visual token:
  `/verify-email?token=visual-email-verification-token-00000001&type=signup`.
- The visual token renders the success state without calling the guarded auth
  action.
- Success copy now distinguishes the real auto-redirect path from the stable
  visual fixture path:
  - real token: `Redirecting to login in a few seconds.`
  - visual fixture: `You can continue to login when ready.`

### Browser Verification

Verified with the Codex in-app Browser:

- Mobile valid fixture at 390px - no horizontal overflow; success heading,
  confirmation copy, and `Go to login now` action are visible; no misleading
  redirect copy is present.
- Desktop valid fixture at 1280px - no horizontal overflow; same success state
  remains composed and stable.

Evidence file:

- `.artifacts/ux-browser-goal-2026-05-18/verify-email/success-email-browser-state.json`

### Automated Checks

- `npm run test -- tests/ui/verify-email-content.test.tsx tests/ui/verify-link-visual-fixtures.test.tsx`
  - pass

## Reset Password Confirm Continuation - Stable Valid-Link Form And Success

### Updated Verdict

Improved for the password recovery workflow.

The valid `/reset-password/confirm` state now has deterministic local Browser
coverage for the actual set-new-password form, inline mismatch validation, and
the success state. The real recovery path keeps its redirect behavior, while
the local visual fixture remains stable so the success state can be inspected.

### Additional Findings And Fixes

#### P2 - Valid reset-confirm state required a real recovery session

Affected surface:

- `/reset-password/confirm`

Evidence:

- The full coverage matrix marked reset confirm as `PASS/RISK` because only the
  invalid/default reset-link state was Browser-verified.

Fix:

- Added a local-only visual token:
  `/reset-password/confirm?token=visual-reset-password-token-000000001`.
- The visual token skips guarded Supabase recovery-session validation and shows
  the real set-new-password form.
- The visual submit path records local success without calling the guarded
  password reset action.
- Success copy now distinguishes real auto-redirect from the stable visual
  fixture path:
  - real token: `Your password has been reset. Redirecting to login.`
  - visual fixture: `Your password has been reset. You can continue to login when ready.`

### Browser Verification

Verified with the Codex in-app Browser:

- Mobile valid fixture at 390px - no horizontal overflow; password and confirm
  fields are visible; reset action and back-to-login action are reachable.
- Mobile mismatch submit at 390px - inline alert says `Passwords do not match`
  with no horizontal overflow.
- Mobile successful submit at 390px - success heading, stable success copy, and
  `Go to login now` action are visible; no misleading redirect copy is present.
- Desktop valid fixture at 1280px - no horizontal overflow; form labels and
  actions remain composed.

Evidence file:

- `.artifacts/ux-browser-goal-2026-05-18/reset-password-confirm/success-reset-browser-state.json`

### Automated Checks

- `npm run test -- tests/ui/confirm-reset-password-form.test.tsx tests/ui/verify-email-content.test.tsx`
  - pass

## 2026-05-18 - Individual Interviews Empty and Filled States

### Scope

- `/app/i/interviews`
- Local visual fixture mode with and without
  `PROOFOUND_INTERVIEWS_VISUAL_STATE=filled`

### Findings and Fixes

#### P2 - Individual interviews could not be Browser-tested with filled data

Evidence:

- The interviews visual fixture gate only returned filled data for the
  organization perspective, leaving `/app/i/interviews` in the empty state even
  when visual fixtures were enabled.

Fix:

- Added individual interview visual fixtures covering a scheduled interview with
  calendar/join actions and a completed hire decision awaiting engagement
  confirmation.
- Wired the individual perspective through the existing local-only visual
  fixture gate. This does not affect production behavior.

#### P2 - Empty state had no obvious next action

Evidence:

- Browser at 390px showed a clear empty explanation but no action for a user who
  wanted to continue their workflow.

Fix:

- Added a single `Review matching` action linking to `/app/i/matching`.
- Browser click verification confirmed the action navigates to the Matching
  surface.

#### P3 - Interview platform exposed an internal value

Evidence:

- Filled-state Browser verification rendered `Google_meet` instead of a human
  label.

Fix:

- Reused the existing internal value label helper so the page renders
  `Google Meet`.

### Browser Verification

- Mobile filled `/app/i/interviews` at 390px - no horizontal overflow; long
  assignment title wraps, meeting actions are reachable, `Google Meet` renders
  without internal underscores, and engagement confirmation controls are
  reachable.
- Desktop filled `/app/i/interviews` at 1280px - no horizontal overflow; cards,
  calendar actions, and engagement controls stay composed.
- Mobile empty `/app/i/interviews` at 390px - no horizontal overflow; empty
  state includes the `Review matching` action.
- Desktop empty `/app/i/interviews` at 1280px - no horizontal overflow; empty
  state remains centered and the `Review matching` action is visible.
- Browser click verification: `Review matching` navigated from
  `/app/i/interviews` to `/app/i/matching`.

Evidence artifacts:

- `.artifacts/ux-browser-goal-2026-05-18/interviews/browser-state.json`
- `.artifacts/ux-browser-goal-2026-05-18/interviews/browser-empty-state.json`

Note: Browser screenshot capture timed out on this route during the artifact
write step, so this pass records DOM, layout, overflow, and click evidence in
JSON rather than PNG screenshots.

## 2026-05-18 - Work Email Verification Recovery Copy

### Scope

- `/verify-work-email`
- `/signup/organization` risk recheck from the full coverage matrix

### Findings and Fixes

#### P3 - Work-email verification failure actions sounded like internal navigation

Evidence:

- Mobile Browser at 390px showed the missing-token state with `Try again from
settings` and `Go to Profile`. The route was layout-safe, but the next step
  was less plain than it should be for a public verification failure.

Fix:

- Updated the failure helper to say the user should request a fresh work-email
  link from settings.
- Renamed the actions to `Open work-email settings` and `Return to profile`.

### Browser Verification

- Mobile `/verify-work-email` at 390px - no horizontal overflow; clearer
  recovery copy and actions are visible, old labels are absent.
- Desktop `/verify-work-email` at 1280px - no horizontal overflow; same recovery
  copy and actions remain composed.
- Mobile `/signup/organization` at 390px - no redirect; organization signup form
  renders, empty submit focuses the error, and consent toggles correctly.
- Desktop `/signup/organization` at 1280px - no redirect or horizontal overflow;
  organization signup form renders.

Evidence artifact:

- `.artifacts/ux-browser-goal-2026-05-18/work-email-verify/invalid-work-email-browser-state.json`

## 2026-05-18 - Work Email Verification Success Fixture

### Scope

- `/verify-work-email?token=visual-work-email-token-000000000001`

### Findings and Fixes

#### P2 - Valid work-email verification state had no repeatable Browser fixture

Evidence:

- The full coverage matrix marked valid token states as a remaining risk because
  local Browser coverage could only prove invalid/default verification states.

Fix:

- Added a local mock-mode visual token for a successful work-email verification.
- Kept the visual success state stable for Browser inspection instead of
  auto-redirecting.
- Made the success helper text truthful in the stable visual state:
  `You can return to your profile when ready.`

### Browser Verification

- Mobile success token at 390px - no horizontal overflow; verified heading,
  workplace email, success bullets, stable helper copy, and profile action are
  visible.
- Desktop success token at 1280px - no horizontal overflow; same success state
  remains composed.

Evidence artifact:

- `.artifacts/ux-browser-goal-2026-05-18/work-email-verify/success-work-email-browser-state.json`

## Individual Settings And Privacy Continuation - Account History Clarity

Date: 2026-05-18

### Surfaces Checked

- `/app/i/settings` at 390px mobile: account and privacy settings tabs stayed
  readable with no horizontal overflow.
- `/app/i/settings/privacy` at 390px mobile: privacy overview, quick actions,
  field visibility controls, account history, data breakdown, and delete-account
  sections stayed reachable.
- `/app/i/settings/privacy` at 1280px desktop: account-history view kept its
  dense table layout without overflow.

### Findings

#### P2 - Account history was cramped on mobile

Affected surface:

- `/app/i/settings/privacy` -> `View account history`

Evidence:

- Codex in-app Browser at 390px showed account-history rows squeezed into
  desktop-style columns. The visible header read `Date and time / Action /
Access detail / Device`, dates wrapped into tall narrow blocks, and device
  values were truncated.

Fix:

- Changed the settings account-history component to use stacked mobile activity
  cards with explicit `When`, `Access detail`, and `Device` labels.
- Kept the desktop grid/table layout behind the `md` breakpoint.
- Made the download action full-width on mobile so the primary action is clear
  and easy to tap.

#### P2 - Privacy audit history exposed internal telemetry as user activity

Affected surface:

- `/app/i/settings/privacy` account-history and privacy audit log data source

Evidence:

- The filled-state Browser pass showed internal `Performance Metric` entries in
  the user-facing account history, which made the activity log feel noisy and
  less trustworthy.

Fix:

- Filtered `performance_metric` and `web_vital` analytics events out of
  `/api/user/audit-log`.
- Added mobile cards to the shared privacy audit-log component so the dedicated
  privacy audit surface does not fall back to a cramped table on phones.

### Browser Verification

Verified with the Codex in-app Browser:

- Mobile `/app/i/settings/privacy` at 390px, filled account history: no
  horizontal overflow; activity appears as readable cards; action, time, access
  detail, and device are understandable without clipped text.
- Desktop `/app/i/settings/privacy` at 1280px, filled account history: no
  horizontal overflow; table columns remain visible for scannability.
- Account-history filled state no longer showed `Performance Metric` telemetry
  as user-facing activity.

Screenshots:

- `.artifacts/ux-browser-goal-2026-05-18/settings-privacy/account-history-mobile-fixed.png`
- `.artifacts/ux-browser-goal-2026-05-18/settings-privacy/account-history-desktop-fixed.png`

### Automated Checks

- `npm run test -- tests/ui/privacy-audit-log-mobile-clarity.test.tsx tests/ui/settings-account-history-mobile-clarity.test.tsx tests/ui/privacy-overview-copy.test.tsx tests/ui/settings-privacy-visibility-placement.test.tsx`
  - pass
- `npm run lint` - pass
- `npm run typecheck` - pass
- `npm run docs:freshness` - pass in warning mode with the existing 32 orphan
  document warnings.
- `npm run build` - pass

## Individual Settings And Privacy Continuation - Single-Path Privacy Actions

Date: 2026-05-18

### Surfaces Checked

- `/app/i/settings/privacy` at 390px mobile, focused on overview actions and the
  account-history destination.
- `/app/i/settings/privacy#privacy-activity` at 1280px desktop, focused on the
  destination section reached by account-history navigation.
- `/app/i/settings` privacy tab behavior was preserved by keeping the overview's
  inline drill-down mode as the default outside the dedicated full-page route.

### Findings

#### P2 - Dedicated privacy page offered duplicate drill-down paths

Affected surface:

- `/app/i/settings/privacy`

Evidence:

- The dedicated privacy route rendered the overview quick actions, then rendered
  the full data, visibility, account-history, and delete sections underneath.
  Clicking `View account history` opened a second inline account-history view
  above the already-rendered `Activity log`, `Your data`, `Profile visibility`,
  and delete sections. The result gave the user two competing account-history
  paths on one page.

Fix:

- Added full-page navigation mode to `PrivacyOverview`.
- On the dedicated privacy route, overview actions now move to the existing page
  sections instead of rendering duplicate inline drill-downs.
- Added stable section targets for data, field visibility, account history, and
  delete account.
- Renamed the shared privacy audit heading from `Activity log` to `Account
history` so the destination matches the action label.
- Registered this UX audit in `docs/DOCS_REGISTRY.md`, returning
  `docs:freshness` to the previous warning count.

### Browser Verification

Verified with the Codex in-app Browser:

- Mobile `/app/i/settings/privacy` at 390px: `View account history` moved to the
  existing account-history section; there was no `Back to Privacy Overview`
  duplicate drill-down state, no `Activity log` label mismatch, and no horizontal
  overflow.
- Desktop `/app/i/settings/privacy#privacy-activity` at 1280px: the account
  history table stayed composed, the heading matched the action label, and no
  horizontal overflow was present.

Screenshots:

- `.artifacts/ux-browser-goal-2026-05-18/settings-privacy/privacy-account-history-navigation-mobile.png`
- `.artifacts/ux-browser-goal-2026-05-18/settings-privacy/privacy-account-history-navigation-desktop.png`

### Automated Checks

- `npm run test -- tests/ui/privacy-overview-copy.test.tsx tests/ui/privacy-audit-log-mobile-clarity.test.tsx tests/ui/settings-account-history-mobile-clarity.test.tsx tests/ui/settings-privacy-visibility-placement.test.tsx`
  - pass
- `npm run lint` - pass
- `npm run typecheck` - pass
- `npm run docs:freshness` - pass in warning mode with the existing 32 orphan
  document warnings.
- `npm run build` - pass

## Individual Settings Continuation - Dedicated Account History Route

Date: 2026-05-18

### Surfaces Checked

- `/app/i/settings/audit-log` at 390px mobile and 1280px desktop.
- Individual home trust-control link copy for `/app/i/settings/audit-log`.
- Individual top-bar profile menu link copy for `/app/i/settings/audit-log`.

### Findings

#### P2 - Dedicated account-history route was a placeholder

Affected surface:

- `/app/i/settings/audit-log`

Evidence:

- Codex in-app Browser showed the route title `Account history`, but the only
  card content was `Purpose edit history is archived`. There were no actual
  account-history rows, even though the privacy page and API had filled account
  activity available.

Fix:

- Replaced the placeholder with the real privacy account-history component.
- Gave the embedded history card the contextual title `Recent activity` so the
  page has one clear `Account history` heading instead of repeating the same
  title twice.
- Aligned individual navigation copy from `Audit log` to `Account history` in
  the top-bar profile menu and individual home trust controls.

### Browser Verification

Verified with the Codex in-app Browser:

- `/app/i/settings/audit-log` no longer showed `Purpose edit history is
archived`.
- Filled account-history rows such as `Profile Created` / `Created profile`
  rendered from the real activity source.
- The route had one `Account history` page heading and a `Recent activity`
  section heading.
- No horizontal overflow was reported at the tested mobile/desktop viewport
  widths.

Note: Browser screenshot capture timed out on this route after verification, so
this pass records DOM/rendered-state evidence rather than new screenshot files.

### Automated Checks

- `npm run test -- tests/ui/settings-audit-log-page.test.tsx tests/ui/privacy-audit-log-mobile-clarity.test.tsx tests/ui/settings-account-history-mobile-clarity.test.tsx`
  - pass
- `npm run lint` - pass
- `npm run typecheck` - pass
- `npm run docs:freshness` - pass in warning mode with the existing 32 orphan
  document warnings.
- `npm run build` - pass

## Auth Continuation - Login And Signup Clarity

Date: 2026-05-18

### Issues Found And Fixed

#### P2 - Login mobile shell retained motion offset and small remember control

Affected surface:

- `/login`

Evidence:

- Codex in-app Browser at 390px showed the login form shell still had a
  transform offset from the entry animation and the remember checkbox was only
  16px square.
- Empty-submit validation did not distinguish the field that needed action.

Fix:

- Removed the login shell motion wrappers so the card renders in its final
  position on first paint.
- Reduced mobile card padding only where needed, giving fields 316px of usable
  width at 390px.
- Enlarged the remember checkbox to 24px and kept the label row as a 44px touch
  target.
- Focuses and scrolls the visible error after client validation.
- Tracks email/password/form invalid state separately so missing email does not
  incorrectly mark password invalid.

#### P3 - Auth social divider wrapped on narrow mobile

Affected surfaces:

- `/login`
- `/signup/individual`
- `/signup/organization`

Evidence:

- Codex in-app Browser at 390px after login validation showed `Or continue
with` wrapping into stacked lines between the divider rules.

Fix:

- Replaced the absolute divider label layout with a flex row using shrink-safe
  rules and `whitespace-nowrap`.

### Browser Verification

Verified with the Codex in-app Browser:

- Mobile `/login` at 390px - no horizontal overflow; login shell transform is
  `none`; email/password fields are 316px wide; remember checkbox is 24px.
- Mobile `/login` empty submit at 390px - visible error says `Please enter your
email address.`, focus moves to the error, scroll returns to the top, email is
  invalid, and password remains valid.
- Mobile `/login` after divider fix at 390px - `Or continue with` stays on one
  line and no horizontal overflow appears.
- Desktop `/login` at 1280px - no horizontal overflow; shell transform is
  `none`; card and actions remain centered and composed.
- Mobile `/reset-password` at 390px - no horizontal overflow; email field,
  submit action, and back-to-sign-in path remain visible and reachable.

### Automated Checks

- `npm run test -- tests/ui/signin-form-mobile-clarity.test.tsx tests/ui/signup-form-mobile-clarity.test.tsx`
  - pass, with the existing local Vite websocket warning and React form-action
    mock warning.
- `npm run lint` - pass
- `npm run typecheck` - pass
- `npm run docs:freshness` - pass in warning mode with the existing 32 orphan
  document warnings.
- `npm run build` - pass, with existing `next-intl` webpack cache warnings and
  `--localstorage-file` warnings.

## Individual Matching Continuation - Setup, Filled Cards, And Filters

Date: 2026-05-18

### Issues Found And Fixed

#### P2 - Filled match-card skill chips were low contrast on mobile

Affected surface:

- `/app/i/matching?visualState=filled`

Evidence:

- Codex in-app Browser at 390px showed the filled matching cards rendering
  skill chips as white text on a pale parchment background. The chips were a
  core "why this match" signal but were hard to scan.

Fix:

- Changed individual match skill chips to Proofound charcoal text on parchment
  with a visible stone border.
- Added a stable `data-testid="match-card"` hook to the individual card wrapper
  so existing visual/e2e helpers can target the current implementation.

#### P2 - Mobile filter sheet hid Apply/Clear actions below the first viewport

Affected surface:

- `/app/i/matching?visualState=filled`

Evidence:

- Codex in-app Browser at 390px showed the filter sheet footer actions below
  the initial viewport; users had to discover scrolling before they could apply
  or clear filters.

Fix:

- Made the filter sheet a fixed-height flex panel with a scrollable content
  body.
- Moved `Clear All` and `Apply Filters` into a sticky bottom footer with safe
  area padding.
- Added an explicit filter trigger label when filters are active.

#### P3 - New-user setup role input was cramped beside Add on mobile

Affected surface:

- `/app/i/matching?visualState=empty`

Evidence:

- Codex in-app Browser at 390px showed the first setup action with the role
  input squeezed beside the Add button, truncating the placeholder and making
  the first task feel cramped.

Fix:

- Stacked the role input and Add action on mobile, preserving the horizontal row
  only from the small breakpoint upward.

### Browser Verification

Verified with the Codex in-app Browser:

- Mobile filled `/app/i/matching?visualState=filled` at 390px - no horizontal
  overflow; two seeded opportunity cards render; skill chips are readable with
  charcoal text; `match-card` hook is present.
- Mobile setup `/app/i/matching?visualState=empty` at 390px - no horizontal
  overflow; first role input is 313px wide and the Add action stacks below it.
- Desktop filled `/app/i/matching?visualState=filled` at 1280px - no horizontal
  overflow; two seeded opportunities and desktop filter sheet remain composed.
- Mobile filter sheet at 390px - no horizontal overflow; `Clear All` and
  `Apply Filters` are visible in the first viewport.
- Mobile filter apply at 390px - selecting `Hybrid` closes the sheet, shows one
  active filter, and narrows the result list to the seeded hybrid opportunity.

### Automated Checks

- `npm run test -- tests/ui/individual-matching-mobile-clarity.test.tsx tests/ui/match-result-card.test.tsx tests/ui/matching-page-gated.test.tsx`
  - pass, with the existing local Vite websocket warning and
    `--localstorage-file` warning.
- `npm run lint` - pass
- `npm run typecheck` - pass
- `npm run docs:freshness` - pass in warning mode with the existing 32 orphan
  document warnings.
- `npm run build` - pass, with existing `next-intl` webpack cache warnings and
  `--localstorage-file` warnings.

## Individual Settings Continuation - Account, Interviews, And Privacy Controls

### Updated Verdict

Improved for the individual settings hub.

This pass covered account settings, the manual-first interviews tab, and the
privacy/public-page controls in the Codex in-app Browser across mobile and
desktop. The page already avoided horizontal overflow, but mobile interaction
details still had small or unclear controls.

### Additional Findings And Fixes

#### P2 - Password reveal controls were tiny and unnamed

Affected surface:

- `/app/i/settings`

Evidence:

- Browser at 390px showed the three password visibility buttons as 16px icon
  targets with no accessible names after opening `Change Password`.

Fix:

- Increased the password reveal controls to 44px touch targets.
- Added precise accessible names for current, new, and confirmation password
  visibility controls.
- Increased input right padding so typed text does not sit under the control.

#### P2 - Privacy switches were visually adjacent but not clearly named controls

Affected surface:

- `/app/i/settings?tab=privacy`

Evidence:

- Browser mobile inspection showed public-page visibility switches as bare
  switch controls beside labels. They were visually understandable but not
  explicit named controls for assistive technology or keyboard users.

Fix:

- Added accessible names to every public-page visibility switch.
- Kept each switch aligned to the right of its label group on mobile and
  desktop for clearer cause/effect scanning.

#### P3 - Interview tab icons collapsed beside long mobile text

Affected surface:

- `/app/i/settings?tab=interviews`

Evidence:

- Browser at 390px showed the calendar/shield icons shrinking to thin slivers
  beside long manual-scheduling explanations.

Fix:

- Prevented the icons from shrinking so the two explanation blocks keep a
  stable visual anchor on narrow screens.

### Browser Verification

Verified with the Codex in-app Browser:

- Mobile account tab at 390px - no horizontal overflow; `Change Email`,
  verification status, `Change Password`, language select, and restart-tour
  controls are reachable above the mobile navigation.
- Mobile password edit state at 390px - no horizontal overflow; password reveal
  controls are named 44px targets; submit and cancel actions remain full-width
  and above the bottom navigation.
- Mobile privacy tab at 390px - no horizontal overflow; public-page visibility
  switches have explicit names and stay aligned with their label groups.
- Mobile interviews tab at 390px - no horizontal overflow; manual scheduling
  copy remains readable and icons no longer collapse.
- Desktop privacy and interviews tabs at 1280px - no horizontal overflow;
  tab content renders with the expected selected tab and composed spacing.

### Automated Checks

- `npm run test -- tests/ui/password-change-form.test.tsx tests/ui/portfolio-visibility-card-ai.test.tsx tests/ui/settings-privacy-visibility-placement.test.tsx tests/ui/settings-integrations-discoverability.test.tsx`
  - pass

## Signup Continuation - Account Choice, Form Width, And Validation Feedback

### Updated Verdict

Improved for first-contact account creation.

This pass focused on the signup choice screen and individual/organization
signup form because they are high-impact onboarding surfaces where users need
clear next steps and immediate feedback.

### Additional Findings And Fixes

#### P2 - Mobile signup cards and form retained visible motion offsets

Affected surfaces:

- `/signup`
- `/signup/individual`
- `/signup/organization`

Evidence:

- Codex Browser at 390px showed the account-choice cards stuck with horizontal
  transforms (`-20px` and `20px`), leaving the cards offset from each other.
- The signup form shell also retained a vertical transform and the mobile input
  fields measured about 260px wide on a 390px viewport.

Fix:

- Removed first-load motion wrappers from the signup choice and signup form
  shell.
- Reduced mobile outer/card padding and kept desktop spacing intact.
- Verified the mobile cards and form fields now render at about 316px wide with
  no horizontal overflow and no transform offsets.

#### P2 - Signup validation feedback could appear outside the visible mobile area

Affected surface:

- `/signup/individual`

Evidence:

- Submitting the mobile signup form from the bottom of the page with empty
  fields inserted the error above the visible viewport. Browser measured the
  error with a negative top position, so users could miss what happened.

Fix:

- Focus and scroll the signup error summary into view when client or server
  validation fails.
- The recheck showed the error fully visible and focused after submitting from
  the bottom of the form.

#### P3 - Consent controls were visually too small

Affected surface:

- `/signup/individual`

Evidence:

- Browser at 390px showed the native consent checkboxes as small visual targets
  inside otherwise larger label rows.

Fix:

- Replaced the signup consent inputs with the app checkbox control while
  preserving hidden submitted values.
- The required and optional consent controls now render as named 24px checkbox
  controls with large label hit areas.

### Browser Verification

Verified with the Codex in-app Browser:

- Mobile `/signup` at 390px - no horizontal overflow; account-choice cards are
  aligned, full-width within the card, and free of lingering transform offsets.
- Mobile `/signup/individual` at 390px - no horizontal overflow; form fields are
  wider, password reveal remains a 44px named control, consent controls are
  visible and named, and submit is reachable.
- Mobile `/signup/individual` invalid submit from the bottom of the form -
  validation error scrolls into view and receives focus.
- Desktop `/signup` at 1280px - no horizontal overflow; account-choice cards
  remain balanced in two columns.
- Desktop `/signup/organization` at 1280px - no horizontal overflow; form shell,
  consent controls, and submit action remain composed.

### Automated Checks

- `npm run test -- tests/ui/signup-form-mobile-clarity.test.tsx tests/ui/pilot-packaging-guardrails.test.tsx`
  - pass

## Verifier Link Continuation - Filled Skill And Custom Request States

### Updated Verdict

Improved for public verifier links.

The skill verifier and custom bundle verifier now have local-only filled visual
states that render in the page before the guarded public-token API path. This
lets the UX pass inspect realistic long request content without weakening
public-token middleware or rate limiting.

### Additional Findings And Fixes

#### P2 - Filled verifier states were blocked by public-token protection in local visual mode

Affected surfaces:

- `/verify/visual-skill-verification-token-00000001`
- `/verify/custom/visual-custom-verification-token-0000001`

Evidence:

- Codex Browser initially showed the error shell for the visual verifier link:
  `Unable to load request` / `Service temporarily unavailable`.
- Direct local checks showed the request was stopped before the route handler by
  the public-token protection profile, so route-level visual fixtures were not
  enough for rendered UX verification.

Fix:

- Added client-side local visual fixture loading for explicit visual verifier
  tokens when `NEXT_PUBLIC_USE_MOCK_SUPABASE=true`.
- Kept live public-token API behavior unchanged.
- Added focused UI coverage to prove the filled visual states render without
  calling the guarded public API and can record local visual responses.

#### P2 - Verifier cards used an off-contract gradient shell and cramped mobile actions

Affected surfaces:

- `/verify/[token]`
- `/verify/custom/[token]`

Evidence:

- The public verifier pages were still using a green gradient header/shell that
  did not match the current Proofound parchment/forest product language.
- Long proof and artifact labels could force tight rows, and action buttons sat
  in a single row on narrow mobile.

Fix:

- Moved both verifier pages to the Proofound parchment/forest card treatment
  used by the surrounding public-token surfaces.
- Added `min-w-0`, `break-words`, and responsive proof/artifact row wrapping.
- Stacked verifier action buttons on mobile while preserving horizontal action
  groups on wider screens.

### Browser Verification

Verified with the Codex in-app Browser:

- Mobile filled skill verifier at 390px - no horizontal overflow; long skill
  name, proof titles, observed-in-practice fields, and `No / Partly / Yes`
  actions are visible and readable.
- Mobile skill verifier response at 390px - `Partly` records a partial response
  and lands on the clear success state.
- Mobile filled custom verifier at 390px - no horizontal overflow; long
  artifact claims, support badges, optional note, and `Decline / Verify
Artifacts` actions are readable and reachable.
- Mobile custom verifier response at 390px - `Verify Artifacts` lands on the
  thank-you state.
- Tablet-ish custom verifier at 768px - no horizontal overflow; artifact rows
  remain composed.
- Desktop skill and custom verifier at 1280px - no horizontal overflow; filled
  content and actions remain composed.

Screenshot capture was attempted through the Codex Browser after verification,
but the Browser runtime timed out on `Page.captureScreenshot`; DOM, viewport,
overflow, and interaction checks completed successfully.

### Automated Checks

- `npm run test -- tests/ui/verify-link-visual-fixtures.test.tsx`
  - pass; the sandbox still prints the local Vite websocket `EPERM` warning,
    but the verifier tests pass.

## Admin Operations Continuation - Shell, Queues, And Audit History

### Updated Verdict

Partially ready, improved for the restricted admin operations corridor.

This pass used the Codex in-app Browser against the local mock/admin app and
focused on `/admin`, `/admin/verification`, and `/admin/audit`. The admin area
is intentionally denser than candidate-facing surfaces, but it still needs one
clear next action, reachable controls, and no hidden mobile content.

### Additional Findings And Fixes

#### P1 - Mobile admin shell was covered by the desktop sidebar

Affected surfaces:

- `/admin`
- `/admin/verification`
- `/admin/audit`

Evidence:

- Browser at 390px showed the persistent desktop sidebar covering most of the
  admin dashboard while the mobile header was also visible.

Fix:

- Hid the persistent sidebar below the desktop breakpoint and kept the mobile
  sheet navigation as the only narrow-screen admin navigation.
- Removed duplicate desktop header offset so breadcrumbs and profile controls
  align with the content column on desktop.
- Removed non-functional admin search and notification controls that looked
  actionable but had no workflow behind them.

#### P2 - Filled operations queue cards overflowed on mobile

Affected surface:

- `/admin/verification`

Evidence:

- Browser at 390px on the populated `Redaction / risky upload` queue reported
  document overflow from long record IDs, safe metadata values, and compact
  action rows.

Fix:

- Added wrapping/min-width guards for queue summaries, record IDs, detail
  fields, and audit metadata.
- Stacked queue actions on mobile and kept compact inline actions for wider
  screens.
- Humanized camelCase audit metadata labels such as `Upload Kind` and
  `Source Surface`.

#### P2 - Audit history table hid important columns on mobile

Affected surface:

- `/admin/audit`

Evidence:

- Browser at 390px showed the audit table compressed to the visible width, but
  `Target` and `Details` disappeared from the primary reading path.

Fix:

- Kept the full table for desktop.
- Added mobile audit cards that show action, timestamp, target, admin, and
  details in a readable vertical layout.
- Added explicit empty and failed-load states, and fixed empty pagination copy
  so it no longer reads like `Showing 1 to 0 of 0 logs`.

### Browser Verification

Verified with the Codex in-app Browser:

- Mobile `/admin` at 390px - no sidebar overlay, no horizontal overflow, and
  the dashboard cards remain readable.
- Desktop `/admin` at 1280px - sidebar, header, breadcrumbs, and dashboard cards
  are aligned without fake search/notification controls.
- Mobile navigation sheet at 390px - menu opens, admin links are reachable, and
  the page remains contained.
- Mobile filled `/admin/verification` at 390px - populated redaction queue has
  no horizontal overflow; long IDs, metadata, checklist, note, and actions are
  readable and reachable.
- Mobile `/admin/audit` at 390px - audit logs render as readable cards with
  target and details visible.
- Desktop `/admin/audit` at 1280px - table remains composed and scannable with
  no horizontal overflow.

### Automated Checks

- `npm run test -- tests/ui/admin-dashboard-launch-links.test.tsx tests/ui/admin-verification-dashboard.test.tsx tests/ui/admin-audit-log-table.test.tsx`
  - pass
- `npm run lint`
  - pass
- `npm run typecheck`
  - pass
- `npm run docs:freshness`
  - pass in warning mode with the existing 32 orphan document warnings.

## Candidate Invite Continuation - Filled, Pending, And Submission States

### Updated Verdict

Improved for this pass.

The candidate invite flow now has repeatable local visual coverage for
realistic pending and claimed proof-card states without depending on live
capability-token data. This pass focused on the email-link experience where a
candidate needs to understand the assignment, privacy posture, and exact next
action before submitting owner-only proof.

### Findings And Fixes

#### P2 - Filled candidate-invite states had no repeatable Browser fixture

Affected surface:

- `/candidate-invite/[token]`

Evidence:

- Source and tests covered the component, but Browser could not reliably render
  a realistic filled invite without live token/database state. The public-token
  API route is also intentionally protected by rate limiting, so route-level
  visual testing should not weaken production controls.

Fix:

- Added local-only visual invite fixtures gated by
  `NEXT_PUBLIC_USE_MOCK_SUPABASE=true`, `PROOFOUND_VISUAL_FIXTURES=true`, and
  non-production runtime.
- Wired the page to pass a seeded initial state directly to
  `CandidateInviteClient` for visual tokens, avoiding the protected public-token
  API while leaving normal live invite behavior unchanged.
- Added a visual-mode submission path that exercises the same success UI without
  mutating backend state.

#### P3 - Mobile continuation actions were not consistently obvious

Affected surface:

- `/candidate-invite/visual-proof-card-claimed`
- `/candidate-invite/visual-proof-card-pending`

Evidence:

- Browser mobile interaction checks at 390px showed the flow itself was
  contained, but the main continuation actions mixed intrinsic-width and
  full-width buttons. On a dense invite page, the next action should be visually
  unmistakable.

Fix:

- Made the primary candidate-invite continuation buttons full-width on mobile,
  then compact again on wider screens.

### Browser Verification

Verified with the Codex in-app Browser:

- Mobile pending `/candidate-invite/visual-proof-card-pending` at 390px - no
  horizontal overflow; assignment context appears before sign-up/sign-in
  actions.
- Mobile claimed `/candidate-invite/visual-proof-card-claimed` at 390px - no
  horizontal overflow; long assignment title, organization, practical
  constraints, verification gates, proof-pack selector, and account-control copy
  remain readable.
- Mobile final proof review at 390px - no horizontal overflow; submitted-for,
  proof/context, employer visibility, verification-request, checkbox, back, and
  submit controls are reachable.
- Mobile submission interaction at 390px - submit is disabled until the
  visibility checkbox is checked; after submission, the saved-private-workspace
  success state is shown.
- Desktop claimed `/candidate-invite/visual-proof-card-claimed` at 1280px - no
  horizontal overflow; header, privacy card, assignment cards, and apply section
  remain composed.

Note: Browser screenshot capture timed out in this pass even after using a fresh
tab, so evidence was collected through Browser DOM, viewport, interaction, and
overflow checks instead of saved images.

### Automated Checks

- `npm run test -- tests/ui/candidate-invite-client.test.tsx`
  - pass
- `npm run lint`
  - pass
- `npm run typecheck`
  - pass
- `npm run docs:freshness`
  - pass in warning mode with the existing 32 orphan document warnings.

## Individual Matching Continuation - Readiness, Filled Cards, And Filters

### Updated Verdict

Improved for this pass.

The individual matching page now has Browser coverage for the sparse
readiness-gated state and a local filled-state match list. The page is no
longer judged only from the soft-gated mock path.

### Additional Findings And Fixes

#### P2 - Filled individual matching had no local visual coverage

Affected surface:

- `/app/i/matching`

Evidence:

- Mock mode naturally resolved to the browse-readiness gate, so realistic match
  cards, long opportunity titles, skill chips, breakdown bars, gaps, and filter
  behavior were not visible in Browser.

Fix:

- Added local-only individual matching fixtures gated by
  `NEXT_PUBLIC_USE_MOCK_SUPABASE=true` and `PROOFOUND_VISUAL_FIXTURES=true`.
- Added `PROOFOUND_MATCHING_VISUAL_STATE=filled` support for rendered filled
  state verification without touching production data paths.

#### P3 - Match cards exposed technical breakdown labels

Affected surface:

- Individual match cards on `/app/i/matching`

Evidence:

- Mobile filled-state Browser testing showed labels such as `Proof_fit`,
  `Skills_fit`, and `Verification_fit`, which read as implementation keys.

Fix:

- Mapped contribution keys to short human labels: `Proof`, `Skills`, `Trust`,
  and `Practical`.

#### P3 - Mobile filter footer was crowded by bottom chrome

Affected surface:

- Matching filter sheet on mobile

Evidence:

- At 390px, scrolling the filter sheet to the bottom placed the footer actions
  too close to the app's bottom chrome.

Fix:

- Added mobile-only bottom padding to the filter sheet footer so `Clear All`
  and `Apply Filters` remain comfortably reachable.

### Browser Verification

Verified with the Codex in-app Browser:

- Mobile readiness `/app/i/matching` at 390px - no horizontal overflow; browse
  readiness criteria and recovery actions are readable.
- Mobile filled `/app/i/matching` at 390px - no horizontal overflow; long match
  title, skill chips, breakdown bars, primary/secondary actions, snooze action,
  and skill gap remain readable.
- Mobile filled bottom scroll at 390px - no horizontal overflow; second match
  actions and `Manage snoozed or hidden matches` remain reachable above the
  bottom navigation.
- Desktop filled `/app/i/matching` at 1280px - no horizontal overflow; two-card
  grid, header actions, and manage link remain composed.
- Desktop filter sheet at 1280px - no horizontal overflow; grouped filters,
  save field, and footer actions are clear.
- Mobile filter sheet at 390px - no horizontal overflow; footer actions remain
  reachable after adding bottom spacing.

### Automated Checks

- `npm run test -- tests/ui/matching-page-gated.test.tsx tests/ui/match-result-card.test.tsx`
  - pass

## Individual Matching Continuation - Proof-First Card Polish

### Updated Verdict

Improved for this pass.

The individual matching filled state is now calmer and more explicit about what
the user is reviewing: proof fit, blind-by-default privacy, and the next action.
The mobile card actions also clear the fixed bottom navigation at the first
viewport.

### Additional Findings And Fixes

#### P2 - Mobile card actions were too close to the bottom navigation

Affected surface:

- `/app/i/matching?visualState=filled`

Evidence:

- Codex Browser at 390px showed the first match card action cluster pressing
  into the fixed bottom navigation. An intermediate patch made the primary
  action clearer but pushed `Snooze` under the nav, so the final layout keeps
  the three card actions in one compact row.

Fix:

- Added mobile bottom breathing room to the matching page container.
- Kept match card actions compact enough for `I'm interested`, `Hide`, and
  `Snooze` to remain above the bottom navigation on 390px mobile.

#### P3 - Individual match cards still read score-first

Affected surface:

- Individual match cards on `/app/i/matching`

Evidence:

- Filled-state Browser coverage showed `86% Match` and `Match breakdown` as the
  dominant card language. This was accurate but more generic SaaS than
  Proofound's proof-first corridor language.

Fix:

- Changed the score label to `proof fit`.
- Added a `Blind by default` privacy badge.
- Changed `Match breakdown` to `Why it fits`.
- Changed the primary action from `Interested` to `I'm interested`.
- Kept contribution labels human-readable and preserved the existing explainer
  action.

### Browser Verification

Verified with the Codex in-app Browser:

- Mobile empty/setup `/app/i/matching?visualState=empty` at 390px - no
  horizontal overflow; setup form scrolls to `Continue later` and
  `Save and Continue` with no content hidden under the mobile navigation.
- Mobile filled `/app/i/matching?visualState=filled` at 390px - no horizontal
  overflow; first card shows `86% proof fit`, `Blind by default`,
  `WHY IT FITS`, and the `I'm interested / Hide / Snooze` row above the bottom
  navigation.
- Mobile primary interaction at 390px - tapping `I'm interested` opens the
  verification-required dialog with `Cancel` and `Complete Verifications` and
  no failure toast.
- Tablet-ish filled at 768px - no horizontal overflow; two-card grid and
  actions remain composed beside the sidebar.
- Desktop filled at 1280px - no horizontal overflow; header actions, cards,
  and manage link remain composed.

### Automated Checks

- `npm run test -- tests/ui/match-result-card.test.tsx tests/ui/matching-page-gated.test.tsx tests/ui/matching-profile-setup-focus.test.tsx`
  - pass; the sandbox still prints the local Vite websocket `EPERM` warning,
    but the matching tests pass.

## Matching Preferences Continuation - Form Clarity And Mobile Actions

### Updated Verdict

Improved for this pass.

The matching preferences setup route now has direct Browser coverage on mobile
and desktop. This pass focused on the form path that users reach from matching
readiness actions.

### Findings And Fixes

#### P2 - Mobile form actions collided at the bottom

Affected surface:

- `/app/i/matching/preferences`

Evidence:

- Codex Browser at 390px showed `Save & Continue Later` and `Save and Continue`
  fighting for the same row at the bottom of the form.

Fix:

- Stacked the setup actions on mobile, kept them side-by-side only at wider
  widths, and added bottom breathing room above the mobile navigation.

#### P2 - Secondary action copy claimed a save that did not happen

Affected surface:

- Matching profile setup form

Evidence:

- The secondary action read `Save & Continue Later`, but the handler only
  leaves setup and routes back. That copy was misleading.

Fix:

- Changed the label to `Continue later`.

#### P3 - Desired-hours validation allowed an inverted range

Affected surface:

- Matching profile setup form

Evidence:

- The form blocked zero-hour values but did not explain or block a minimum
  greater than maximum.

Fix:

- Added a clear validation hint: `Minimum desired hours must be lower than
maximum desired hours.`
- Added test coverage so the profile PUT is not sent for an inverted range.

### Browser Verification

Verified with the Codex in-app Browser:

- Mobile `/app/i/matching/preferences` at 390px - no horizontal overflow; first
  viewport explains the purpose, focus section, and proof-pack action.
- Mobile bottom of `/app/i/matching/preferences` at 390px - no horizontal
  overflow; `Continue later` and `Save and Continue` stack cleanly above the
  bottom navigation.
- Mobile invalid hours at 390px - no horizontal overflow; inverted range shows
  a visible, specific validation message next to the hours fields.
- Mobile role add interaction at 390px - role chip is added and remains inside
  the form card.
- Desktop `/app/i/matching/preferences` at 1280px - no horizontal overflow;
  header, proof-pack callout, and focus form remain composed beside the sidebar.

### Automated Checks

- `npm run test -- tests/ui/matching-profile-setup-focus.test.tsx tests/ui/matching-preferences-page.test.tsx tests/ui/matching-preferences-client.test.tsx`
  - pass

## Organization Interviews Continuation - Empty, Filled, And Action Layout

### Updated Verdict

Improved for this pass.

The organization interviews corridor now has Browser coverage for the sparse
empty state and an action-heavy filled state. This pass focused on the
organization-side workflow after shortlist/reveal, where schedule, edit,
cancel, completion, no-show, decision, and engagement actions can compete.

### Findings And Fixes

#### P2 - Filled org interview cards clipped actions on mobile

Affected surface:

- `/app/o/test-org/interviews`

Evidence:

- Codex Browser at 390px with filled local corridor data showed the interview
  action column clipped inside the card. The document did not report horizontal
  overflow, but the visible controls were cut off.

Fix:

- Made the interview card layout mobile-first: content and actions stack on
  narrow screens, then switch to a side action rail at desktop widths.
- Added `min-w-0`, full-width mobile buttons, and mobile card padding so long
  assignment titles and action labels stay contained.

#### P3 - Platform labels exposed internal values

Affected surface:

- Organization interview details

Evidence:

- Filled Browser data rendered `Google_meet` instead of the user-facing
  `Google Meet`.

Fix:

- Reused the existing value-label helper for platform display.

#### P2 - Filled org interview corridor had no local visual coverage

Affected surface:

- `/app/o/test-org/interviews`

Evidence:

- Mock mode only rendered the empty interviews state, leaving scheduled,
  completed, decision, and engagement-confirmation states untested in Browser.

Fix:

- Added local-only organization interview visual fixtures gated by
  `NEXT_PUBLIC_USE_MOCK_SUPABASE=true`, `PROOFOUND_VISUAL_FIXTURES=true`, and
  `PROOFOUND_INTERVIEWS_VISUAL_STATE=filled`.
- Seeded one scheduled interview with edit/cancel/complete/no-show actions and
  one completed hire decision requiring engagement confirmation.

### Browser Verification

Verified with the Codex in-app Browser:

- Mobile sparse `/app/o/test-org/interviews` at 390px - no horizontal overflow;
  empty state explains when the page becomes useful.
- Mobile filled `/app/o/test-org/interviews` at 390px - no horizontal overflow;
  long assignment title and corridor timeline are contained.
- Mobile scheduled-interview action area at 390px - no horizontal overflow;
  edit, cancel, mark complete, and no-show actions stack cleanly.
- Mobile completed-hire engagement area at 390px - no horizontal overflow;
  decision and engagement badges, engagement type select, and confirm action
  are reachable above the bottom navigation.
- Mobile edit-interview dialog at 390px - no horizontal overflow; date, time,
  reason, close, and save actions are visible.
- Desktop filled `/app/o/test-org/interviews` at 1280px - no horizontal
  overflow; cards use a composed desktop action rail.

### Automated Checks

- `npm run test -- tests/ui/organization-interviews-page-actions.test.tsx`
  - pass
- `npm run lint`
  - pass
- `npm run typecheck`
  - pass
- `npm run docs:freshness`
  - pass in warning mode with the existing 32 orphan document warnings.

## Individual Verifications Continuation - Empty, Filled, Filter, And Long Data Coverage

### Scope

- `/app/i/verifications`

### Findings And Fixes

#### P2 - Mobile verification filters overloaded the first viewport

Evidence:

- Sparse and filled Codex Browser mobile passes at 390px showed the page needs a
  compact filter control before the request cards. A full row of status chips
  competes with the tab switcher and the primary proof-request content on narrow
  screens.

Fix:

- Kept the full status chips for wider viewports.
- Added a mobile status select with per-filter counts, so narrow screens show
  one clear "Show requests" control before sorting.
- Updated helper copy to explain the selected filter. In particular, `Needs
attention` now explains that it can include failed, disputed, contradicted, or
  soon-expiring pending requests.

#### P3 - Verification tabs showed an unnecessary scrollbar

Evidence:

- Codex Browser showed a small scrollbar next to the `Incoming` / `Sent` tabs on
  both mobile and desktop, despite only two tabs being present.

Fix:

- Removed the unnecessary tab-list overflow behavior and re-tested the tab list
  dimensions. `scrollWidth` now matches `clientWidth` at mobile and desktop
  sizes.

#### P3 - Sent-request cards needed long-data hardening

Evidence:

- Filled-state Codex Browser coverage used a long verifier email address on the
  sent tab to exercise wrapping pressure.

Fix:

- Hardened the sent-card email heading and requested-from text with explicit
  wrapping and non-shrinking icon behavior.

### Browser Verification

Verified with the Codex in-app Browser:

- Sparse mobile `/app/i/verifications` at 390px - no horizontal overflow; empty
  incoming state and compact mobile filter are visible and understandable.
- Sparse desktop `/app/i/verifications` at 1280px - no horizontal overflow;
  empty state remains composed with full filter chips.
- Filled mobile incoming at 390px - no horizontal overflow; long proof title,
  pending manager request, proof context, and confirm action render correctly.
- Filled mobile sent at 390px - no horizontal overflow; long verifier email,
  bundle label, request note, and sent-card actions wrap inside the card.
- Filled tablet-ish incoming at 768px - no horizontal overflow; request cards
  and filters remain scannable beside the sidebar.
- Filled desktop incoming at 1280px - no horizontal overflow; full filter row,
  tabs, and first proof request are composed.
- Mobile `Needs attention` filter at 390px - select changes the visible state,
  shows specific helper copy, and keeps the page within viewport width.

### Automated Checks

- `npm run test -- tests/ui/verifications-client.test.tsx tests/ui/custom-verification-request-dialog.test.tsx`
  - pass
- `npm run lint`
  - pass
- `npm run typecheck`
  - pass

## Individual Communications Continuation - Messages And Interviews Coverage

### Scope

- `/app/i/communications`
- `/app/i/communications?section=interviews`

### Findings And Fixes

#### P3 - Filled message lists used empty-state helper copy

Evidence:

- Filled Codex Browser coverage with `PROOFOUND_VISUAL_FIXTURES=true` rendered
  two conversation rows but the list header still said "Conversations appear
  after a proof-safe introduction." That reads like an empty state even when
  the user has active threads.

Fix:

- Updated `ConversationList` so the helper copy switches when conversations
  exist: "Review open introductions and keep each thread tied to its proof
  corridor."
- Added component coverage for empty-list and filled-list helper copy.

### Browser Verification

Verified with the Codex in-app Browser:

- Sparse mobile communications at 390px - no horizontal overflow; messages and
  interviews sections are visible and the empty/loading state is bounded.
- Sparse desktop communications at 1280px - no horizontal overflow; empty
  message pane gives a clear "Select a conversation" next step.
- Filled mobile communications at 390px - no horizontal overflow; seeded masked
  and revealed conversation rows render with unread count, long assignment
  title, and active-list helper copy.
- Filled mobile masked thread at 390px - no horizontal overflow; message
  history, identity-protection badge, privacy helper, and composer are visible.
- Filled desktop masked thread at 1280px - no horizontal overflow; conversation
  list, reveal context, thread, and composer remain composed.
- Mobile interviews branch at 390px - no horizontal overflow; switch-back link
  and empty interview corridor explain the next state.
- Desktop interviews branch at 1280px - no horizontal overflow; empty interview
  corridor remains composed beside the sidebar.

### Automated Checks

- `npm run test -- tests/ui/conversation-list.test.tsx tests/routes/organization-messages-page.test.tsx`
  - pass

## Assignment Corridor Continuation - Empty, Filled, Builder, And Tablet Coverage

### Updated Verdict

Partially ready, improved for the organization assignment corridor.

The assignment list and assignment builder now have Browser coverage for sparse
empty state, local filled-state assignment cards, the matching recovery panel,
the first builder step, and the job-description import mode. This pass found
and fixed the important tablet/sidebar breakpoint issue where layouts switched
to desktop too early inside a narrow content column.

### Additional Findings And Fixes

#### P2 - Tablet/sidebar width triggered squeezed desktop layouts

Affected surfaces:

- `/app/o/test-org/assignments`
- `/app/o/test-org/assignments/new`

Evidence:

- Codex Browser at 768px showed the desktop sidebar plus too-narrow two-column
  assignment cards and builder controls. Buttons collided or clipped in the
  content column even though the page reported no horizontal overflow.

Fix:

- Moved assignment card grids, assignment page header row, assignment card
  action rows, builder entry-mode buttons, and builder stepper display from
  early `sm` breakpoints to wider `lg`/`xl` breakpoints.
- Kept a compact step summary visible until the full builder stepper has enough
  width.

#### P2 - Assignment list had no filled-state visual coverage

Affected surface:

- `/app/o/test-org/assignments`

Evidence:

- Sparse mock mode only rendered the empty assignment state, so long assignment
  titles, status badges, candidate counts, and review update badges were not
  being exercised in Browser.

Fix:

- Added local-only assignment fixtures gated by
  `NEXT_PUBLIC_USE_MOCK_SUPABASE=true`, `MOCK_ORG_MODE=true`, and
  `PROOFOUND_VISUAL_FIXTURES=true`.
- Seeded one long active assignment with candidate/review activity and one draft
  assignment.
- Improved assignment card mobile actions so `Matching` and `View / Edit` stack
  cleanly before wide desktop space is available.

#### P3 - Builder mobile text and controls were cramped

Affected surface:

- `/app/o/test-org/assignments/new`

Evidence:

- Codex Browser at 390px showed the step title and `Step 1 of 5` fighting for
  the same row, and the clarity helper text sat too close to the card edge.

Fix:

- Let builder step headers, helper/counter rows, and the first-step next button
  stack on narrow screens.
- Reduced builder form card padding on mobile.
- Added `min-w-0`/word wrapping to the clarity assistant card.

### Browser Verification

Verified with the Codex in-app Browser:

- Mobile sparse `/app/o/test-org/assignments` at 390px - no horizontal overflow;
  empty state explains the corridor and first action.
- Desktop sparse `/app/o/test-org/assignments` at 1280px - no horizontal
  overflow; empty state remains composed.
- Mobile sparse `/app/o/test-org/assignments/new` at 390px - no horizontal
  overflow; first builder step, disabled next action, and clarity helper are
  readable.
- Mobile import mode `/app/o/test-org/assignments/new` at 390px - no horizontal
  overflow; paste area and convert action are reachable.
- Mobile filled `/app/o/test-org/assignments` at 390px - no horizontal overflow;
  long active assignment, review update badge, candidate count, and draft card
  remain readable.
- Mobile filled matching panel at 390px - no horizontal overflow; `No matches
yet` recovery actions are clear and reachable. Re-tested after making visual
  fixture assignment IDs UUID-shaped and adding the local-only empty match
  response; the panel no longer shows a false `Failed to load matches` toast.
- Tablet-ish filled `/app/o/test-org/assignments` at 768px - no horizontal
  overflow; cards and actions stack instead of colliding beside the sidebar.
- Tablet-ish `/app/o/test-org/assignments/new` at 768px - no horizontal
  overflow; entry-mode buttons stack and the compact step summary remains
  readable.
- Desktop filled `/app/o/test-org/assignments` at 1280px - no horizontal
  overflow; filled cards and primary action remain composed.

### Automated Checks

- `npm run test -- tests/ui/matching-organization-view-beta.test.tsx tests/ui/assignment-clarity-assistant.test.tsx tests/api/assignments.test.ts`
  - pass
- `npm run test -- tests/ui/assignment-builder-mode-entry.test.tsx`
  - currently fails before client assertions because the test renders the async
    server page directly and receives a Promise React child; Browser verification
    covered the live builder surface in this pass.
- `npm run lint` - pass
- `npm run typecheck` - pass
- `npm run docs:freshness` - pass in warning mode with the existing 32 orphan
  document warnings.

## Keyboard Accessibility Continuation - Auth And Mobile Shell Controls

### Updated Verdict

Improved for representative auth and app-shell controls.

This continuation found and fixed controls that were visually understandable but
not explicit enough for keyboard and assistive-technology paths: login and
signup consent checkboxes now carry direct names, the compact cookie close
control has a specific action label and focus ring, and mobile bottom navigation
links have visible focus treatment.

### Browser Verification

Verified with the Codex in-app Browser using DOM-backed rendered checks:

- Mobile `/login` at 390px - no horizontal overflow; `Remember me`, password
  visibility, forgot-password, and submit controls are visible and named.
- Mobile `/signup/organization` at 390px - no horizontal overflow; required
  consent, marketing opt-in, password visibility, and submit controls are
  visible and named.
- Mobile `/app/i/settings/privacy` at 390px - no horizontal overflow; bottom
  navigation links expose names and focus-visible styling.
- Desktop `/login` at 1280px - no horizontal overflow; login control names and
  focus-visible classes remain present.

Evidence:

- `.artifacts/ux-browser-goal-2026-05-18/keyboard/keyboard-accessibility-browser-state.json`

Note: native Tab dispatch in the current in-app Browser session kept focus on
`body`, and the Browser DOM proxy did not expose `HTMLElement.focus()`. The
saved evidence therefore records rendered tabbables, names, focus-visible
classes, and overflow rather than claiming a full native Tab traversal.

### Automated Checks

- `npm run test -- tests/ui/signin-form-mobile-clarity.test.tsx tests/ui/signup-form-mobile-clarity.test.tsx tests/ui/cookie-banner.test.tsx tests/ui/left-nav-portfolio-gating.test.tsx`
  - pass

## Public Individual Profile Fixture Continuation

### Updated Verdict

Improved for public profile data variance.

The previous full-coverage evidence included `/portfolio/demo-proofound`, but
the saved Browser row showed a generic page-not-found state. This continuation
adds a real local mock individual Public Page fixture for that route so the
public surface can be tested with representative filled proof packs, public-safe
evidence, hidden contact details, and anonymous-viewer actions.

### Findings And Fixes

#### P2 - Demo individual Public Page route was not a real filled fixture

Affected surface:

- `/portfolio/demo-proofound`

Fix:

- Added a mock Supabase projection for `demo-proofound` with two public-safe
  Proof Packs, multiple skills, traceable summary segments, hidden contact
  details, and no owner relationship to the default mock user.

#### P3 - Evidence links had ambiguous repeated names

Affected surface:

- Public individual Proof Pack evidence links

Fix:

- Kept the compact visible `Open` text, but added specific accessible names such
  as `Open Public-safe decision memo` and `Open Rubric extract`.

### Browser Verification

Verified with the Codex in-app Browser:

- Mobile `/portfolio/demo-proofound` at 390px - no horizontal overflow; renders
  Mika Andersson, both proof packs, hidden contact state, request-introduction
  action, and no owner-only controls.
- Narrow mobile `/portfolio/demo-proofound` at 375px - no horizontal overflow;
  same filled proof content and public actions remain reachable.
- Desktop `/portfolio/demo-proofound` at 1280px - no horizontal overflow; share,
  PDF, recruiter summary, proof evidence, and contact-request actions are clear.

Evidence:

- `.artifacts/ux-browser-goal-2026-05-18/public-profile-fixture/demo-proofound-browser-state.json`

### Automated Checks

- `npm run test -- tests/lib/public-portfolio-projection.test.ts tests/ui/public-portfolio-page.test.tsx`
  - pass
