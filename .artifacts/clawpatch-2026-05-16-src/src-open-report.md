# clawpatch report

findings: 13

## medium: Readiness validation is not atomic with the publish update

id: fnd_sig-feat-route-0b54f0f0fb-379f7b_ddb2dcb442
category: concurrency
confidence: medium
triage: risk
status: open
feature: Route /api/assignments/:id/publish (feat_route_0b54f0f0fb)
next: clawpatch show --finding fnd_sig-feat-route-0b54f0f0fb-379f7b_ddb2dcb442

evidence:

- app/api/assignments/[id]/publish/route.ts:64-134 (POST)
- app/api/assignments/[id]/publish/route.ts:179-187 (POST)

The route reads assignment, organization, outcomes, and feature-flag-dependent readiness before the final update, but the update only matches by assignment id. A concurrent request can remove required outcomes, downgrade org readiness, change creationStatus, or otherwise invalidate publish readiness after validation and before the update; this request will still publish the stale snapshot.

recommendation:
Perform publish in a transaction with row locking or use a guarded conditional update that rechecks the publish-critical predicates at write time. If any predicate no longer matches, return a 409 and ask the client to refresh.

test analysis:
The feature metadata lists no linked tests, and there is no concurrency or stale-read test around publish readiness.

suggested regression test:
Add a publish test that simulates a stale readiness snapshot and verifies the final update does not activate the assignment when outcomes or creationStatus have changed before write.

minimum fix scope:
Guard the final update in app/api/assignments/[id]/publish/route.ts and handle zero-row updates as a 409 or 404 instead of proceeding.

repro:
While one request is between readiness validation and the update, run a second request that removes the last outcome or changes the assignment out of review_ready; the first request can still update the assignment to active.

## medium: Publish endpoint can reactivate held or closed assignments

id: fnd_sig-feat-route-0b54f0f0fb-8eddcc_57e4ef231e
category: bug
confidence: high
triage: confirmed-bug
status: open
feature: Route /api/assignments/:id/publish (feat_route_0b54f0f0fb)
next: clawpatch show --finding fnd_sig-feat-route-0b54f0f0fb-8eddcc_57e4ef231e

evidence:

- app/api/assignments/[id]/publish/route.ts:72-84 (POST)
- app/api/assignments/[id]/publish/route.ts:179-187 (POST)

The route gates publishability only on creationStatus, then unconditionally writes status='active'. Because the same row has a separate workflow status, any assignment that is already on hold or closed but still has creationStatus='review_ready' will be reactivated through this publish route instead of requiring the appropriate resume/reopen lifecycle path.

recommendation:
Reject non-publishable workflow statuses before publishing, allowing only draft and optionally active for idempotency. Also include the allowed current status in the update predicate so a concurrent status change cannot be overwritten.

test analysis:
The feature metadata lists no linked tests, and the route has no visible assertion that closed or held assignments are rejected.

suggested regression test:
Exercise POST /api/assignments/:id/publish with status='closed' and creationStatus='review_ready' and assert a 409 response plus no status change.

minimum fix scope:
Add workflow-status validation and a guarded update predicate in app/api/assignments/[id]/publish/route.ts.

repro:
Create or update an assignment so creationStatus is review_ready and status is closed or hold, then POST /api/assignments/:id/publish with a valid manager principal; the final update sets status to active.

## low: JSON and text export failures are reported as PDF generation failures

id: fnd_sig-feat-route-0b8c982556-1a568b_9994d181e8
category: api-contract
confidence: high
triage: contract-mismatch
status: open
feature: Route /api/portfolio/public/:handle/export (feat_route_0b8c982556)
next: clawpatch show --finding fnd_sig-feat-route-0b8c982556-1a568b_9994d181e8

evidence:

- app/api/portfolio/public/[handle]/export/route.ts:24-31
- app/api/portfolio/public/[handle]/export/route.ts:59-65

The route explicitly supports json, text, and pdf formats, but its shared catch block always returns a PDF-specific error message. Any exception while serving format=json or format=text, including projection/export-data serialization or text-pack construction failures, will produce an inaccurate API response. That makes client-side error handling and support diagnostics misleading for two of the three documented formats.

recommendation:
Resolve the requested format before the try/catch or use a format-neutral 500 response such as 'Failed to generate export'.

