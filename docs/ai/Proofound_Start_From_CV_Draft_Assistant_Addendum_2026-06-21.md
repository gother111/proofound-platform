> Doc Class: `reference-spec`
> Last Verified: `2026-06-21`

# Proofound Start from CV Draft Assistant Addendum

This addendum is subordinate to the locked MVP source of truth, aligned PRD, technical requirements, launch runbook, GTM plan, and the 2026-05-03 assistive AI addendum. It narrowly authorizes the authenticated individual Start from CV draft assistant as optional first-proof scaffolding.

## Authorized Surface

- Surface: `guest_first_proof_private_scaffolding`.
- User: authenticated individual profile only.
- Entry point: invite/onboarding first-proof setup, not a public directory, employer parser, ATS replacement, or profile-wide CV import.
- Input: one user-selected CV file with explicit per-session consent.
- Output: private editable drafts and review notes only.

## Required Boundaries

- No publishing, verification, trust state, match state, scoring, ranking, shortlisting, hiring recommendation, or candidate evaluation can be created from CV parsing.
- Work, education, and volunteering drafts may be saved only as unverified private context after user selection.
- Proof Pack ideas, artifact hints, canonical skill mappings, outcome questions, and future project ideas remain draft/session review notes unless a later explicit user action creates proof through the normal proof flow.
- Canonical skill suggestions must not assign proficiency, seniority, trust lift, matching lift, or verification state.
- Future project ideas must be labeled as future ideas and not treated as CV facts.

## Provider Policy

The live structuring adapter may use Gemini or DeepSeek V4 Flash behind assistive AI gates, raw prompt logging checks, production hard-cap checks, and the redacted input path. `START_FROM_CV_AI_PROVIDER` is a policy selector, not blanket permission to call new providers.

- `gemini`: allowed only through the existing assistive AI controls.
- `deepseek-v4-flash`: allowed only for Start from CV when the server has `START_FROM_CV_DEEPSEEK_API_KEY` and `START_FROM_CV_DEEPSEEK_PERSONAL_DATA_ENABLED=true`; production-like environments also require `START_FROM_CV_DEEPSEEK_PRODUCTION_ENABLED=true`.
- `nvidia-deepseek-v4-flash`: synthetic/deidentified policy path only; no real CV or personal data.
- `mock`: local or synthetic evaluation only.
- `disabled`: deterministic drafting only.

If the policy denies a provider, Start from CV must fail closed to deterministic drafting or safe unavailability. It must not silently send CV text to an unapproved adapter.

## Privacy And Retention

- Do not persist raw CV text, source files, original filenames, prompts, model reasoning, or personal contact details in logs.
- Store only redaction summaries, hashes, bounded draft JSON, safe provider metadata, and user-owned session state.
- Enforce session expiry for non-final sessions.
- Accept requests must be constrained to draft IDs already present in the stored session payload.

## Launch Gates

Before any production or open-beta expansion, collect current evidence for:

- route, UI, and state-machine tests;
- privacy/RLS coverage for `start_from_cv_import_sessions`;
- provider policy and no-raw-logging checks;
- accessibility and responsive review-screen evidence;
- synthetic/deidentified provider smoke tests only for non-Gemini trial providers;
- explicit approval for any schema, RLS, cleanup cron, or production OCR change.
