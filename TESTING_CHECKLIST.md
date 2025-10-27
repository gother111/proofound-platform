# Proofound MVP - Testing Checklist

## Priority 1: Core Authentication & Profile

### ✅ Individual Sign-Up Flow

**URL:** http://localhost:3000/signup

**Steps:**
1. Click on "Individual" card
2. **Email Step:**
   - Enter valid email: test+individual@example.com
   - Click "Continue"
   - ✅ Should proceed to password step
3. **Password Step:**
   - Enter password (min 8 chars): `TestPass123!`
   - Confirm password: `TestPass123!`
   - Click "Create account"
   - ✅ Should show loading state
   - ✅ Should proceed to verification step
4. **Verification Step:**
   - ✅ Should display message: "We've sent a verification link to [email]"
   - ✅ Check email inbox for Supabase verification email
   - Click verification link in email
   - ✅ Should redirect to `/auth/callback` (brief)
   - ✅ Should then redirect to `/home`
   - ✅ Should NOT show 404 error
5. **Profile Creation:**
   - ✅ Profile should be created automatically in database
   - ✅ Check Supabase Table Editor > profiles table
   - ✅ Verify fields: id, email, account_type='individual', profile_completion_percentage

**Expected Result:**
- User successfully signed up
- Email verified
- Profile created in database
- Redirected to dashboard at `/home`
- No console errors (except non-breaking tagline warning)

---

### ✅ Organization Sign-Up Flow

**URL:** http://localhost:3000/signup

**Steps:**
1. Click on "Organization" card
2. **Details Step:**
   - Company name: "Test Org"
   - Legal name: "Test Organization Ltd."
   - Organization type: "Non-profit / Social Good"
   - Click "Continue"
   - ✅ Should proceed to auth step
3. **Auth Step:**
   - Admin email: test+org@example.com
   - Password (min 8 chars): `TestPass123!`
   - Confirm password: `TestPass123!`
   - Click "Create organization"
   - ✅ Should show loading state
   - ✅ Should proceed to verification step
4. **Verification Step:**
   - ✅ Should display message: "We've sent a verification link to [email]"
   - ✅ Check email inbox for Supabase verification email
   - Click verification link in email
   - ✅ Should redirect to `/auth/callback` (brief)
   - ✅ Should then redirect to `/home`
   - ✅ Should NOT show 404 error
5. **Profile & Organization Creation:**
   - ✅ Profile should be created in database
   - ✅ Check Supabase: profiles table (account_type='organization')
   - ✅ Check Supabase: organizations table (if applicable)
   - ✅ User metadata should contain company_name, legal_name, organization_type

**Expected Result:**
- Organization successfully signed up
- Email verified
- Profile created with account_type='organization'
- Organization data stored in user_metadata or organizations table
- Redirected to dashboard at `/home`
- No console errors

---

### ✅ Login Flow

**URL:** http://localhost:3000/login

**Test 1: Individual Login**
1. Use credentials from individual sign-up: test+individual@example.com
2. Enter password
3. Click "Sign in"
4. ✅ Should show loading state
5. ✅ Should redirect to `/home`
6. ✅ Dashboard should show individual-specific features
7. ✅ No account type toggle should appear on login page

**Test 2: Organization Login**
1. Use credentials from organization sign-up: test+org@example.com
2. Enter password
3. Click "Sign in"
4. ✅ Should show loading state
5. ✅ Should redirect to `/home`
6. ✅ Dashboard should show organization-specific features
7. ✅ Navigation/UI should reflect organization account

**Test 3: OAuth Login (Google)**
1. Click "Google" button
2. ✅ Should redirect to Google OAuth
3. Complete Google authentication
4. ✅ Should redirect back to app via `/auth/callback`
5. ✅ Profile should be auto-created
6. ✅ Should redirect to `/home`

**Test 4: OAuth Login (GitHub)**
1. Click "GitHub" button
2. ✅ Should redirect to GitHub OAuth
3. Complete GitHub authentication
4. ✅ Should redirect back to app via `/auth/callback`
5. ✅ Profile should be auto-created
6. ✅ Should redirect to `/home`

**Test 5: Remember Me**
1. Check "Remember me" checkbox
2. Sign in
3. Close browser
4. Reopen browser and navigate to app
5. ✅ Should still be logged in

**Test 6: Forgot Password**
1. Click "Forgot password?"
2. ✅ Should redirect to `/forgot-password`
3. Enter email
4. ✅ Should send password reset email
5. Click reset link in email
6. ✅ Should allow password reset

