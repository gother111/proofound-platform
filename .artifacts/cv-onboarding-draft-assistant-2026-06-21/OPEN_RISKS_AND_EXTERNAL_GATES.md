# Open Risks And External Gates

## Open Risks

- Privacy/RLS tests could not run without Supabase test credentials.
- Retention cleanup is represented by expiry and delete/discard paths, but no active cleanup cron evidence was added.
- Accepted context rows still do not carry durable per-row CV provenance because no schema change was made.
- Full synthetic evaluation with 30 cases and 12 PDFs was not completed.
- No live non-Gemini trial provider call was attempted, by design.

## Gates Before Broader Launch

- Add Start from CV-specific RLS/privacy tests.
- Add retention cleanup job evidence or explicitly document existing cleanup ownership.
- Complete synthetic/deidentified evaluation corpus.
- Collect responsive/a11y visual evidence.
- Request explicit approval before any schema/RLS migration, production OCR change, live trial-provider adapter, push, pull request, or production deployment.
