# Proofound MVP - Testing Guide

## 🧪 Testing Strategy Overview

This guide covers manual testing procedures for the Proofound MVP. The focus is on ensuring all features work correctly before deployment.

---

## 1. Authentication Flow Testing

### 1.1 Individual Sign-Up Flow

**Test Scenario**: New individual user registration

**Steps**:
1. Navigate to `/signup`
2. Click "Individual" account type
3. **Step 1 - Email & Password**:
   - Enter valid email address
   - Enter strong password (8+ chars, mix of cases, numbers)
   - Confirm password matches
   - Click "Next"
4. **Verification**:
   - Check email inbox for verification link
   - Click verification link
   - Should redirect to dashboard with success message
5. **Profile Completion**:
   - Fill in full name
   - Add tagline
   - Select location
   - Upload avatar (optional)
   - Save profile

**Expected Results**:
- ✅ Email validation works
- ✅ Password strength indicator shows
- ✅ Verification email received within 1 minute
- ✅ Verification link works and expires after use
- ✅ User redirected to `/home` after verification
- ✅ Profile data saves correctly

**Error Cases to Test**:
- Email already registered
- Weak password
- Passwords don't match
- Email verification expires (14 days)
- Network interruption during sign-up

---

### 1.2 Organization Sign-Up Flow

**Test Scenario**: New organization account registration

**Steps**:
1. Navigate to `/signup`
2. Click "Organization" account type
3. **Step 1 - Organization Details**:
   - Enter organization name
   - Enter legal name
   - Select organization type
   - Click "Next"
4. **Step 2 - Admin Account**:
   - Enter admin email
   - Enter password
   - Confirm password
   - Click "Next"
5. **Verification**:
   - Check admin email for verification
   - Click verification link
6. **Complete Setup**:
   - Add organization description
   - Upload logo
   - Set organization preferences

**Expected Results**:
- ✅ Organization created in database
- ✅ Admin user linked correctly
- ✅ Organization dashboard accessible
- ✅ Can post assignments immediately

---

### 1.3 Login Flow

**Test Scenario**: Existing user login

**Steps**:
1. Navigate to `/login`
2. Enter email and password
3. Click "Sign In"

**Expected Results**:
- ✅ Successful login redirects to `/home`
- ✅ Invalid credentials show error message
- ✅ "Forgot Password" link works
- ✅ OAuth providers work (Google)

**Test Cases**:
- Valid credentials
- Invalid email
- Wrong password
- Unverified email
- Account locked
- OAuth login (Google)

---

## 2. Core Feature Testing

### 2.1 Dashboard

**Test Scenario**: User views dashboard after login

**Steps**:
1. Log in as individual user
2. View dashboard at `/home`
3. Check all sections load:
   - Profile completion widget
   - Matches summary
   - Recent notifications
   - Quick actions
4. Click on different sections

**Expected Results**:
- ✅ All data loads within 2 seconds
- ✅ Profile completion percentage accurate
- ✅ Matches count correct
- ✅ Notifications display chronologically
- ✅ Quick actions navigate correctly
- ✅ Empty states show when no data

---

### 2.2 Profile Management

**Test Scenario**: User edits their profile

**Steps**:
1. Navigate to `/profile`
2. Click "Edit Profile" button
3. Update fields:
   - Change tagline
   - Update bio
   - Modify location
   - Update skills
4. Save changes
5. Refresh page to verify persistence

**Expected Results**:
- ✅ Changes save successfully
- ✅ Changes persist after refresh
- ✅ Profile completion updates
- ✅ Success toast notification shows
- ✅ Real-time preview of changes

**Persona-Specific Tests**:
- **Individual**: Skills, bio, availability
- **Organization**: Company info, team size, mission

---

### 2.3 Matching System

**Test Scenario**: View and interact with matches

**Individual User Steps**:
1. Navigate to `/matches`
2. View suggested matches
3. Click on a match to view details
4. Review match explanation
5. Accept a match
6. Decline a match with reason

