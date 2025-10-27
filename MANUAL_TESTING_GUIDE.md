# 🧪 Manual Testing Guide

This guide provides step-by-step instructions for testing all major user flows in the Proofound platform.

## Prerequisites

- Local development server running (`npm run dev`)
- Supabase connection configured
- Email service configured for verification emails

## Test User Credentials

Create test users with pattern: `test-individual-1@example.com`, `test-org-1@example.com`, etc.
Password: Use a strong test password (min 8 characters)

---

## 1️⃣ Individual User Flow

### A. Signup & Email Verification

1. Navigate to `/signup`
2. Select "Individual" persona
3. Enter email and password
4. Click "Sign up"
5. **Expected**: Success message, email sent
6. Check email inbox for verification link
7. Click verification link
8. **Expected**: Redirect to onboarding

### B. Individual Onboarding

1. **Expected**: On `/onboarding` page
2. Fill out profile form:
   - Display Name: "Test Individual"
   - Username: "test-individual-1"
   - Headline: "Test headline"
   - Bio: "Test bio"
   - Location: "Test City"
3. Click "Complete Setup"
4. **Expected**: Redirect to `/app/i/home`

### C. Dashboard View

1. **Expected**: On individual dashboard
2. Verify cards display:
   - Goals Card
   - Tasks Card
   - Matching Results Card
   - Impact Snapshot Card
3. Navigate using left sidebar:
   - Home
   - Profile
   - Expertise
   - Zen Hub
   - Matching
   - Settings

### D. Profile Editing

1. Navigate to `/app/i/profile`
2. **Expected**: Editable profile view loads
3. Test editing basic info:
   - Click edit button
   - Change display name
   - Update tagline
   - Change location
   - Click save
   - **Expected**: Changes persist after page refresh
4. Test mission statement:
   - Add/edit mission
   - Click save
   - **Expected**: Persists after refresh
5. Test values:
   - Add new values
   - Remove values
   - Click save
   - **Expected**: Changes persist
6. Test causes:
   - Add causes
   - Remove causes
   - Click save
   - **Expected**: Changes persist
7. Test skills:
   - Add skills
   - Remove skills
   - Click save
   - **Expected**: Changes persist

### E. Matching Profile Setup

1. Navigate to `/app/i/matching`
2. **Expected**: Matching profile setup form
3. Fill out form:
   - Location: Country, City
   - Work mode: Remote/Onsite/Hybrid
   - Availability: Date range
   - Compensation: Min/Max, Currency
   - Skills: Add required skills with levels
   - Values: Select values
   - Causes: Select causes
4. Click "Save Preferences"
5. **Expected**: Redirect to matches view or setup complete message
6. Navigate away and back
7. **Expected**: Form shows saved data

---

## 2️⃣ Organization User Flow

### A. Signup & Email Verification

1. Navigate to `/signup`
2. Select "Organization" persona
3. Enter email and password
4. Click "Sign up"
5. **Expected**: Success message, email sent
6. Verify email (same as individual flow)

### B. Organization Onboarding

1. **Expected**: On `/onboarding` page
2. Fill out organization form:
   - Organization Name: "Test Organization"
   - Slug: "test-org-1"
   - Type: Select from dropdown
   - Legal Name: "Test Organization Inc."
   - Mission: "Test mission statement"
   - Website: "https://example.com"
3. Click "Create Organization"
4. **Expected**: Redirect to `/app/o/test-org-1/home`

### C. Organization Dashboard

1. **Expected**: On organization dashboard
2. Verify organization-specific cards display
3. Test navigation using left sidebar
4. Check team roles card shows you as Owner

### D. Organization Profile

1. Navigate to `/app/o/test-org-1/profile`
2. Edit organization details:
   - Update display name
   - Update mission
   - Update website
   - Click save
   - **Expected**: Changes persist

### E. Assignment Creation

1. Navigate to `/app/o/test-org-1/matching`
2. Click "Create Assignment"
3. Fill out assignment form:
   - Role: "Software Engineer"
   - Description: "Test description"
   - Required skills: Add skills
   - Location: Set location
   - Compensation: Set range
   - Start date: Set availability
4. Click "Create Assignment"
5. **Expected**: Assignment saves, shows in list
6. **Database Check**: Query `assignments` table to verify

---

## 3️⃣ Authentication Flows

### A. Login

1. Log out from current session
2. Navigate to `/login`
3. Enter test user email and password
4. Click "Sign in"
5. **Expected**: Redirect to appropriate home based on persona
   - Individual: `/app/i/home`
   - Org member: `/app/o/{slug}/home`

### B. Social Login (Google)

1. On `/login` page
2. Click "Continue with Google"
3. Complete Google OAuth flow
4. **Expected**: Redirect to onboarding (new user) or home (existing user)

### C. Password Reset