test analysis:
The discovered public export route tests cover successful pdf/json/text responses and 404 inaccessible states, but do not mock an exception for json or text export paths and assert the 500 body.

suggested regression test:
Add a test that requests ?format=text, makes buildTextPack or the projection resolver throw after access succeeds, and asserts a format-neutral 500 error body.

minimum fix scope:
Change the public export route's catch response message, or compute format early and return format-specific failure messages for all supported formats.

## low: Unauthenticated preview response exposes stable internal workflow identifiers

id: fnd_sig-feat-route-0ed8976d1d-071c0a_4efae85827
category: security
confidence: medium
triage: risk
status: open
feature: Route /api/candidate-invites/:token (feat_route_0ed8976d1d)
next: clawpatch show --finding fnd_sig-feat-route-0ed8976d1d-071c0a_4efae85827

evidence:

- app/api/candidate-invites/[token]/route.ts:157-171 (GET)
- app/api/candidate-invites/[token]/route.ts:166-170 (GET)

The route is a bearer-token preview endpoint and does not require an authenticated user before returning invite details. The response includes claimedByProfileId, acceptedByProfileId, matchId, and conversationId. A forwarded, logged, or leaked invite URL can therefore disclose stable internal profile and workflow identifiers to someone who is not the invitee. The client can usually be served with safer derived fields, such as whether the current authenticated user owns the claim and whether a communications link should be shown.

recommendation:
Do not include raw profile, match, or conversation identifiers in the unauthenticated preview payload. Return them only after authenticating the invitee, or replace them with booleans/derived URLs gated to the current user.

test analysis:
The feature has no linked tests asserting the unauthenticated preview payload excludes private identifiers.

suggested regression test:
Add a GET preview test for an unauthenticated request against a claimed invite and assert the payload does not contain claimedByProfileId, acceptedByProfileId, matchId, or conversationId.

minimum fix scope:
Adjust this route's response projection and the invite client state shape to use derived authorization-safe fields instead of raw internal ids.

repro:
Fetch a claimed invite token without being authenticated as the candidate. The JSON response includes the claimed profile id and, for test matches, match/conversation identifiers when present.

## medium: Preview requests can invalidate the redeem-session cookie for the real claimant

id: fnd_sig-feat-route-0ed8976d1d-112f76_b086e04bd8
category: concurrency
confidence: high
triage: confirmed-bug
status: open
feature: Route /api/candidate-invites/:token (feat_route_0ed8976d1d)
next: clawpatch show --finding fnd_sig-feat-route-0ed8976d1d-112f76_b086e04bd8

evidence:

- app/api/candidate-invites/[token]/route.ts:28-36 (GET)
- app/api/candidate-invites/[token]/route.ts:203-212 (GET)

The GET preview path starts a new capability redeem session every time the invite is viewed and then returns the new nonce in a cookie. The inspected helper stores only one redeem-session nonce per token, so two overlapping GETs can race: request A writes nonce A, request B writes nonce B, then the browser can receive A last and keep a cookie that no longer matches the database. A later token scanner or another tab can also rotate the stored nonce after the user loads the invite, causing the subsequent claim POST to fail as an invalid invite even though the token and user are valid.

recommendation:
Make preview session creation idempotent for an unexpired nonce, or support multiple active nonce hashes per token/session. At minimum, avoid rotating an existing valid nonce unless the response is guaranteed to carry the nonce that remains current.

test analysis:
The feature declares no linked tests, and the route has no apparent regression test for duplicate preview GETs or out-of-order responses before claim.

suggested regression test:
Mock begin/redeem session storage, perform two overlapping GET previews for the same token with reversed response order, then assert the cookie returned to the client can still be used by the claim route.

minimum fix scope:
Change the preview redeem-session logic used by this route so repeated GETs do not invalidate an already-issued valid redeem-session cookie.

repro:
Open the same invite URL twice concurrently, or issue two GETs where the first response is delayed until after the second has updated the token nonce. Use the cookie from the stale response for the claim POST; the claim route will reject the redeem session nonce.

## medium: Expired-preview update can overwrite a concurrent invite state transition

id: fnd_sig-feat-route-0ed8976d1d-d324af_520515af1e
category: concurrency
confidence: medium
triage: risk
status: open
feature: Route /api/candidate-invites/:token (feat_route_0ed8976d1d)
next: clawpatch show --finding fnd_sig-feat-route-0ed8976d1d-d324af_520515af1e

