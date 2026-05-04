> Doc Class: `historical`
> Last Verified: `2026-05-04`

# Archived Manual Testing Guide: CV Import Feature

> Launch status: archived/non-launch. The CV import wizard is not an active MVP feature and is explicitly excluded from the controlled assistive AI / Document AI OCR rollout. Do not use this guide as MVP launch smoke evidence unless a future approved route-surface change reactivates CV import.

## 🎯 Purpose

This guide helps you verify that the CV import feature is working correctly after the bug fixes.

## ✅ Pre-Testing Checklist

Before you start testing, ensure:

- [ ] Your local development server is running (`npm run dev`)
- [ ] You're logged in as a test user
- [ ] Your database has skills in the taxonomy (check with the query below)
- [ ] Browser dev tools are open (Console + Network tabs)

**Check Taxonomy**:

```sql
SELECT COUNT(*) FROM skills_taxonomy WHERE status = 'active';
```

Should return > 0 skills.

---

## 🧪 Test Scenarios

### Test 1: Basic CV Import Flow ✅

**Goal**: Verify complete import workflow from CV text to saved skills.

**Steps**:

1. Navigate to `/app/i/expertise`
2. Click the **"Import from CV"** tab (or similar button)
3. Paste this sample CV:

   ```
   Senior Software Engineer

   SKILLS:
   • JavaScript, TypeScript, React, Node.js
   • Python, Django, Flask
   • PostgreSQL, MongoDB
   • AWS, Docker, Kubernetes
   • Git, CI/CD, Agile

   Built scalable web applications serving 1M+ users.
   Led team of 5 engineers. 8+ years experience.
   ```

4. Click **"Analyze & Suggest Skills"**
5. Wait for suggestions to appear (should take 1-3 seconds)
6. Select 3-5 skills by clicking on them
7. Click **"Add X Selected"** button
8. Wait for success message

**Expected Results**:

- ✅ Suggestions appear with skill names and confidence scores
- ✅ Clicking skills toggles selection (border changes color)
- ✅ "Add X Selected" button shows correct count
- ✅ Success toast shows "Successfully added X skill(s)!"
- ✅ Page refreshes or navigates to Skills Atlas
- ✅ Skills appear in your Expertise Atlas

**Check Console**:

- No JavaScript errors
- Network request to `/api/expertise/auto-suggest` returns 200
- Network requests to `/api/expertise/user-skills` return 201

---

### Test 2: No Skills Found

**Goal**: Verify graceful handling when no skills are detected.

**Steps**:

1. Go to Import from CV tab
2. Paste: `The quick brown fox jumps over the lazy dog.`
3. Click **"Analyze & Suggest Skills"**

**Expected Results**:

- ✅ Info toast: "No skills found. Try pasting more detailed text."
- ✅ No suggestions appear
- ✅ No errors in console

---

### Test 3: Duplicate Skill Handling

**Goal**: Verify system handles duplicate skills gracefully.

**Steps**:

1. Import a skill (follow Test 1)
2. Note which skill you added (e.g., "JavaScript")
3. Import the SAME skill again:
   - Paste CV with "JavaScript"
   - Analyze
   - Select JavaScript again
   - Click Add Selected

**Expected Results**:

