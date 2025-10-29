# 🧪 Manual Testing Guide

This living guide walks you through every Proofound flow so you can confirm the redesigned experience still works end to end.

## Prerequisites & Environment

- 🪄 DO THIS MANUALLY: In your terminal run `npm install` (first time) and `npm run dev` (every session). The development server must stay on during testing.
- Supabase project configured with the latest migrations and policies from `src/db/*`.
- Resend (or another email provider) set up so verification and reset links arrive.
- Browser with private/incognito mode for clean sessions (Chrome preferred).

## Test Accounts & Naming

- Use repeatable emails like `test-individual-1@example.com`, `test-org-owner@example.com`, `test-org-invitee@example.com`.
- Passwords must be at least 8 characters; store them in your secure notes so you can reuse accounts.
- Keep a persona cheat-sheet while testing:
  - `individual` → lands in `/app/i/*` routes.
  - `org_member` → lands in `/app/o/<slug>/*` routes.

---

## 1️⃣ Individual Journey (Primary Persona)

### A. Multi-Step Signup & Email Verification

1. Visit `/signup` and choose the **Individual** card.
2. Complete the email + password form (three-step flow, matching the sage theme).
3. Submit and verify you see the “Check your email” success state.
4. 🪄 DO THIS MANUALLY: Open the inbox for the test email, click the Supabase verification link. If email routing is disabled locally, confirm the user in Supabase Auth and trigger verification manually.
5. Expected ✅: After clicking the link, the browser redirects to `/onboarding`.

### B. Individual Onboarding Flow

1. Confirm the persona selector shows **Individual** pre-selected.
2. Complete the profile form:
   - Display name, handle, headline, location, values, causes.
3. Submit the form.
4. Expected ✅: Automatic redirect to `/app/i/home` with a welcome toast (if enabled).

### C. Dashboard & Navigation

1. Check `LeftNav` items match Figma order: Dashboard, Profile, Matching, Expertise, Zen Hub, Settings.
2. Collapse the nav to verify tooltips, then expand again.
3. Confirm TopBar renders the square logo, separator, search, customize button, avatar.
4. Ensure the dashboard grid shows these empty-state cards: Goals, Tasks, Projects, Matching Results (2 columns), Impact Snapshot, Explore (full width).
5. Open **Customize** → toggle a widget → close → refresh. Expected ✅: Hidden cards stay hidden.

### D. Profile Management (`/app/i/profile`)

1. Edit “About” fields (display name, tagline, location) and save.
2. Add content to each tab:
   - Impact story
   - Journey (work experience or education)
   - Service (volunteering)
3. Refresh to confirm data persists and empty states disappear when at least one record exists.
4. Check values & causes chips: add, remove, re-add.
5. Expected ✅: No console errors; toasts or inline validation appear for invalid inputs.

### E. Matching Setup & Results (`/app/i/matching`)

1. With a fresh account, confirm the **IndividualMatchingEmpty** screen shows and `Start matching` opens the setup wizard.
2. Complete every step: location, work mode, availability, compensation, languages, values/causes, skills with levels.
3. Submit and expect a success confirmation plus redirect back to `/app/i/matching`.
4. Reload the page: saved data should pre-fill.
5. Trigger “Mark interested” on a match; confirm the toast and see the request appear in the network tab.
6. Hide a match and ensure it disappears from the list.

### F. Expertise Atlas (`/app/i/expertise`)

1. Ensure the page loads with parchment background and gradient header.
2. Toggle persona between **Individual** and **Organization**; verify copy swaps accordingly.
3. Check the “Capability signals” cards and progress bars render.
4. Click “Export proof map” to confirm the button triggers a request (or placeholder toast if not yet wired).

### G. Zen Hub (`/app/i/zen`)

1. Confirm the theme toggle flips between light and dark without affecting the rest of the site.
2. Change the risk pill and ensure the guidance copy updates.
3. Switch device view (Desktop/Mobile) and confirm the button states.
4. Select several quick practices and verify the detailed card updates instantly.

### H. Settings, Session Persistence & Sign-Out (`/app/i/settings`)

