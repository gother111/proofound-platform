---
name: privacy-security-rls-review
description: Use when work touches auth, sessions, permissions, RLS, policies, storage, privacy, public visibility, redaction, uploads, secrets, AI safety, logs, or user data. Do not trigger for pure copy, styling, or docs work that does not affect privacy/security semantics.
---

# Privacy Security RLS Review

Use this skill to protect Proofound's privacy-first contract.

## Required Review

- Name the protected invariant, such as blind-by-default review, explicit reveal, private uploads, public-safe portfolio projection, RLS isolation, redacted logs, or user-controlled visibility.
- List likely regression modes.
- Check whether approval is required before changing auth, privacy, RLS, storage, migrations, production settings, secrets, or externally visible data.
- Refuse or escalate any request that exposes secrets or weakens privacy without explicit approval and written motivation.

## Verification

- Prefer focused tests that directly prove the invariant.
- For RLS/privacy changes, include relevant privacy suites such as `npm run test:privacy`, `npm run test:privacy:extended`, or targeted tests from `tests/privacy/**`.
- Verify logs and evidence do not contain secrets or sensitive personal data.