**Organization User Steps**:
1. Navigate to `/matches`
2. Create new assignment
3. View matched candidates
4. Review candidate profiles
5. Accept/decline candidates

**Expected Results**:
- ✅ Matches display with scores
- ✅ Match explanations show breakdown
- ✅ Accept/decline actions work
- ✅ Status updates immediately
- ✅ Notifications sent on match actions

---

### 2.4 Messaging

**Test Scenario**: Send and receive messages

**Steps**:
1. Accept a match
2. Navigate to `/conversations`
3. Select the conversation
4. Type message
5. Send message
6. Open in another browser (different user)
7. See message appear in real-time
8. Reply to message
9. Check read receipts

**Expected Results**:
- ✅ Messages send successfully
- ✅ Real-time updates work
- ✅ Read receipts display
- ✅ Message history persists
- ✅ Search conversations works
- ✅ Unread count updates

---

### 2.5 Expertise Atlas

**Test Scenario**: Manage skills

**Steps**:
1. Navigate to `/expertise`
2. Click "Add Skill"
3. Fill in skill details:
   - Skill name
   - Category
   - Proficiency level
   - Description
   - Sub-skills
4. Save skill
5. Link skill to proof
6. Edit skill
7. Delete skill

**Expected Results**:
- ✅ Skills save correctly
- ✅ Categories filter work
- ✅ Proof linking functional
- ✅ Skill cards display properly
- ✅ Progress indicator accurate

---

### 2.6 Proof Submission & Verification

**Test Scenario**: Submit proof and request verification

**Steps**:
1. Navigate to `/profile/proofs/new`
2. **Step 1 - Claim Details**:
   - Select claim type
   - Describe claim
3. **Step 2 - Proof Type**:
   - Choose "Verified Reference"
   - Add supporting link
4. **Step 3 - Verifier Details**:
   - Enter referee name and email
   - Specify relationship
   - Add context notes
5. Submit proof
6. Check referee email
7. As referee, click verification link
8. Complete verification form
9. As original user, check proof status

**Expected Results**:
- ✅ Proof submission successful
- ✅ Verification email sent
- ✅ Referee page loads correctly
- ✅ Verification records properly
- ✅ Status updates in real-time
- ✅ Notifications sent to requester

---

### 2.7 Organization Features

**Test Scenario**: Organization posts assignment

**Steps**:
1. Log in as organization
2. Navigate to `/assignments/new`
3. **Step 1 - Overview**:
   - Role title
   - Description
   - Team/department
   - Duration
4. **Step 2 - Location & Compensation**:
   - Location type
   - Compensation details
5. **Step 3 - Required Skills**:
   - List required skills
   - List preferred skills
6. **Step 4 - Responsibilities**:
   - Key responsibilities
7. **Step 5 - Review**:
   - Review all details
   - Publish assignment
8. View matches for assignment

**Expected Results**:
- ✅ Assignment saves as draft
- ✅ Can edit before publishing
- ✅ Publishing triggers match generation
- ✅ Matches appear within minutes
- ✅ Can view candidate profiles

---

## 3. Responsive Design Testing

### 3.1 Mobile Testing (320px - 480px)

**Devices to Test**:
- iPhone SE (375px)
- iPhone 12/13 (390px)
- Samsung Galaxy (360px)

**Tests**:
- ✅ Navigation menu accessible
- ✅ Forms usable
- ✅ Buttons tappable (min 44x44px)
- ✅ Text readable without zooming
- ✅ Images scale properly
- ✅ Modals fit on screen

---

### 3.2 Tablet Testing (768px - 1024px)

**Devices to Test**:
- iPad (768px)
- iPad Pro (1024px)

**Tests**:
- ✅ Layout adapts to tablet width
- ✅ Touch targets appropriate
- ✅ Navigation optimized for tablet
- ✅ Content not too stretched

---

### 3.3 Desktop Testing (1280px+)

**Resolutions to Test**:
- 1280px (HD)
- 1920px (Full HD)
- 2560px (2K)