1. Check account email, language selector, notification placeholders.
2. Change language (e.g., Svenska) and ensure UI strings update where translations exist.
3. Close the tab, reopen `/app/i/home` and confirm you remain logged in.
4. Use the avatar menu → Sign out. Expected ✅: Redirect to `/login`.

---

## 2️⃣ Organization Journey (Owner Persona)

### A. Multi-Step Signup & Verification

1. Repeat the signup flow choosing the **Organization** card.
2. Confirm terracotta theme styling and role-specific copy.
3. After verification, expect redirect to `/onboarding` with the organization path selected.

### B. Organization Onboarding

1. Fill in the form: organization name, slug, type, legal name, mission, website.
2. Submit and capture any validation errors (e.g., duplicate slug).
3. Expected ✅: Redirect to `/app/o/<slug>/home` and membership role set to **Owner**.

### C. Organization Dashboard & Navigation

1. Verify the dashboard mirrors the individual layout except the third row card is **Team** instead of Impact.
2. Check nav order: Dashboard, Profile, Projects, Matching, Members, Opportunities, Settings.
3. Toggle Customize → hide a widget → refresh. Preferences should stick per organization.

### D. Org Profile editing (`/app/o/<slug>/profile`)

1. Update mission, website, and highlight fields.
2. Upload/change logo if file storage is configured.
3. Expected ✅: Data persists; non-owners see fields as read-only.

### E. Team Management & Invitations (`/app/o/<slug>/members`)

1. As owner/admin, invite a new member with role **Member**.
2. 🪄 DO THIS MANUALLY: In Supabase → `org_invitations`, copy the invite token.
3. Open a fresh browser profile, log in as the invitee, and visit `/app/o/<slug>/invitations/<token>`.
4. Accept the invitation; expected redirect to `/app/o/<slug>/home` with role badge displayed.
5. Back as the owner, remove the member using the inline action and confirm they disappear.

### F. Assignment Builder & Matching (`/app/o/<slug>/matching`)

1. With zero assignments, confirm the **OrganizationMatchingEmpty** screen.
2. Start the builder, complete each step (role, scope, requirements, compensation, values, timeline).
3. Submit and expect a success toast plus new card in the assignments list.
4. Open an assignment and ensure candidate matches load.
5. Toggle “Create new assignment” to re-open the builder.

### G. Organization Settings (`/app/o/<slug>/settings`)

1. Confirm audit logs, billing placeholders, and feature flag toggles (if surfaced) load without error.
2. Validate permissions: viewers should be blocked from settings.

---

## 3️⃣ Shared Authentication & Account Maintenance

### A. Email/Password Login

1. Log out, go to `/login`, and sign in with each persona account.
2. Expected ✅: Individuals route to `/app/i/home`, org members to `/app/o/<slug>/home`, admins to `/admin` (if flagged).

### B. Google OAuth

1. From `/login`, click **Continue with Google**.
2. Complete the OAuth consent.
3. Expected ✅: New Google users land in onboarding; returning users go straight to their saved home.

### C. Password Reset Flow

1. Use `/reset-password` to request a link.
2. 🪄 DO THIS MANUALLY: Fetch the reset email and open the link.
3. Set a new password; confirm redirect to `/login` and that you can sign in with the new credential.

### D. Session Hardening

1. Log in, clear cookies manually, reload to confirm redirect to `/login`.
2. Repeat on a different browser to ensure Supabase session revocation works as expected.

---

## 4️⃣ UI & Visual QA (Figma Alignment)

- [ ] TopBar: square logo, separator, search, customize button, avatar with forest palette.
- [ ] LeftNav: matches icon order, hover background `rgba(232, 230, 221, 0.5)`, active background `#1C4D3A`.
- [ ] Dashboard cards: border `rgba(232, 230, 221, 0.6)`, buttons sized `h-7 text-xs`, hover color `#2D5F4A`.
- [ ] Parchment background `#F7F6F1` across `/app/i/*` and `/app/o/*` layouts.
- [ ] Dark mode: toggle via Zen Hub and confirm other pages still look correct when `class="dark"` is on `<html>`.
- [ ] Animations: framer-motion transitions feel smooth (no jump cuts).