**Expected Result:**
- Universal login works for both account types
- System automatically routes based on profile.account_type
- No account type selection on login page
- OAuth providers work correctly
- Password reset flow functional

---

### ✅ Profile Creation & Editing

**URL:** http://localhost:3000/profile (or /settings)

**Test 1: View Profile**
1. Navigate to profile page
2. ✅ Profile should display with current data
3. ✅ Should show: full_name, email, avatar, bio, etc.
4. ✅ Profile completion percentage should display

**Test 2: Edit Individual Profile**
1. Click "Edit" or edit mode
2. Update fields:
   - Full name
   - Bio
   - Location
   - Website
   - Social links
3. Click "Save"
4. ✅ Should show success message
5. ✅ Changes should persist in database
6. ✅ Profile completion % should update

**Test 3: Edit Organization Profile**
1. Login as organization
2. Navigate to profile/organization settings
3. Update fields:
   - Company name
   - Description
   - Website
   - Logo
   - Team members
4. Click "Save"
5. ✅ Should show success message
6. ✅ Changes should persist
7. ✅ Organization page should reflect changes

**Test 4: Upload Avatar**
1. Click on avatar/photo section
2. Select image file
3. ✅ Should upload to Supabase Storage
4. ✅ Avatar should update in UI
5. ✅ avatar_url should update in database

**Expected Result:**
- Profile edits save successfully
- All fields validate correctly
- File uploads work
- Changes reflect immediately in UI
- Database updates confirmed

---

### ✅ Dashboard (Persona-Aware)

**URL:** http://localhost:3000/home

**Test 1: Individual Dashboard**
1. Login as individual user
2. ✅ Should display:
   - Welcome message with name
   - Profile completion card
   - Suggested matches
   - Recent notifications
   - Quick actions (add proof, view matches)
3. ✅ Navigation should show individual-specific items:
   - My Profile
   - Matches
   - Messages
   - Expertise Atlas
   - Zen Hub
   - Settings

**Test 2: Organization Dashboard**
1. Login as organization user
2. ✅ Should display:
   - Organization name/welcome
   - Active assignments
   - Applicants/matches for assignments
   - Recent notifications
   - Quick actions (post assignment, review applicants)
3. ✅ Navigation should show organization-specific items:
   - Organization
   - Assignments
   - Matches
   - Messages
   - Settings
4. ✅ Should NOT show individual-only features (Expertise Atlas, Zen Hub)

**Test 3: Dashboard Data**
1. Check that dashboard loads real data from database
2. ✅ Matches should display correctly
3. ✅ Assignments should display (org only)
4. ✅ Notifications should be relevant
5. ✅ No loading errors in console

**Expected Result:**
- Dashboard renders correctly for both account types
- UI adapts based on account_type from profile
- Real data loads from Supabase
- Navigation reflects user type
- No hardcoded/mock data issues

---

## Priority 1: Matching & Messaging

### ✅ Matching System

**URL:** http://localhost:3000/matches

**Test 1: View Matches (Individual)**
1. Login as individual
2. Navigate to Matches
3. ✅ Should display list of suggested assignments
4. ✅ Each match should show:
   - Assignment title
   - Organization name
   - Match score %
   - Key highlights
5. ✅ Click on a match to view details

**Test 2: Match Details**
1. Click on a match
2. ✅ Should display full assignment details
3. ✅ Should show match explanation:
   - Skills alignment
   - Experience match
   - Impact potential
4. ✅ Should show action buttons:
   - Accept Match
   - Decline Match
   - Save for Later

**Test 3: Accept Match**
1. Click "Accept Match"
2. ✅ Should prompt for confirmation
3. ✅ Should update match status to 'accepted'
4. ✅ Should enable messaging
5. ✅ Should notify organization
6. ✅ Match should move to "Active" section

**Test 4: Decline Match**
1. Click "Decline Match"
2. ✅ Should prompt for reason (optional)
3. ✅ Should update match status to 'declined'
4. ✅ Match should be removed from suggestions
5. ✅ Should track analytics event

**Test 5: View Applicants (Organization)**
1. Login as organization
2. Navigate to Matches/Applicants
3. ✅ Should display applicants for each assignment
4. ✅ Should show match scores
5. ✅ Should allow accepting/declining applicants

**Expected Result:**
- Matching system displays correctly
- Accept/decline actions work
- Database updates reflect status changes
- Both sides (individual & org) see updates
- Analytics events tracked

---