evidence:

- app/api/candidate-invites/[token]/route.ts:67-74 (GET)

The route selects the invite, decides it is expired, and then updates the row by id only. If another request claims or submits proof for the same invite between the select and this update, this preview request can still write status=expired over the newer status because the UPDATE does not compare the previously-read status or exclude terminal/claimed states. That can corrupt the workflow state around the expiry boundary.

recommendation:
Make the expiry update conditional on the row still being in an expirable state, for example by adding a status predicate and claimed/submitted guards, or perform the state decision and update in a transaction with compare-and-set semantics.

test analysis:
No linked tests cover races between preview expiry handling and claim/proof submission state transitions.

suggested regression test:
Add a route-level or repository-level test that simulates a stale preview read followed by a concurrent claim transition, then verifies the preview expiry update does not overwrite the claimed/proof-submitted status.

minimum fix scope:
Tighten the UPDATE predicate in this route's expiry branch and align any sibling invite routes that perform the same stale-read expiry write.

repro:
At the expiry boundary, let GET read a pending expired invite, then have a claim/proof request update the same invite before the GET executes its UPDATE. The GET then writes expired by id and returns 404, leaving the invite expired despite the concurrent successful transition.

## medium: Route never loads conversations when auth completes without a user

id: fnd_sig-feat-route-0f03247aec-6d108f_535e795e67
category: bug
confidence: high
triage: confirmed-bug
status: open
feature: Route /app/o/:slug/messages (feat_route_0f03247aec)
next: clawpatch show --finding fnd_sig-feat-route-0f03247aec-6d108f_535e795e67

evidence:

- app/app/o/[slug]/messages/page.tsx:39-43 (OrganizationMessagesPageContent)
- app/app/o/[slug]/messages/page.tsx:172-178 (OrganizationMessagesPageContent)

After authentication finishes with no current user, the component returns the same loading UI forever. The conversations effect also only runs when currentUserId exists, so unauthenticated or expired-session users never get a redirect, forbidden state, or actionable error. For a protected organization route, this is a correctness and access-flow bug because the page can hang indefinitely instead of following the app's auth contract.

recommendation:
Handle the resolved unauthenticated state explicitly: redirect to sign-in, render the app's unauthorized state, or delegate to the route guard used by sibling protected pages. Keep the loading state only for isAuthLoading=true.

test analysis:
No linked tests were included for this route, and the file has no test evidence covering the isAuthLoading=false/currentUserId=null branch.

suggested regression test:
Add a route/component test that mocks useAuth returning { isLoading: false, userId: null } and asserts the protected-route behavior is not the loading placeholder.

minimum fix scope:
Update app/app/o/[slug]/messages/page.tsx auth-state rendering and add a focused test for the unauthenticated resolved state.

repro:
Open /app/o/<slug>/messages in a browser state where useAuth resolves isAuthLoading=false and userId is null. The rendered page remains "Loading..." indefinitely.

## low: Changing the conversation query parameter after initial auto-select is ignored

id: fnd_sig-feat-route-0f03247aec-b96920_a885726d84
category: bug
confidence: high
triage: confirmed-bug
status: open
feature: Route /app/o/:slug/messages (feat_route_0f03247aec)
next: clawpatch show --finding fnd_sig-feat-route-0f03247aec-b96920_a885726d84

evidence:

- app/app/o/[slug]/messages/page.tsx:45-55 (OrganizationMessagesPageContent)

The route advertises support for ?conversation=<id>, but the hasAutoSelected latch prevents later URL changes from selecting a different valid conversation during the same component lifetime. That can happen through client-side navigation, shared links opened while already on the messages route, or back/forward history. The UI remains on the old thread while the URL points to another thread.

recommendation:
Derive selection from conversationParam whenever it changes and exists in the loaded list, or track the last applied conversationParam instead of a one-way boolean latch.

test analysis:
No linked tests were included, and there is no evidence of a test that changes search params after the initial selection.

suggested regression test:
Add a test that renders with conversation=A, updates the search param to conversation=B after conversations load, and asserts B is selected.

minimum fix scope:
Replace hasAutoSelected with query-param-aware synchronization in app/app/o/[slug]/messages/page.tsx and cover URL changes in a focused test.

