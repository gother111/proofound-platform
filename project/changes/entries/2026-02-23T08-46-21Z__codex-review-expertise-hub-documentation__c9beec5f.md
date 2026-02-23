# Project Change Entry

- Date/time (UTC): 2026-02-23T08:46:21Z
- Branch: codex-review-expertise-hub-documentation
- Base commit: c9beec5f
  What changed:
- Moved Skill Gaps from a dedicated destination page into the Expertise Atlas `Gap Analysis` tab by embedding `SkillGapsClient` in `src/app/app/i/expertise/ExpertiseAtlasClient.tsx`.
- Added tab deep-link support on `src/app/app/i/expertise/page.tsx` via `?tab=atlas|gap-analysis|import-cv` and propagated `initialTab` into `ExpertiseAtlasClient`.
- Added new bootstrap endpoint `src/app/api/skill-gaps/overview/route.ts` that returns `gaps`, `assignments`, `matrix`, `coverage`, `learning`, and `goals`.
- Refactored `src/components/skill-gaps/SkillGapsClient.tsx` to support lazy initialization from `/api/skill-gaps/overview` when preloaded props are absent, including loading and retry states.
- Converted `src/app/app/i/skill-gaps/page.tsx` into a backward-compatible redirect to `/app/i/expertise?tab=gap-analysis`.
- Rewired known internal links to the tab deep-link in:
- `src/components/dashboard/GapMapWidget.tsx`
- `src/components/dashboard/MatchingReadinessCard.tsx`
- `src/components/dashboard/ReadinessSprintPanel.tsx`
- `src/app/docs/expertise-atlas/page.tsx`

Why:

- The previous flow required an extra page transition from Expertise to Skill Gaps, which added friction for an analysis that belongs in the Expertise context.
- Keeping `/app/i/skill-gaps` as a redirect preserves existing bookmarks and internal references while consolidating the user experience.
- Lazy bootstrap avoids loading Skill Gaps data on every default `/app/i/expertise` visit.

How to verify:

- `npm run lint` (PASS)
- `npm run typecheck` (PASS)
- `npm run test` (PASS)
- `npm run build` (PASS)
- Manual smoke:
- Open `/app/i/expertise`, click `Gap Analysis`, verify full Skill Gap Analysis UI loads.
- Open `/app/i/expertise?tab=gap-analysis`, verify `Gap Analysis` is selected on load.
- Open `/app/i/skill-gaps`, verify redirect to `/app/i/expertise?tab=gap-analysis`.
- Click dashboard CTAs for skill gaps and verify they land on `/app/i/expertise?tab=gap-analysis`.

Open risks / TODO:

- First open of `Gap Analysis` now performs lazy fetch from `/api/skill-gaps/overview`; this may add initial latency for that tab.
- Consider adding focused route/component tests for the new redirect and tab-deep-link behavior.
