# Python Document-Intelligence Tests

> Doc Class: `active`
> Last Verified: `2026-05-19`

These tests cover the Python document-intelligence package and its retained service dispatch behavior. They are useful for local package confidence, but they are not the default MVP launch gate.

Launch boundary:

- `suggest` and `extract` coverage supports deterministic document parsing and taxonomy matching used by approved document-intelligence work.
- `wizard-suggest` and `internal-job` dispatch coverage proves those retained compatibility endpoints return archived `410` responses.
- The retired CV import wizard and Python internal worker are not active MVP launch surfaces.
- Use `npm run test:launch:ai`, `npm run test:launch:routes`, and the final launch checklist for launch evidence. Use `npm run test:python` as package-level regression coverage only.