### ✅ Real-Time Messaging

**URL:** http://localhost:3000/messages or /conversations

**Setup:**
1. Ensure at least one accepted match between individual and organization

**Test 1: Open Conversation**
1. Navigate to Messages
2. ✅ Should list conversations from accepted matches
3. ✅ Click on a conversation
4. ✅ Should load message history

**Test 2: Send Message (Individual)**
1. Type message in input field
2. Click "Send"
3. ✅ Message should appear immediately
4. ✅ Message should save to database
5. ✅ Organization should receive notification
6. ✅ Analytics event should be tracked

**Test 3: Receive Message**
1. Login as organization in another browser/incognito
2. Send message from organization
3. ✅ Individual should see message appear in real-time
4. ✅ No page refresh required
5. ✅ Unread count should update

**Test 4: Real-Time Updates**
1. Keep both browsers open (individual & org)
2. Send messages from both sides
3. ✅ Messages should appear instantly on both sides
4. ✅ Typing indicators should work (if implemented)
5. ✅ Read receipts should update (if implemented)

**Test 5: Message Features**
1. **Attachments** (if implemented):
   - Upload file
   - ✅ Should upload to Supabase Storage
   - ✅ Should display in message
2. **Formatting** (if implemented):
   - Test markdown/rich text
   - ✅ Should render correctly
3. **Message History:**
   - Scroll up to load older messages
   - ✅ Pagination should work

**Expected Result:**
- Messaging works in real-time
- Messages persist in database
- Both parties see updates instantly
- No lag or sync issues
- Supabase Realtime subscriptions work correctly

---

### ✅ Organization Assignment Posting

**URL:** http://localhost:3000/organization or /assignments/new

**Test 1: Create New Assignment**
1. Login as organization
2. Click "Post New Assignment" or "Create Assignment"
3. Fill in assignment details:
   - Title: "Senior Software Engineer"
   - Description: "We're looking for..."
   - Skills required: ["JavaScript", "React", "Node.js"]
   - Experience level: "Senior"
   - Assignment type: "Contract" | "Full-time" | "Volunteer"
   - Duration: "6 months"
   - Budget/compensation: "$5000"
4. Click "Save as Draft" or "Publish"
5. ✅ Should save to database
6. ✅ Should appear in organization's assignments list

**Test 2: Edit Assignment**
1. Go to assignments list
2. Click "Edit" on an assignment
3. Update fields
4. Click "Save"
5. ✅ Changes should persist
6. ✅ Should track edit analytics event

**Test 3: Publish Assignment**
1. Find draft assignment
2. Click "Publish"
3. ✅ Status should change to 'published'
4. ✅ Assignment should become visible to matching algorithm
5. ✅ Potential matches should start appearing
6. ✅ Analytics event should be tracked

**Test 4: View Matches for Assignment**
1. Click on published assignment
2. View "Matches" or "Applicants" tab
3. ✅ Should display matched individuals
4. ✅ Should show match scores
5. ✅ Should allow reviewing profiles

**Test 5: Close Assignment**
1. Click "Close" or "Mark as Filled"
2. ✅ Status should change to 'closed'
3. ✅ Assignment should stop appearing in search
4. ✅ Should prompt for reason (optional)
5. ✅ Analytics event should be tracked

**Expected Result:**
- Organizations can create/edit assignments
- Assignments save correctly to database
- Publishing triggers matching algorithm
- Assignment lifecycle works (draft → published → closed)
- All fields validate and save properly

---

## Priority 2: Expertise & Verification

### ✅ Expertise Atlas (Skill Management)

**URL:** http://localhost:3000/expertise

**Test 1: View Expertise Atlas**
1. Login as individual
2. Navigate to Expertise
3. ✅ Should display skill categories
4. ✅ Should show existing skills (if any)
5. ✅ Should have visual organization (cards/grid/tree)

**Test 2: Add New Skill**
1. Click "Add Skill"
2. Fill in:
   - Skill name: "React"
   - Category: "Technical"
   - Proficiency: "Advanced"
   - Years of experience: "5"
3. Click "Save"
4. ✅ Should save to database
5. ✅ Skill should appear in atlas
6. ✅ Analytics event should be tracked

**Test 3: Edit Skill**
1. Click on existing skill
2. Update proficiency or details
3. Click "Save"
4. ✅ Changes should persist
5. ✅ Analytics event should be tracked