**Tests**:
- ✅ Max-width containers prevent content stretch
- ✅ Multi-column layouts work
- ✅ Images high quality
- ✅ Navigation fully expanded

---

## 4. Accessibility Testing

### 4.1 Keyboard Navigation

**Test with keyboard only (no mouse)**:

1. Tab through homepage
2. Navigate to sign-up page
3. Fill out form using only keyboard
4. Submit form
5. Navigate through dashboard
6. Open and close modals
7. Complete a full user flow

**Expected Results**:
- ✅ All interactive elements reachable
- ✅ Tab order logical
- ✅ Focus indicators visible
- ✅ Can activate all buttons with Enter/Space
- ✅ Escape closes modals
- ✅ Skip links present

---

### 4.2 Screen Reader Testing

**Test with screen reader** (VoiceOver on Mac, NVDA on Windows):

1. Navigate homepage
2. Listen to page structure
3. Activate form elements
4. Submit a form
5. Navigate data tables
6. Hear error messages

**Expected Results**:
- ✅ Page title announced
- ✅ Headings structured properly
- ✅ Form labels associated
- ✅ Images have alt text
- ✅ ARIA labels present
- ✅ Error messages announced

---

### 4.3 Visual Accessibility

**Tests**:
- ✅ Color contrast ratio ≥ 4.5:1 for text
- ✅ Color contrast ratio ≥ 3:1 for UI components
- ✅ No information conveyed by color alone
- ✅ Text resizable to 200% without loss of function
- ✅ Focus indicators visible on all interactive elements

**Tools**:
- Chrome DevTools Lighthouse
- WAVE browser extension
- axe DevTools
- Color contrast analyzer

---

## 5. Performance Testing

### 5.1 Page Load Speed

**Test on different connection speeds**:
- Fast 3G
- 4G
- WiFi

**Metrics to measure**:
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3s
- Cumulative Layout Shift (CLS): < 0.1
- First Input Delay (FID): < 100ms

**Tools**:
```bash
# Run Lighthouse audit
npm run lighthouse

# Or use Chrome DevTools > Lighthouse tab
```

---

### 5.2 Bundle Size Analysis

```bash
# Analyze bundle
npm run build
npm run analyze

# Check total bundle size
du -sh .next/static/**/*.js
```

**Targets**:
- Total JavaScript: < 300KB (gzipped)
- Total CSS: < 50KB (gzipped)
- First Load JS: < 200KB

---

### 5.3 Database Query Performance

**Test scenarios with large datasets**:
1. 1000+ matches
2. 500+ messages
3. 100+ proofs
4. 50+ skills

**Check**:
- ✅ Queries return within 1 second
- ✅ Pagination works correctly
- ✅ Infinite scroll performs well
- ✅ No N+1 query problems

---

## 6. Security Testing

### 6.1 Authentication Security

**Tests**:
- ✅ Password hashing (bcrypt/Supabase)
- ✅ JWT tokens expire properly
- ✅ Session management secure
- ✅ CSRF protection enabled
- ✅ XSS prevention in place
- ✅ SQL injection not possible (using Supabase)

---

### 6.2 Authorization Testing

**Test RLS (Row Level Security)**:

1. As User A, try to access User B's data
2. Try to edit another user's profile
3. Try to delete another user's messages
4. Try to access admin routes as non-admin

**Expected Results**:
- ✅ Unauthorized access blocked
- ✅ Error messages don't reveal system info
- ✅ Redirects to appropriate pages
- ✅ No data leakage in responses

---

### 6.3 Data Privacy

**Tests**:
- ✅ User can export their data
- ✅ User can delete their account
- ✅ Deleted data actually removed
- ✅ Privacy settings respected
- ✅ Analytics opt-out works
- ✅ Zen Hub data not stored on server

---

## 7. Integration Testing

### 7.1 Complete User Journeys

**Journey 1: Individual Job Seeker**

1. Sign up as individual
2. Complete profile
3. Add 5 skills to Expertise Atlas
4. Submit 2 proofs
5. Request verification for 1 proof
6. View suggested matches
7. Accept a match
8. Send first message
9. Continue conversation
10. Update availability