### Loading & Empty States

- [ ] Skeletons or “Loading…” placeholders show during fetches on matching and assignments.
- [ ] Empty states include contextual CTAs (“Start exploring”, “Create assignment”).
- [ ] Error toasts appear if API calls fail (simulate network offline in DevTools).

### Responsive Checks

- [ ] 375px mobile: LeftNav collapses behind the menu button, cards stack vertically.
- [ ] 768px tablet: Two-column grids shrink gracefully, typography remains legible.
- [ ] 1440px desktop: Cards align to the 3-column grid, no unexpected whitespace.

---

## 5️⃣ Performance & Observability

- [ ] Home pages load < 1s on warm reload; note any slow cards.
- [ ] Profile and matching pages load < 2s; watch for slow SQL in Supabase logs.
- [ ] Network tab: verify no 4xx/5xx responses, check for unnecessary repeated calls.
- [ ] Console: ensure zero warnings/errors in happy paths.
- [ ] Monitor `matches` and `assignments` API latency (goal < 500ms).

---

## 6️⃣ Database Verification Queries

Run these in the Supabase SQL editor (replace placeholders as needed):

### Individual Profile Completion

```sql
SELECT p.id,
       p.handle,
       p.persona,
       ip.headline,
       ip.values,
       ip.causes
FROM profiles p
LEFT JOIN individual_profiles ip ON ip.user_id = p.id
WHERE p.handle = 'test-individual-1';
```

Expected ✅: Persona = `individual`, values/causes populated after onboarding.

### Matching Preferences & Skills

```sql
SELECT mp.profile_id,
       mp.city,
       mp.work_mode,
       mp.comp_min,
       json_agg(json_build_object('skill', s.skill_id, 'level', s.level)) AS skills
FROM matching_profiles mp
LEFT JOIN skills s ON s.profile_id = mp.profile_id
WHERE mp.profile_id = '<profile_id>'
GROUP BY mp.profile_id;
```

Expected ✅: Preferences saved; skill list matches wizard input.

### Organization Creation & Membership

```sql
SELECT o.id,
       o.slug,
       o.display_name,
       om.user_id,
       om.role
FROM organizations o
LEFT JOIN organization_members om ON om.org_id = o.id
WHERE o.slug = 'test-org-1';
```

Expected ✅: At least one membership with role `owner`.

### Assignments and Match Cache

```sql
SELECT a.id,
       a.role,
       a.status,
       a.must_have_skills,
       COUNT(m.id) AS match_count
FROM assignments a
LEFT JOIN matches m ON m.assignment_id = a.id
WHERE a.org_id = '<org_id>'
GROUP BY a.id;
```

Expected ✅: New assignment shows `status = 'draft'` or `active`, and match_count reflects generated matches.

### Invitation Lifecycle

```sql
SELECT token,
       email,
       role,
       expires_at,
       accepted_at
FROM org_invitations
WHERE email = 'test-org-invitee@example.com'
ORDER BY created_at DESC
LIMIT 1;
```

Expected ✅: `accepted_at` (or membership row) is populated after accepting.

---

## 7️⃣ Error & Edge-Case Scenarios

- Duplicate email/handle/slug should show inline validation instantly.
- Submit onboarding with missing required fields → expect helpful errors.
- Attempt to access `/app/o/other-org/home` as a non-member → expect redirect or 403 page.
- Trigger rate limiting by rapid login attempts (observe graceful error rather than crash).
- Disable network mid-submit to confirm retry or error toast behavior.

---

## 8️⃣ Reporting Issues

Whenever you spot a bug:

1. Capture the exact reproduction steps.
2. Grab console errors (copy the stack) and failed network payloads.
3. Run the relevant SQL query above to record database state before/after.
4. Take screenshots or short Looms (especially for visual mismatches).
5. File an issue with expected vs actual behavior plus environment details.

✅ When every checklist above passes (or issues are logged with owners), the release candidate is ready for manual sign-off!