**Test 4: Link Skill to Proof**
1. Click "Add Proof" on a skill
2. Select existing proof or create new one
3. ✅ Should link skill to proof
4. ✅ Relationship should save in database
5. ✅ Skill should show "Verified" badge if proof is verified

**Test 5: Delete Skill**
1. Click "Delete" on a skill
2. Confirm deletion
3. ✅ Should remove from database
4. ✅ Should handle linked proofs gracefully

**Expected Result:**
- Expertise Atlas displays correctly
- Skills can be added/edited/deleted
- Skills link to proofs
- Visual organization is intuitive
- Database updates reflect changes

---

### ✅ Proof Submission & Verification

**URL:** http://localhost:3000/profile/proofs or /proofs/new

**Test 1: Submit New Proof**
1. Click "Add Proof" or "Submit Proof"
2. Fill in:
   - Claim type: "Work Experience" | "Education" | "Project" | "Award"
   - Claim text: "Led development of React app for..."
   - Proof type: "Document" | "Referee" | "Social" | "Self-Attested"
   - Upload document (if applicable)
3. Click "Submit"
4. ✅ Should save to database
5. ✅ Status should be 'pending'
6. ✅ Analytics event should be tracked

**Test 2: Request Referee Verification**
1. Submit proof with proof_type: "Referee"
2. Enter referee details:
   - Name: "John Smith"
   - Email: "referee@example.com"
   - Relationship: "Former Manager"
3. Click "Send Verification Request"
4. ✅ Verification request should be created
5. ✅ Email should be sent to referee
6. ✅ Status should show 'verification_pending'

**Test 3: Referee Verifies Proof**
1. Check referee's email
2. Click verification link
3. ✅ Should load verification form (publicly accessible)
4. Referee fills in:
   - Confirmation
   - Comments (optional)
   - Attestation checkbox
5. Click "Submit Verification"
6. ✅ Proof status should change to 'verified'
7. ✅ User should be notified
8. ✅ Analytics event should be tracked

**Test 4: View Proofs**
1. Navigate to profile or proofs section
2. ✅ Should display all submitted proofs
3. ✅ Should show verification status for each:
   - Verified (green checkmark)
   - Pending (yellow clock)
   - Rejected (red X)
4. ✅ Click on proof to view details

**Test 5: Edit Proof**
1. Click "Edit" on unverified proof
2. Update fields
3. Click "Save"
4. ✅ Changes should persist
5. ✅ Cannot edit verified proofs (or should create new version)

**Test 6: Resend Verification Email**
1. Find proof with pending verification
2. Click "Resend Email"
3. ✅ New email should be sent to referee
4. ✅ Analytics event should be tracked

**Expected Result:**
- Proof submission works correctly
- Verification workflow functional
- Referee can verify via email link
- Status updates reflect in real-time
- All proof types supported
- Document uploads work

---

### ✅ Settings Management

**URL:** http://localhost:3000/settings

**Test 1: Profile Settings**
1. Navigate to Settings > Profile
2. ✅ Can edit basic profile info
3. ✅ Can upload/change avatar
4. ✅ Changes save correctly

**Test 2: Account Settings**
1. Navigate to Settings > Account
2. **Email:** Update email address
   - ✅ Should send verification to new email
3. **Password:** Change password
   - Enter current password
   - Enter new password
   - Confirm new password
   - ✅ Should update successfully
   - ✅ Should require re-login
4. **Account Type:** (Should NOT be editable after signup)
   - ✅ Should display current type
   - ✅ Should not allow changing

**Test 3: Privacy Settings**
1. Navigate to Settings > Privacy
2. **Profile Visibility:**
   - Toggle individual fields (email, phone, location, etc.)
   - ✅ Should save preferences
   - ✅ Should affect what others see on profile
3. **Data Collection:**
   - Toggle analytics
   - ✅ Should respect opt-out
   - ✅ Should stop tracking events if disabled
4. **Search Visibility:**
   - Toggle "Allow my profile to appear in search"
   - ✅ Should affect matching algorithm

**Test 4: Notification Settings**
1. Navigate to Settings > Notifications
2. Toggle notification channels:
   - Email notifications
   - Push notifications
   - SMS (if implemented)
3. Toggle notification types:
   - New match
   - New message
   - Verification updates
   - Assignment updates
4. ✅ Should save preferences
5. ✅ Should honor preferences when sending notifications

**Test 5: Delete Account**
1. Navigate to Settings > Account > Delete Account
2. Click "Delete Account"
3. ✅ Should prompt for confirmation
4. ✅ Should ask for reason (optional)
5. ✅ Should require password
6. Confirm deletion
7. ✅ Should delete user data
8. ✅ Should log out
9. ✅ Should track analytics event
10. ✅ Cannot login again with deleted account