1. Navigate to `/reset-password`
2. Enter email address
3. Click "Send reset link"
4. **Expected**: Success message
5. Check email for reset link
6. Click link
7. Enter new password
8. **Expected**: Redirect to login

### D. Session Persistence

1. Log in as test user
2. Close browser tab
3. Reopen and navigate to `/app/i/home` (or org home)
4. **Expected**: Still logged in, no redirect to login

---

## 4️⃣ Settings Pages

### A. Individual Settings

1. Navigate to `/app/i/settings`
2. Verify displays:
   - Email address
   - Language selector
   - Notification preferences (if implemented)
3. Test language change:
   - Select different language
   - **Expected**: UI updates (if i18n implemented)

### B. Organization Settings

1. Navigate to `/app/o/{slug}/settings`
2. Verify displays:
   - Organization details
   - Audit log (if implemented)
   - Member management (if implemented)
3. Only owners/admins should see certain sections
4. **Expected**: Proper permission enforcement

---

## 5️⃣ Database Verification

After completing each flow, verify data in database using Supabase dashboard or SQL queries:

### After Individual Onboarding:

```sql
SELECT p.*, ip.*
FROM profiles p
LEFT JOIN individual_profiles ip ON p.id = ip.user_id
WHERE p.handle = 'test-individual-1';
```

**Expected**: Both records exist, handle and display_name set, persona='individual'

### After Organization Onboarding:

```sql
SELECT o.*, om.*
FROM organizations o
LEFT JOIN organization_members om ON o.id = om.org_id
WHERE o.slug = 'test-org-1';
```

**Expected**: Organization exists, membership exists with role='owner'

### After Matching Profile Setup:

```sql
SELECT mp.*, array_agg(s.skill_id) as skills
FROM matching_profiles mp
LEFT JOIN skills s ON mp.profile_id = s.profile_id
WHERE mp.profile_id = '<user_id>'
GROUP BY mp.profile_id;
```

**Expected**: Matching profile exists with all fields populated

### After Assignment Creation:

```sql
SELECT a.*
FROM assignments a
WHERE a.org_id = '<org_id>'
ORDER BY a.created_at DESC
LIMIT 5;
```

**Expected**: Assignment exists with all fields populated

---

## 6️⃣ Error Scenarios

Test error handling:

### A. Duplicate Data

1. Try to create user with existing email
2. **Expected**: Clear error message
3. Try to use existing username/handle
4. **Expected**: Clear error message
5. Try to create org with existing slug
6. **Expected**: Clear error message

### B. Invalid Data

1. Submit forms with invalid data:
   - Too short password
   - Invalid email format
   - Invalid handle format (special chars)
   - Missing required fields
2. **Expected**: Clear validation errors

### C. Permission Errors

1. Try to access another org's pages
2. **Expected**: Permission denied or redirect
3. Try to edit another user's profile
4. **Expected**: Permission denied

---

## 7️⃣ UI/UX Verification

### A. Visual Consistency

- [ ] All pages use Figma color palette (Proofound Forest, Terracotta, etc.)
- [ ] Headings use Crimson Pro font
- [ ] Body text uses Inter font
- [ ] Cards have consistent rounded-2xl corners
- [ ] Buttons have consistent styling
- [ ] Dark mode works across all pages

### B. Loading States

- [ ] Skeleton loaders show while fetching data
- [ ] Buttons show loading spinners when submitting
- [ ] No flash of unstyled content

### C. Empty States

- [ ] Dashboard cards show helpful messages when no data
- [ ] Empty lists have "Get Started" buttons
- [ ] Clear CTAs guide users to next action

### D. Responsive Design

- [ ] Test on mobile (375px width)
- [ ] Test on tablet (768px width)
- [ ] Test on desktop (1440px width)
- [ ] Left nav collapses on mobile
- [ ] Cards stack properly on small screens

---

## 8️⃣ Performance Checks

### A. Page Load Times

- [ ] Home pages load in < 1 second
- [ ] Profile pages load in < 2 seconds
- [ ] No unnecessary re-renders
- [ ] Images lazy load

### B. Database Queries

- [ ] Check browser DevTools Network tab
- [ ] Verify no N+1 queries
- [ ] API responses < 500ms

---

## ✅ Success Criteria

All flows pass when:

1. Users can complete signup and onboarding
2. Data persists correctly in database
3. All CRUD operations work
4. RLS policies enforce proper permissions
5. UI is consistent with Figma design
6. No console errors during normal usage
7. Loading and error states display correctly
8. Responsive design works on all screen sizes

---

## 🐛 Reporting Issues

If you find issues during testing:

1. **Note the exact steps to reproduce**
2. **Check browser console for errors**
3. **Check network tab for failed requests**
4. **Query database to verify data state**
5. **Screenshot the issue**
6. **Document expected vs actual behavior**

Common issues to watch for:

- RLS policy errors (403 or permission denied)
- Missing data in database after form submission
- Broken redirects after form completion
- Styling inconsistencies
- Missing loading or error states
