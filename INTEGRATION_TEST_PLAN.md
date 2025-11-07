# Integration Test Plan - Critical MVP Features

## Overview

This document provides test cases for the 5 critical features implemented per PRD requirements.

**Test Date**: TBD  
**Tester**: TBD  
**Environment**: Development/Staging

---

## Feature 1: Metrics Infrastructure & Dashboard

### PRD Acceptance Criteria (Part 2, Part 12)

- ✅ TTSC (North Star): Median ≤30 days for entry/mid roles
- ✅ TTFQI: Median ≤72 hours post-activation
- ✅ TTV: Median ≤7 days
- ✅ Well-Being Delta: ≥60% show ≥+1 improvement
- ✅ SUS: Average ≥75
- ✅ PAC Lift: Top-decile ≥20% higher intro acceptance

### Test Cases

#### TC1.1: Verify Analytics Event Emission

**Steps:**

1. Sign up as a new user
2. Add 10 L4 skills to trigger profile activation
3. Check database: `SELECT * FROM analytics_events WHERE user_id = [user_id] AND event_type = 'profile_activated'`
4. Accept a match (mutual interest)
5. Check database for `first_qualified_intro` event
6. Schedule an interview
7. Check database for `interview_scheduled` event

**Expected Result:**

- All events appear in `analytics_events` table with correct properties
- Timestamps are accurate
- Properties match the schema (e.g., `l4_count`, `stress_level`, etc.)

**Status**: ⬜ Pass | ⬜ Fail | ⬜ Not Run

---

#### TC1.2: Verify Admin Metrics Dashboard

**Steps:**

1. Log in as platform admin
2. Navigate to `/admin`
3. Verify metrics dashboard is visible
4. Check all 6 metrics display:
   - TTSC with target of 30 days
   - TTFQI with target of 72 hours
   - TTV with target of 7 days
   - Well-Being Delta with target of 60%
   - SUS with target of 75
   - PAC Lift with target of 20%

**Expected Result:**

- All metrics cards render without errors
- Each metric shows: current value, target, sample size
- Color coding: green if target met, amber if below
- Dashboard loads in < 2 seconds (per PRD Part 7)

**Status**: ⬜ Pass | ⬜ Fail | ⬜ Not Run

---

#### TC1.3: Verify Metric Calculations

**Steps:**

1. Create test data:
   - User A: activated on Day 0, first intro on Day 1 (24 hours)
   - User B: activated on Day 0, first intro on Day 4 (96 hours)
2. Call `/api/admin/metrics/overview`
3. Verify TTFQI median calculation: should be 60 hours (median of 24 and 96)

**Expected Result:**

- Median is calculated correctly
- P75 percentile is shown
- Sample size is accurate

**Status**: ⬜ Pass | ⬜ Fail | ⬜ Not Run

---

## Feature 2: SUS Survey Integration

### PRD Acceptance Criteria (Part 2, Part 7)

- ✅ Survey triggered post-activation, post-match, post-contract
- ✅ 10-question SUS format (standard)
- ✅ Score calculated correctly (0-100)
- ✅ Target: Average ≥75

### Test Cases

#### TC2.1: Post-Activation Survey Trigger

**Steps:**

1. Create new individual user
2. Complete profile activation (add 10 L4 skills)
3. Wait 2 seconds
4. Verify SUS survey modal appears

**Expected Result:**

- Survey appears automatically after activation
- Shows "Profile Activation" context
- Has all 10 standard SUS questions
- Can be dismissed or skipped

**Status**: ⬜ Pass | ⬜ Fail | ⬜ Not Run

---

#### TC2.2: Post-Match Survey Trigger

**Steps:**

1. Log in as activated user
2. Accept a match (mutual interest)
3. Wait 2 seconds
4. Verify SUS survey modal appears

**Expected Result:**

- Survey appears with "First Match Acceptance" context
- Survey does NOT appear again if already completed for this trigger

**Status**: ⬜ Pass | ⬜ Fail | ⬜ Not Run

---

#### TC2.3: Survey Score Calculation

**Steps:**

1. Complete SUS survey with known responses:
   - Q1: 5, Q2: 1, Q3: 5, Q4: 1, Q5: 5, Q6: 1, Q7: 5, Q8: 1, Q9: 5, Q10: 1
2. Submit survey
3. Check database: `SELECT properties FROM analytics_events WHERE event_type = 'sus_survey_completed'`
4. Verify score = 100

**Expected Result:**

- Score is calculated using standard SUS formula
- Score is between 0-100
- Event is recorded in analytics_events table

