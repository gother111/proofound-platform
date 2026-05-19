# Non-MVP Expertise UI Tests

These tests covered the old Expertise Atlas, Add Skill drawer, L4 skill cards, and legacy CV/JD import wizard UI.

The locked launch corridor no longer exposes `/app/i/expertise`, and the launch surface policy keeps broad `/api/expertise/cv-import/*` wizard routes archived with 410 responses. Keeping these component tests in active discovery made archived UI behavior look like launch evidence.

Retained active coverage lives in:

- `tests/api/archived-api-handlers-route.test.ts` for launch-safe 410 behavior.
- `tests/api/launch-page-inventory.test.ts` for proving `/app/i/expertise` is not a compiled launch page.
- Proof Pack, portfolio, verification, and Start from CV tests for active MVP import/proof workflows.
