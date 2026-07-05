# Architecture And Data Flow

## Entry

1. `/onboarding` passes `guest_first_proof_private_scaffolding` only for the candidate-invite onboarding path.
2. `IndividualContextProofSetup` shows the optional “Start from CV - draft your proof foundation” entry point only when Start from CV status allows it.
3. `StartFromCvDialog` requires a selected file and explicit processing consent.

## API Flow

1. `POST /api/ai/start-from-cv/sessions` creates a user-owned session with consent timestamp and expiry.
2. `POST /api/ai/start-from-cv/sessions/[sessionId]/extract` validates auth, beta/surface access, session state, expiry, MIME type, magic bytes, size, and page count.
3. The server extracts embedded PDF text locally first. Guarded external OCR is used only if configured and launch-gated.
4. Extracted text is redacted and privacy-checked before structuring.
5. Provider policy checks whether a live AI call is allowed. If blocked, deterministic drafting is used.
6. Draft JSON is stored on the user-owned session. Raw CV text and source files are not persisted by this flow.
7. `POST /api/ai/start-from-cv/sessions/[sessionId]/accept` accepts only draft IDs already present in the stored session payload.

## Persistence

- `start_from_cv_import_sessions`: stores consent, expiry, redaction summary, bounded draft payload, accepted payload, safe provider metadata, source-deleted timestamp, and status.
- `experiences`, `education`, `volunteering`: selected context drafts are written as unverified private profile context rows.
- Proof Pack ideas, artifact hints, canonical skill mappings, outcome questions, unsupported skills, and future ideas remain session review notes.