**Status**: ⬜ Pass | ⬜ Fail | ⬜ Not Run

---

## Feature 3: First-Run Guided Tour

### PRD Acceptance Criteria (Part 4: I-03, Part 12)

- ✅ 8-step tour for individual users
- ✅ Reveals UI progressively (navigation, profile, expertise, matching, zen, settings)
- ✅ Skippable at any time (ESC key)
- ✅ Can be replayed from settings
- ✅ Marks as complete in database

### Test Cases

#### TC3.1: Tour Auto-Start for New Users

**Steps:**

1. Create new individual user account
2. Complete onboarding
3. Land on home page
4. Wait 500ms

**Expected Result:**

- Tour starts automatically
- First step shows "Welcome to Proofound" message
- Modal is centered on screen
- Progress shows "Question 1 of 9"

**Status**: ⬜ Pass | ⬜ Fail | ⬜ Not Run

---

#### TC3.2: Tour Navigation

**Steps:**

1. Start tour
2. Click "Next" through all 8 steps
3. Verify each step highlights correct UI element:
   - Step 1: Welcome (center)
   - Step 2: Navigation sidebar
   - Step 3: Dashboard
   - Step 4: Profile link
   - Step 5: Expertise Hub link
   - Step 6: Matching Profile link
   - Step 7: Zen Hub link
   - Step 8: Settings link
   - Step 9: Completion message

**Expected Result:**

- Each step highlights the correct element with spotlight
- Progress indicator updates correctly
- "Next" button advances, "Back" button goes back
- Final step shows "Finish" button

**Status**: ⬜ Pass | ⬜ Fail | ⬜ Not Run

---

#### TC3.3: Tour Skip and Completion

**Steps:**

1. Start tour
2. Press ESC key on step 3
3. Verify tour closes
4. Check database: `SELECT tour_completed FROM profiles WHERE id = [user_id]`
5. Verify `tour_completed = true`

**Expected Result:**

- ESC key closes tour immediately
- `tour_completed` flag is set to true
- Event `tour_skipped` is recorded with step number
- Tour does not auto-start on next page load

**Status**: ⬜ Pass | ⬜ Fail | ⬜ Not Run

---

## Feature 4: Field-Level Visibility Controls

### PRD Acceptance Criteria (Part 5: F4, Part 8)

- ✅ 3 visibility levels: public, matched, private
- ✅ Controls for: mission, vision, values, causes, location, skills, etc.
- ✅ Preview shows how profile appears to orgs
- ✅ Redact mode for screen sharing
- ✅ Visibility enforced in matching APIs

### Test Cases

#### TC4.1: Set Field Visibility

**Steps:**

1. Log in as individual user
2. Go to Profile → Privacy Settings
3. Set "Mission" to "Public"
4. Set "Vision" to "Matched"
5. Set "Location" to "Private"
6. Click "Save Changes"

**Expected Result:**

- Settings save successfully
- Toast notification: "Privacy settings saved successfully"
- Database updated: `SELECT field_visibility FROM individual_profiles WHERE user_id = [user_id]`
- Field visibility JSON reflects changes

**Status**: ⬜ Pass | ⬜ Fail | ⬜ Not Run

---

#### TC4.2: Preview Visibility

**Steps:**

1. Go to Privacy Settings
2. Set some fields to "Public", some to "Matched", some to "Private"
3. Switch between "Before Match" and "After Match" preview tabs

**Expected Result:**

- "Before Match" tab shows only "Public" fields
- "After Match" tab shows "Public" + "Matched" fields
- "Private" fields never shown in any preview
- Clear visual distinction between visible and hidden fields

**Status**: ⬜ Pass | ⬜ Fail | ⬜ Not Run

---

#### TC4.3: Redact Mode

**Steps:**

1. Go to Privacy Settings → Advanced tab
2. Toggle "Redact Mode" ON
3. Navigate to different pages (profile, dashboard)
4. Verify sensitive info is redacted (e.g., location shows "City, ST", email shows "user@[REDACTED].com")

**Expected Result:**

- Redact mode toggle works
- Sensitive fields are replaced with placeholders
- Event `redact_mode_toggled` is recorded
- Toggling OFF restores normal view

**Status**: ⬜ Pass | ⬜ Fail | ⬜ Not Run

---

#### TC4.4: Visibility Enforcement in API

**Steps:**

