# Non-MVP CV Import Wizard Tests

> Doc Class: `historical`
> Last Verified: `2026-05-19`

These tests cover the retired CV import wizard and Python proxy behavior behind `/api/expertise/cv-import/wizard-*`.

The locked MVP launch corridor keeps those public routes as archived `410` compatibility handlers. Active launch evidence lives in:

- `tests/api/archived-api-handlers-route.test.ts` for direct archived handler behavior.
- `tests/api/launch-surface-inventory.test.ts` for route-surface classification.
- `tests/lib/start-from-cv.test.ts`, `tests/api/start-from-cv-route.test.ts`, and Proof Artifact Text Extraction tests for the approved, user-reviewed import/proof beta surfaces.

Do not move these tests back into default discovery unless the locked MVP authority stack explicitly reopens the old wizard route family.
