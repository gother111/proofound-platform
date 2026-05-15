# Project Change Entry

- Date/time (UTC): 2026-05-15T21:53:08Z
- Branch: codex/pro-188-first-proof-verification
- Base commit: cd7949f5
  What changed:
- Renamed launch-facing org surfaces from Trust Profile / Public Trust Profile to Organization Profile / Public Preview.
- Removed the org account-menu settings link and kept org account actions inside profile/public-preview routes.
- Expanded launch surface policy and tests for org-suite APIs/pages such as goals, culture, impact, structure, partnerships, projects, and broad analytics.
- Removed the unused legacy OrganizationProfileView that rendered non-MVP org-suite components.

Why:

- PRO-203 requires the MVP org experience to be one restrained Organization Profile and to keep broader org-suite behavior out of launch flows.

How to verify:

- Targeted Vitest pack passed: route policy, middleware archive behavior, launch inventories, archived route assertions, org nav/menu, organization profile page, public org page, and organization update API.
- Lint passed.

Open risks / TODO:

- Full typecheck is still blocked by unrelated dirty-branch errors outside this PRO-203 change set.