- ✅ First import: Success message
- ✅ Second import: Success message (counts as success, skill already exists)
- ✅ NO duplicate skills in database (verify in Expertise Atlas)
- ✅ Console shows skill already exists (but doesn't show error to user)

**Verify in Database**:

```sql
SELECT skill_code, COUNT(*)
FROM skills
WHERE profile_id = 'your-user-id'
GROUP BY skill_code
HAVING COUNT(*) > 1;
```

Should return 0 rows (no duplicates).

---

### Test 4: Multiple Skills Import

**Goal**: Verify batch import of multiple skills.

**Steps**:

1. Go to Import from CV tab
2. Paste CV with many skills:
   ```
   Full-stack developer with expertise in:
   - Frontend: React, Vue.js, HTML5, CSS3, Tailwind
   - Backend: Node.js, Python, Java, Go
   - Database: PostgreSQL, MySQL, MongoDB, Redis
   - Cloud: AWS, Azure, Docker
   ```
3. Analyze
4. Select 10+ skills
5. Click Add Selected

**Expected Results**:

- ✅ Loading state shown ("Adding...")
- ✅ Success message: "Successfully added 10 skills!"
- ✅ All selected skills appear in Expertise Atlas
- ✅ Default values applied to all:
  - Level: 2 (Competent)
  - Experience: 0 months
  - Last Used: Today
  - Relevance: Current

---

### Test 5: Context Switching

**Goal**: Verify CV/JD/General context buttons work.

**Steps**:

1. Go to Import from CV tab
2. Click **"CV/Resume"** button → verify it's selected (different color)
3. Click **"Job Description"** button → verify it's selected
4. Click **"General Text"** button → verify it's selected
5. Paste text and analyze with each context

**Expected Results**:

- ✅ Only one button selected at a time
- ✅ Context is sent to API (check Network tab)
- ✅ Different contexts may return slightly different suggestions

---

### Test 6: Loading States

**Goal**: Verify UI shows proper loading feedback.

**Steps**:

1. Go to Import from CV tab
2. Paste long CV (2000+ characters)
3. Click Analyze and IMMEDIATELY watch the button

**Expected Results**:

- ✅ Button text changes to "Analyzing..."
- ✅ Button is disabled during analysis
- ✅ After suggestions appear, button returns to "Analyze & Suggest Skills"

**Repeat for Add Selected**:

1. Select skills
2. Click Add Selected
3. Watch the button

**Expected Results**:

- ✅ Button text changes to "Adding..."
- ✅ Button is disabled while saving
- ✅ After save completes, suggestions clear

---

### Test 7: Error Handling

**Goal**: Verify graceful error handling.

**Test 7A: Empty Text**

1. Go to Import from CV tab
2. Leave textarea empty
3. Try to click Analyze

**Expected**: Button should be disabled.

**Test 7B: Network Error (Simulate)**

1. Open Dev Tools → Network tab
2. Set throttling to "Offline"
3. Paste CV and click Analyze

**Expected**:

- ✅ Error toast: "Failed to analyze text"
- ✅ No crash, UI remains functional

**Test 7C: Invalid Auth (Simulate)**

1. Clear your auth cookies
2. Try to import

**Expected**:

- ✅ Redirected to login
- OR Error message about authentication

---

### Test 8: UI/UX Verification

**Goal**: Verify proper UI rendering.

**Steps**:

1. Import CV and get suggestions
2. Inspect each suggestion card

**Expected Results**:

- ✅ Skill name is displayed clearly
- ✅ Confidence badge shows percentage (e.g., "85%")
- ✅ Alternative names shown if available ("Also known as: JS, ECMAScript")
- ✅ Description shown if available
- ✅ Cards are clickable and keyboard accessible
- ✅ Selection state is visually clear (border/background change)
- ✅ Plus/X icon toggles based on selection

---

### Test 9: Data Persistence

**Goal**: Verify skills are actually saved to database.

**Steps**:

1. Import and add 3 skills
2. Note their names
3. Navigate away from Expertise page
4. Come back to Expertise page
5. Check Skills Atlas tab

**Expected Results**:

- ✅ All 3 skills still appear
- ✅ Skills have correct default values
- ✅ Can edit/delete the skills

**Verify in Database**:

```sql
SELECT s.*, st.name_i18n
FROM skills s
LEFT JOIN skills_taxonomy st ON s.skill_code = st.code
WHERE s.profile_id = 'your-user-id'
ORDER BY s.created_at DESC
LIMIT 5;
```

Should show your recently imported skills with:

- `skill_code` matching taxonomy
- `level = 2`
- `months_experience = 0`
- `relevance = 'current'`
- `last_used_at` = today's date

---

## 🐛 Debugging Failed Tests

### If Suggestions Don't Appear

**Check**:

1. Console for errors
2. Network tab: `/api/expertise/auto-suggest` response
3. Response should have `suggestions` array

**Common Issues**:

- Empty taxonomy: Run seed script to add skills
- Auth error: Token expired, log in again
- API error: Check server logs

### If Skills Don't Save

**Check**:

1. Console for errors
2. Network tab: `/api/expertise/user-skills` requests
3. Should see 201 responses for each skill

**Common Issues**:

- Database connection: Check DB is running
- RLS policies: User might not have permission
- Invalid skill_code: Skill doesn't exist in taxonomy

### If Page Doesn't Refresh

**Check**:

1. `onSkillsAdded` callback is called
2. Should trigger `window.location.reload()` in parent component
3. Check ExpertiseAtlasClient.tsx line ~269

---

## 📊 Success Criteria

Mark each as complete:

- [ ] Test 1: Basic flow works end-to-end
- [ ] Test 2: No skills found handled gracefully
- [ ] Test 3: Duplicates prevented
- [ ] Test 4: Multiple skills imported successfully
- [ ] Test 5: Context switching works
- [ ] Test 6: Loading states shown correctly
- [ ] Test 7: Errors handled gracefully
- [ ] Test 8: UI renders correctly
- [ ] Test 9: Data persists in database

**All tests passing?** ✅ Feature is ready!

---

## 🎉 Post-Testing

If all tests pass:

1. ✅ Mark the verify-fix todo as complete
2. ✅ Consider running automated tests: `npm run test:integration -- cv-import`
3. ✅ Deploy to staging for QA team testing
4. ✅ Update issue tracker or project board

If tests fail:

1. Document which tests failed
2. Check the troubleshooting section
3. Review code changes in:
   - `/src/app/api/expertise/auto-suggest/route.ts`
   - `/src/components/expertise/CVJDAutoSuggest.tsx`
4. Check console logs and network requests
5. Ask for help if stuck!

---

**Happy Testing!** 🚀

If you encounter any issues not covered here, please update this guide or reach out to the team.