1. User A sets Mission to "Matched", Vision to "Private"
2. User B (organization) views User A's profile (no match yet)
3. Call API: `/api/profiles/[userA_handle]` as User B
4. Verify response does NOT include Mission or Vision
5. Create mutual match between A and B
6. Call API again
7. Verify Mission is now included, but Vision is still excluded

**Expected Result:**

- API respects field visibility settings
- "Public" fields always visible
- "Matched" fields visible only after mutual interest
- "Private" fields never visible to orgs

**Status**: ⬜ Pass | ⬜ Fail | ⬜ Not Run

---

## Feature 5: Dashboard Customization

### PRD Acceptance Criteria (Part 5: F2, Part 12)

- ✅ Users can add/remove tiles
- ✅ Users can reorder tiles with drag-and-drop
- ✅ Layout persists across sessions
- ✅ Default layout provided for new users
- ✅ Dashboard loads < 2.0s P75

### Test Cases

#### TC5.1: Default Dashboard Layout

**Steps:**

1. Create new individual user
2. Navigate to home dashboard
3. Call API: `GET /api/dashboard/layout`

**Expected Result:**

- API returns default layout with widgets:
  - matches (position 0, visible)
  - applications (position 1, visible)
  - expertise-depth (position 2, visible)
  - next-action (position 3, visible)
  - zen-hub (position 4, hidden by default)
- Response includes `isDefault: true`

**Status**: ⬜ Pass | ⬜ Fail | ⬜ Not Run

---

#### TC5.2: Customize Dashboard - Drag and Drop

**Steps:**

1. Go to Dashboard
2. Click "Customize" button
3. Drag "Applications" widget above "Top Matches"
4. Click "Save Changes"
5. Refresh page

**Expected Result:**

- Drag-and-drop works smoothly
- Widget order updates visually during drag
- After save, layout persists
- After refresh, new order is maintained
- "Applications" is now position 0, "Top Matches" is position 1

**Status**: ⬜ Pass | ⬜ Fail | ⬜ Not Run

---

#### TC5.3: Add and Remove Widgets

**Steps:**

1. Click "Customize"
2. Hide "Expertise Depth" widget (toggle off)
3. Add "Recent Activity" widget from available widgets
4. Save changes
5. Refresh page

**Expected Result:**

- "Expertise Depth" no longer visible on dashboard
- "Recent Activity" appears in dashboard
- Changes persist after refresh
- Database updated correctly

**Status**: ⬜ Pass | ⬜ Fail | ⬜ Not Run

---

#### TC5.4: Dashboard Performance

**Steps:**

1. Open browser DevTools → Network tab
2. Navigate to home dashboard (with customized layout)
3. Measure page load time (DOMContentLoaded + API calls)

**Expected Result:**

- Dashboard loads in < 2.0 seconds (P75 target per PRD Part 7)
- API `/api/dashboard/layout` responds in < 500ms
- Widgets render progressively (no blocking)

**Status**: ⬜ Pass | ⬜ Fail | ⬜ Not Run

---

## Overall Feature Integration Test

### TC6.1: End-to-End User Journey

**Steps:**

1. Sign up as new user → Tour starts (Feature 3)
2. Complete tour
3. Add 10 L4 skills → Profile activation → SUS survey (Feature 2)
4. Complete SUS survey → Event recorded (Feature 1)
5. Customize dashboard → Add/reorder tiles (Feature 5)
6. Set privacy controls → Make mission "Matched only" (Feature 4)
7. Check admin dashboard → See metrics updating (Feature 1)

**Expected Result:**

- All features work together seamlessly
- No conflicts or errors
- Data flows correctly between features
- User experience is smooth and intuitive

**Status**: ⬜ Pass | ⬜ Fail | ⬜ Not Run

---

## Summary

### Test Results

- **Total Test Cases**: 19
- **Passed**: \_\_\_
- **Failed**: \_\_\_
- **Not Run**: \_\_\_

### Critical Issues Found

1. _[List any blocking issues]_

### Non-Critical Issues Found

1. _[List any minor issues]_

### Recommendations

1. _[Any recommendations for improvements]_

---

## Sign-Off

**Tested By**: ********\_********  
**Date**: ********\_********  
**Approved By**: ********\_********  
**Date**: ********\_********

---

## Notes

- All tests should be run in a clean test environment
- Test data should be created fresh for each test suite
- Database queries should be verified with actual SQL commands
- Performance tests should be run 3 times and averaged
- Browser: Chrome/Firefox/Safari (test on all three)
- Screen resolutions: Desktop (1920x1080), Tablet (768x1024), Mobile (375x667)