repro:
Load /app/o/acme/messages?conversation=A, wait for auto-selection, then client-navigate to /app/o/acme/messages?conversation=B without remounting. Because hasAutoSelected is true, selectedConversationId stays A even when B exists.

## medium: Invalid request bodies are reported as server failures

id: fnd_sig-feat-route-1284e11a86-964c27_0e5a115ef6
category: api-contract
confidence: high
triage: contract-mismatch
status: open
feature: Route /api/admin/organizations/:orgId/verify (feat_route_1284e11a86)
next: clawpatch show --finding fnd_sig-feat-route-1284e11a86-964c27_0e5a115ef6

evidence:

- app/api/admin/organizations/[orgId]/verify/route.ts:100-101 (POST)
- app/api/admin/organizations/[orgId]/verify/route.ts:176-187 (POST)

Malformed JSON from request.json() and validation failures from OrgTrustTierSchema.parse() are caught by the broad catch block and returned as 500. These are client/input errors at a user-input and network boundary, so callers receive the wrong API contract and operational logs will show expected bad input as route failures.

recommendation:
Handle SyntaxError and z.ZodError separately before the generic catch response, returning 400 with a stable validation error shape. Keep unexpected exceptions on the 500 path.

test analysis:
No linked tests were included for malformed JSON or schema validation failure behavior.

suggested regression test:
Add route-handler tests for malformed JSON, invalid trustTier, overlong reasonCode, and the no trustTier/verified case, asserting 400 for client validation errors and 500 only for unexpected failures.

minimum fix scope:
Route-local error handling around request.json() and OrgTrustTierSchema.parse().

repro:
POST a syntactically valid authenticated request with {"trustTier":"not_a_tier"} or malformed JSON. The schema parse/request parsing throws and the catch block returns {"error":"Failed to update organization verification"} with status 500 instead of a 400 validation response.

## high: Trust-tier changes are committed before audit writes without an atomic boundary

id: fnd_sig-feat-route-1284e11a86-e35f98_2b2982acce
category: data-loss
confidence: medium
triage: risk
status: open
feature: Route /api/admin/organizations/:orgId/verify (feat_route_1284e11a86)
next: clawpatch show --finding fnd_sig-feat-route-1284e11a86-e35f98_2b2982acce

evidence:

- app/api/admin/organizations/[orgId]/verify/route.ts:123-135 (POST)
- app/api/admin/organizations/[orgId]/verify/route.ts:136-169 (POST)
- app/api/admin/organizations/[orgId]/verify/route.ts:176-187 (POST)

The organization trust tier is updated first, then the transition row and admin audit log are written in separate awaited operations. If the transition insert or logAdminAction fails after the update succeeds, the route returns 500 while the sensitive trust-tier mutation remains committed without the full audit trail required by the route contract. Retrying can also create misleading later audit history for an already-mutated organization.

recommendation:
Wrap the organization update and transition insert in a database transaction, and make the audit write part of the same transactional unit if logAdminAction uses the same database. If the admin logger cannot participate in the transaction, persist an in-transaction audit/outbox record before committing and process the external log separately.

test analysis:
No linked tests were included for partial failure between the organization update, transition insert, and admin audit log.

suggested regression test:
Add a route test that mocks the transition insert or admin logger to fail after the organization update path and asserts that the organization trust-tier fields are not committed without the audit/transition record, or that an in-transaction outbox/audit record is present.

minimum fix scope:
Route-local transaction/outbox restructuring for the update plus audit trail writes.

repro:
Cause db.insert(organizationTrustTierTransitions) or logAdminAction to throw after db.update(organizations) succeeds. The organization row is already changed, but the handler returns 500 and the corresponding transition/admin audit entry may be missing.

## medium: Proof-fit checks read a metric key that getAllMetrics does not return

id: fnd_sig-feat-route-14511db2ac-0fbcee_b8f9b5a18f
category: bug
confidence: high
triage: confirmed-bug
status: open
feature: Route /api/cron/health-check (feat_route_14511db2ac)
next: clawpatch show --finding fnd_sig-feat-route-14511db2ac-0fbcee_b8f9b5a18f

evidence:

- app/api/cron/health-check/route.ts:69 (GET)
- app/api/cron/health-check/route.ts:102-120 (GET)
- lib/analytics/metrics.ts:867-877 (getAllMetrics)