**Journey 2: Organization Recruiter**

1. Sign up as organization
2. Complete organization profile
3. Post first assignment
4. Review matched candidates
5. View candidate profiles
6. Accept top 3 candidates
7. Send messages to candidates
8. Schedule interviews
9. Post second assignment
10. Manage team members

**Journey 3: Verification Flow**

1. User submits proof
2. System sends verification email
3. Referee receives email
4. Referee clicks verification link
5. Referee reviews claim
6. Referee approves/declines
7. User notified of decision
8. Proof status updates
9. Proof appears on profile

---

## 8. Error Handling Testing

### 8.1 Network Errors

**Simulate network failures**:
1. Disconnect internet
2. Try to submit form
3. Reconnect
4. Retry submission

**Expected Results**:
- ✅ Graceful error message
- ✅ Data not lost
- ✅ Can retry action
- ✅ Offline indicator shows

---

### 8.2 Server Errors

**Simulate**:
- 500 Internal Server Error
- 503 Service Unavailable
- Timeout errors

**Expected Results**:
- ✅ User-friendly error page
- ✅ Suggestion to retry
- ✅ No stack traces visible
- ✅ Error logged for monitoring

---

## 9. Browser Compatibility

### 9.1 Desktop Browsers

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest | ✅ |
| Firefox | Latest | ✅ |
| Safari | Latest | ✅ |
| Edge | Latest | ✅ |

### 9.2 Mobile Browsers

| Browser | OS | Status |
|---------|-----|--------|
| Safari | iOS 15+ | ✅ |
| Chrome | Android 12+ | ✅ |
| Samsung Internet | Latest | ✅ |

---

## 10. Deployment Testing

### 10.1 Pre-Deployment Tests

```bash
# 1. Clean install
rm -rf node_modules package-lock.json
npm install

# 2. Type check
npm run type-check

# 3. Lint
npm run lint

# 4. Build
npm run build

# 5. Run production build locally
npm run start
```

### 10.2 Post-Deployment Tests

**Immediately after deployment**:
1. Visit production URL
2. Sign up new user
3. Test one complete user flow
4. Check analytics tracking
5. Monitor error logs
6. Test email sending
7. Check database connections

---

## 11. Monitoring After Launch

### 11.1 Week 1 Monitoring

**Daily checks**:
- Error rate < 1%
- Average response time < 500ms
- Uptime > 99.9%
- Sign-up conversion rate
- User engagement metrics

### 11.2 Tools

- **Error Tracking**: Sentry / LogRocket
- **Performance**: Vercel Analytics / Lighthouse CI
- **Uptime**: UptimeRobot
- **User Analytics**: Custom Supabase tracking
- **Database**: Supabase Dashboard

---

## 📝 Test Results Template

```markdown
## Test Session: [Date]
**Tester**: [Name]
**Environment**: [Local/Staging/Production]
**Browser**: [Browser + Version]
**Device**: [Device/Screen Size]

### Tests Completed:
- [ ] Authentication flows
- [ ] Core features
- [ ] Responsive design
- [ ] Accessibility
- [ ] Performance

### Issues Found:
1. **Issue**: [Description]
   - **Severity**: Critical/High/Medium/Low
   - **Steps to reproduce**: [Steps]
   - **Expected**: [Expected behavior]
   - **Actual**: [Actual behavior]
   - **Screenshot**: [Link if available]

### Notes:
[Any additional observations]
```

---

## 🎯 Testing Priorities

**Priority 1 (Must Work)**:
- Authentication (sign-up, login, logout)
- Profile creation and editing
- Matching system (view, accept, decline)
- Messaging (send, receive, real-time)
- Assignment posting (organizations)

**Priority 2 (Should Work)**:
- Proof submission
- Verification requests
- Expertise Atlas
- Settings management
- Notifications

**Priority 3 (Nice to Have)**:
- Zen Hub
- Analytics dashboard (admin)
- Advanced filters
- Export features

---

**Happy Testing! 🧪**

