## Deployment Failure Debrief (October 29, 2025)

### Summary of repeated blockers

1. **ESLint: `react/no-unescaped-entities`**  
   - Triggered by apostrophes and quotes in the empty profile components.  
   - **Fix:** Escaped all literals with `&apos;` / `&quot;` inside `EmptyProfileStateView.tsx` and `EmptyOrganizationProfileView.tsx`.

2. **TypeScript: missing organization fields**  
   - `OrganizationRow` did not include the newly added Supabase columns, so `tagline`, `vision`, etc. were missing at build time.  
   - **Fix:** Expanded the selects and mapper in `src/lib/auth.ts` to include every schema field.

3. **Drizzle schema typing drift**  
   - Foreign keys were created via raw `sql
projects(id)` casts, which TypeScript rejected.  
   - **Fix:** Reordered the table definitions so that `projects` is declared before the profile sub‑tables and replaced casts with native `references(() => projects.id)` calls.  
   - For the self-referencing `assignment_outcomes.depends_on` field we now define the FK via the table callback + `foreignKey` helper.

4. **Custom Postgres types**  
   - The local helpers for `bit`/`vector` were passing extra generics, conflicting with the Drizzle signature.  
   - **Fix:** Simplified the helpers to accept an optional config object and extracted the `dimensions` value manually.

5. **Tooling friction**  
   - Lint/typecheck scripts silently failed when dependencies were missing.  
   - **Fix:** Run `npm install` locally before executing `npm run lint` / `npm run typecheck` (both commands now succeed).

### Remaining warning

- Vercel still surfaces an informational warning about `@supabase/supabase-js` using Node APIs in the Edge runtime. This is expected. If the warning becomes blocking, switch affected routes to the Node.js runtime (`export const runtime = 'nodejs'`).

### Recommended checklist before pushing schema/UI changes

1. `npm install`
2. `npm run lint`
3. `npm run typecheck`
4. Trigger a Vercel preview build

Keeping the schema definition ordered (parent tables declared before children) prevents the Drizzle reference regressions we observed in this iteration.