The health route expects getAllMetrics() to expose metrics.pacLift, but the current implementation returns the PAC lift result under metrics.pac. As a result, the proof-fit acceptance and contract health checks are skipped entirely and the response can report healthy without any proof-fit check entries, even when PAC lift is below target.

recommendation:
Use the returned metrics.pac key in this route, or change getAllMetrics() to return pacLift consistently and update callers. Prefer a typed return contract so this mismatch fails typecheck.

test analysis:
No linked tests were provided for this route, and getAllMetrics() is typed as Record<string, any>, so typecheck would not catch the misspelled/mismatched key.

suggested regression test:
Mock getAllMetrics() to return { pac: { lift: 10 }, ttsc: null, ttfqi: null } and assert the health response includes warning checks for proof-fit acceptance and contract.

minimum fix scope:
Align the route with getAllMetrics()'s PAC key or align getAllMetrics() with the route's expected pacLift key, then add a focused route test.

repro:
Call GET with valid internal authorization while calculatePACLift() returns a low lift. getAllMetrics() returns that value as metrics.pac, so metrics.pacLift is undefined and checks.pac_acceptance/checks.pac_contract are never populated.

## medium: Warning thresholds are looser than the targets reported to operators

id: fnd_sig-feat-route-14511db2ac-aa2b18_434490ad70
category: bug
confidence: high
triage: confirmed-bug
status: open
feature: Route /api/cron/health-check (feat_route_14511db2ac)
next: clawpatch show --finding fnd_sig-feat-route-14511db2ac-aa2b18_434490ad70

evidence:

- app/api/cron/health-check/route.ts:72-75 (GET)
- app/api/cron/health-check/route.ts:87-90 (GET)
- app/api/cron/health-check/route.ts:103-106 (GET)
- app/api/cron/health-check/route.ts:112-115 (GET)

The route messages state targets of 30 TTSC days, 72 TTFQI hours, 20% proof-fit acceptance lift, and 15% proof-fit contract lift, but the actual comparisons only warn above 35 days, above 96 hours, below 15%, and below 12%. Values that miss the stated targets, such as TTSC 34 days or TTFQI 90 hours, are returned as healthy. This creates false-positive monitoring results for a production health endpoint.

recommendation:
Make the comparisons match the stated targets, or rename the messages to explicitly describe separate warning thresholds. If the intended policy has both target and warning bands, encode both names clearly in constants.

test analysis:
No linked route tests were provided, and the threshold policy is encoded inline without tests covering boundary values between target and current warning thresholds.

suggested regression test:
Add boundary tests asserting TTSC values above 30, TTFQI values above 72, PAC acceptance lift below 20, and PAC contract lift below 15 produce warning status if those are the intended targets.

minimum fix scope:
Update the inline threshold constants/comparisons and add focused boundary coverage for this route.

repro:
Mock metrics.ttsc.value as 34 and metrics.ttfqi.value as 90. The endpoint returns checks.ttsc/checks.ttfqi as healthy even though its own warning messages define those as exceeding the targets.

## medium: Route file implements /llms.txt, not the claimed /llms path

id: fnd_sig-feat-route-1769d7f40c-73e9ac_5d18fa828d
category: api-contract
confidence: high
triage: contract-mismatch
status: open
feature: Route /llms (feat_route_1769d7f40c)
next: clawpatch show --finding fnd_sig-feat-route-1769d7f40c-73e9ac_5d18fa828d

evidence:

- app/llms.txt/route.ts:3-12 (GET)

In the Next.js App Router, a route handler's URL path is derived from its folder path. A handler at app/llms.txt/route.ts serves /llms.txt, while /llms would require app/llms/route.ts or a redirect/rewrite. The feature metadata claims route /llms, so callers requesting /llms will not hit this handler and may receive a 404 or another route's response.

recommendation:
Either correct the feature route contract to /llms.txt, or add/move a route handler at app/llms/route.ts if /llms is the intended public endpoint.

test analysis:
No tests were included for this feature, and no route-level assertion verifies that the claimed /llms URL returns the llms text response.

suggested regression test:
Add a route smoke test that requests /llms and /llms.txt according to the intended contract, asserting the expected status, content type, and body.

minimum fix scope:
Align the route path and metadata contract by changing the file location or adding the missing route/redirect.

repro:
Request GET /llms in a Next.js app containing only this route handler; the handler at app/llms.txt/route.ts is not matched because its route is /llms.txt.