**Expected Result:**
- All settings save correctly
- Privacy settings affect profile visibility
- Notification preferences are honored
- Password change works securely
- Account deletion is permanent and secure

---

## Priority 3: Wellbeing & Admin

### ✅ Zen Hub (Privacy-First Wellbeing)

**URL:** http://localhost:3000/zen

**Important:** Zen Hub should be individual-only, not visible to organizations

**Test 1: Access Zen Hub**
1. Login as individual
2. Navigate to Zen Hub
3. ✅ Should load Zen Hub interface
4. ✅ Should display available practices/resources
5. Login as organization
6. Try to access /zen
7. ✅ Should NOT be visible in navigation
8. ✅ Should redirect or show 404

**Test 2: View Available Practices**
1. ✅ Should display categories:
   - Mindfulness exercises
   - Breathing techniques
   - Stress management
   - Mental health resources
2. ✅ Each practice should show:
   - Title
   - Duration
   - Description
   - Difficulty level

**Test 3: Start Practice**
1. Click on a practice
2. Click "Start Practice"
3. ✅ Practice should begin
4. ✅ Timer should start (if applicable)
5. ✅ Instructions should display
6. ✅ Analytics event should be tracked (anonymously)

**Test 4: Complete Practice**
1. Complete a practice
2. ✅ Should show completion message
3. ✅ Should track completion (locally or anonymously)
4. ✅ Should update streak/progress (if implemented)
5. ✅ Should track analytics event (without personal data)

**Test 5: Safety Plan (if implemented)**
1. Navigate to "Safety Plan" section
2. Fill in:
   - Warning signs
   - Coping strategies
   - Support contacts
   - Crisis resources
3. Click "Save"
4. ✅ Should save locally or encrypted in database
5. ✅ Should NEVER be visible to anyone else
6. ✅ Should be exportable/printable

**Test 6: Privacy Verification**
1. Check that NO personal practice data is stored
2. ✅ Only aggregated/anonymous analytics
3. ✅ Safety plan is private
4. ✅ No sharing functionality
5. ✅ Data is encrypted or local-only

**Expected Result:**
- Zen Hub is individual-only
- Practices are functional and accessible
- Privacy is absolute (no personal data shared)
- Analytics are anonymous
- Safety plan is private and secure
- UI is calming and accessible

---

### ✅ Admin Dashboard & Analytics

**URL:** http://localhost:3000/admin

**Important:** Only accessible to users with is_admin=true

**Test 1: Access Control**
1. Login as regular user
2. Try to access /admin
3. ✅ Should redirect or show 403 error
4. Login as admin user
5. ✅ Should load admin dashboard

**Test 2: View Dashboard**
1. Navigate to Admin Dashboard
2. ✅ Should display key metrics:
   - Total users (individual vs organization)
   - Total matches
   - Active assignments
   - Verification requests
   - Growth charts
3. ✅ Should show recent activity
4. ✅ Charts should load from analytics_events table

**Test 3: User Management**
1. Navigate to Admin > Users
2. ✅ Should list all users
3. ✅ Should have search/filter
4. ✅ Can view user details
5. ✅ Can change user status (active/suspended)
6. ✅ Can mark user as admin

**Test 4: Content Moderation**
1. Navigate to Admin > Reports
2. ✅ Should list reported content
3. ✅ Should show report details
4. Click "Review"
5. ✅ Can take action (approve/remove/ban)
6. ✅ Action should update content status

**Test 5: Analytics**
1. Navigate to Admin > Analytics
2. ✅ Should display:
   - User growth over time
   - Match success rate
   - Verification completion rate
   - Engagement metrics
   - Top skills/categories
3. ✅ Can filter by date range
4. ✅ Can export data

**Test 6: System Settings**
1. Navigate to Admin > Settings
2. ✅ Can update system-wide settings
3. ✅ Can manage feature flags
4. ✅ Can configure matching algorithm parameters

**Expected Result:**
- Admin dashboard loads correctly
- Only admins can access
- User management works
- Content moderation functional
- Analytics display accurately
- System settings save properly

---

## Cross-Cutting Tests

### ✅ Responsive Design

**Test on multiple viewports:**

**Mobile (375px width):**
1. Visit all major pages
2. ✅ Layout should be mobile-optimized
3. ✅ Navigation should collapse to hamburger menu
4. ✅ Forms should be touch-friendly
5. ✅ No horizontal scroll
6. ✅ Text is readable
7. ✅ Buttons are tappable (min 44px)

**Tablet (768px width):**
1. Visit all major pages
2. ✅ Should use tablet layout
3. ✅ Two-column layouts where appropriate
4. ✅ Navigation should be accessible
5. ✅ No layout breaks

**Desktop (1440px+ width):**
1. Visit all major pages
2. ✅ Should use full desktop layout
3. ✅ Sidebar navigation visible
4. ✅ Multi-column layouts where appropriate
5. ✅ No excessive whitespace
6. ✅ Optimal content width

**Test interactions:**
- ✅ Touch/swipe gestures work on mobile
- ✅ Hover states work on desktop
- ✅ Keyboard navigation works
- ✅ Screen reader compatibility

---

### ✅ Performance

**Test load times:**
1. ✅ Initial page load < 3s
2. ✅ Navigation between pages < 1s
3. ✅ API responses < 500ms
4. ✅ Images load progressively
5. ✅ No layout shift during load

**Test with slow connection:**
1. Use Chrome DevTools > Network > Slow 3G
2. ✅ App should still be usable
3. ✅ Loading states should display
4. ✅ Critical content loads first

---

### ✅ Error Handling

**Test common errors:**
1. Network error:
   - Disconnect internet
   - Try to submit form
   - ✅ Should show error message
2. Validation error:
   - Submit form with invalid data
   - ✅ Should show field-specific errors
3. Auth error:
   - Try to access protected route when logged out
   - ✅ Should redirect to login
4. 404 error:
   - Visit non-existent route
   - ✅ Should show 404 page

---

### ✅ Accessibility

**Test keyboard navigation:**
1. Tab through all interactive elements
2. ✅ Focus indicators are visible
3. ✅ Tab order is logical
4. ✅ Can submit forms with Enter key
5. ✅ Can close modals with Esc key

**Test screen reader:**
1. Use VoiceOver (Mac) or NVDA (Windows)
2. ✅ All content is announced
3. ✅ Form labels are associated
4. ✅ Buttons have descriptive labels
5. ✅ Images have alt text

**Test color contrast:**
1. Check all text
2. ✅ Contrast ratio ≥ 4.5:1 for normal text
3. ✅ Contrast ratio ≥ 3:1 for large text

---

## Testing Priorities Summary

**P0 - Critical (Must Work):**
- Sign up (both types)
- Login
- Profile creation
- Dashboard loads
- No 404 errors

**P1 - Core Features:**
- Matching system
- Messaging
- Assignment posting
- Expertise Atlas
- Proof verification

**P2 - Important Features:**
- Settings management
- Zen Hub
- Admin dashboard

**P3 - Nice to Have:**
- Advanced filters
- Analytics dashboards
- Export features

---

## Known Issues & Limitations

**Non-Breaking Issues:**
- ✅ Console warning about missing `tagline` column (can be ignored or fixed by adding column to Supabase)

**Potential Issues to Watch For:**
- Profile creation timing (should be immediate)
- Real-time message sync delays
- Match score calculation accuracy
- Email delivery delays (Supabase SMTP)

---

## Testing Tools

**Browsers:**
- Chrome (primary)
- Safari
- Firefox
- Edge

**Devices:**
- Desktop
- iPad
- iPhone
- Android phone

**Tools:**
- Chrome DevTools
- React DevTools
- Supabase Dashboard
- PostHog/Analytics

---

## Bug Reporting Template

When you find a bug, report it with:

```markdown
**Bug Title:** [Brief description]

**Severity:** Critical | High | Medium | Low

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Result:**
What should happen

**Actual Result:**
What actually happened

**Environment:**
- Browser: Chrome 120
- Device: MacBook Pro
- User Type: Individual | Organization
- Logged in: Yes/No

**Screenshots/Videos:**
[Attach if applicable]

**Console Errors:**
```
[Paste any errors from browser console]
```

**Additional Context:**
Any other relevant information
```

---

## Completion Checklist

- [ ] All P0 tests passing
- [ ] All P1 tests passing
- [ ] All P2 tests passing
- [ ] Responsive design verified
- [ ] Performance acceptable
- [ ] Accessibility compliant
- [ ] Error handling tested
- [ ] No critical bugs
- [ ] Documentation updated
- [ ] Ready for deployment

---

*Last Updated: [Current Date]*
*Testing Status: In Progress*
