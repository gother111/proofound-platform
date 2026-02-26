> Doc Class: `historical`
> Historical Snapshot Reviewed: `2026-02-26`
> Canonical Current Testing Docs:
>
> - `docs/testing-strategy.md`
> - `docs/qa/e2e-matrix.md`
> - `docs/qa/summary.md`
> - `agent/checklists/verification.md`
> - `agent/runbooks/setup.md`
>
> Note: This archived file preserves historical context. For current routes, commands, and gate criteria, use the canonical docs above.

---

# 🎯 Platform QA Checklist

**Proofound - Comprehensive Testing & Verification Guide**

This document organizes all platform components, pages, and features into three different views to help agents systematically test everything. Each item includes what needs to be verified for complete quality assurance.

---

## 📋 How to Use This Checklist

**For Each Item, Verify:**

1. ✅ **Responsive Design** - Works on mobile, tablet, and desktop
2. ✅ **Database Connection** - Data loads, saves, and updates correctly
3. ✅ **UI/UX Quality** - Clean design, intuitive flow, proper error states
4. ✅ **Functionality** - All buttons, forms, and interactions work as expected
5. ✅ **Performance** - Fast load times, smooth animations, no lag

**Priority Levels:**

- 🔴 **Critical** - Core functionality, must work perfectly
- 🟠 **High** - Important features, high user impact
- 🟡 **Medium** - Standard features, moderate impact
- 🟢 **Low** - Nice-to-have, low impact

---

# 🗺️ VIEW 1: BY USER JOURNEY

## 👤 INDIVIDUAL USER FLOW

### 🔐 Authentication & Onboarding

- [ ] **Login Page** - 🔴 Critical
  - Path: `/src/app/(auth)/login/page.tsx`
  - Component: `SignIn.tsx`
  - Verify: Email/password login, social sign-in (Google, LinkedIn), error messages, redirect after login
- [ ] **Signup Page** - 🔴 Critical
  - Path: `/src/app/(auth)/signup/page.tsx`
  - Component: `SignupForm.tsx`
  - Verify: Form validation, password strength, email verification trigger, terms acceptance
- [ ] **Email Verification Page** - 🔴 Critical
  - Path: `/src/app/(auth)/verify-email/page.tsx`
  - Verify: Verification link works, success/error states, redirect to onboarding
- [ ] **Password Reset Pages** - 🟠 High
  - Path: `/src/app/(auth)/reset-password/page.tsx` + confirm page
  - Verify: Email sending, token validation, password update, success confirmation
- [ ] **Onboarding Flow** - 🔴 Critical
  - Path: `/src/app/onboarding/page.tsx`
  - Components: `PersonaChoice.tsx`, `IndividualSetup.tsx`, `OnboardingClient.tsx`
  - Verify: Persona selection, multi-step progress, data persistence, skip/back navigation

### 🏠 Dashboard & Home

- [ ] **Individual Dashboard** - 🔴 Critical
  - Path: `/src/app/app/i/home/page.tsx`
  - Component: `DashboardClient.tsx`
  - Verify: Widget layout, drag-and-drop customization, real-time data updates, empty states
- [ ] **Dashboard Widgets** - 🟠 High
  - Components: `ExploreCard.tsx`, `GoalsCard.tsx`, `ProjectsCard.tsx`, `TasksCard.tsx`, `WhileAwayCard.tsx`, `MatchingResultsCard.tsx`, `ImpactSnapshotCard.tsx`, `TeamRolesCard.tsx`
  - Verify: Each widget displays correct data, responsive layout, click interactions
- [ ] **Customizable Dashboard** - 🟡 Medium
  - Component: `CustomizableDashboard.tsx`, `CustomizeModal.tsx`, `DraggableDashboard.tsx`
  - Verify: Widget add/remove, drag-and-drop reordering, layout persistence

- [ ] **Gap Map Widget** - 🟠 High
  - Component: `GapMapWidget.tsx`
  - Verify: Visual gap analysis, skill recommendations, click to add skills

- [ ] **Next Best Actions Widget** - 🟠 High
  - Component: `NextBestActionsWidget.tsx`
  - Verify: Personalized action items, priority sorting, mark as complete

### 🎯 Expertise Management

- [ ] **Expertise Atlas Main Page** - 🔴 Critical
  - Path: `/src/app/app/i/expertise/page.tsx`
  - Component: `ExpertiseAtlasClient.tsx`
  - Verify: L1 category grid, skill counts, navigation to L2 modals, search/filter functionality
- [ ] **L1 Category Grid** - 🔴 Critical
  - Component: `/src/app/app/i/expertise/components/L1Grid.tsx`
  - Verify: All 20K skills taxonomy displayed, category colors, skill counts per category
- [ ] **L2 Skills Modal** - 🔴 Critical
  - Component: `/src/app/app/i/expertise/components/L2Modal.tsx`
  - Verify: Subcategory expansion, L4 skill cards, add/edit functionality
- [ ] **L4 Skill Cards** - 🔴 Critical
  - Component: `/src/app/app/i/expertise/components/L4Card.tsx`
  - Verify: Skill level, years experience, credibility badges, verification status
- [ ] **Add Skill Drawer** - 🟠 High
  - Component: `/src/app/app/i/expertise/components/AddSkillDrawer.tsx`
  - Verify: Taxonomy selection, level selection, years input, validation
- [ ] **Edit Skill Window** - 🟠 High
  - Component: `/src/app/app/i/expertise/components/EditSkillWindow.tsx`
  - Verify: Update skill details, delete skill, save changes to database
- [ ] **Skills Side Sheet** - 🟡 Medium
  - Component: `/src/app/app/i/expertise/components/SkillsSideSheet.tsx`
  - Verify: Skill details panel, related skills, verification options
- [ ] **Dashboard Filters** - 🟡 Medium
  - Component: `/src/app/app/i/expertise/components/DashboardFilters.tsx`
  - Verify: Filter by category, level, verification status, date added
- [ ] **Empty State** - 🟡 Medium
  - Component: `/src/app/app/i/expertise/components/EmptyState.tsx`
  - Verify: Helpful messaging, CTA to add first skill

### 📊 Expertise Widgets

- [ ] **Skill Wheel Widget** - 🟡 Medium
  - Component: `/src/app/app/i/expertise/widgets/SkillWheel.tsx`
  - Verify: Visual skill distribution, interactive hover, click to filter
- [ ] **Coverage Heatmap** - 🟡 Medium
  - Component: `/src/app/app/i/expertise/widgets/CoverageHeatmap.tsx`
  - Verify: Color-coded skill coverage, tooltip details
- [ ] **Credibility Pie Chart** - 🟡 Medium
  - Component: `/src/app/app/i/expertise/widgets/CredibilityPie.tsx`
  - Verify: Verification source breakdown, legend, percentages
- [ ] **Recency Scatter Plot** - 🟡 Medium
  - Component: `/src/app/app/i/expertise/widgets/RecencyScatter.tsx`
  - Verify: Skill usage timeline, hover for details
- [ ] **Relevance Bars** - 🟡 Medium
  - Component: `/src/app/app/i/expertise/widgets/RelevanceBars.tsx`
  - Verify: Skill demand/relevance scores, sorting
- [ ] **Verification Sources Pie** - 🟡 Medium
  - Component: `/src/app/app/i/expertise/widgets/VerificationSourcesPie.tsx`
  - Verify: Source type breakdown, click for details
- [ ] **Next Best Actions (Expertise)** - 🟠 High
  - Component: `/src/app/app/i/expertise/widgets/NextBestActions.tsx`
  - Verify: Skill gap recommendations, verification prompts

### 🔍 Advanced Expertise Features

- [ ] **Gap Analysis** - 🟠 High
  - Component: `GapMap.tsx`
  - Verify: Skill gap visualization, job market comparison, recommendations
- [ ] **CV/JD Auto-Suggest** - 🟠 High
  - Component: `CVJDAutoSuggest.tsx`
  - Verify: Upload CV/JD, skill extraction, auto-add to profile
- [ ] **LinkedIn Import** - 🟠 High
  - Component: `LinkedInImportModal.tsx`
  - Verify: OAuth connection, data parsing, skill import with verification
- [ ] **Mode Selector** - 🟡 Medium
  - Component: `ModeSelector.tsx`
  - Verify: Switch between view modes (grid, list, map)

### 👨‍💼 Profile Management

- [ ] **Profile View Page** - 🔴 Critical
  - Path: `/src/app/app/i/profile/page.tsx`
  - Component: `ProfileView.tsx`
  - Verify: Complete profile display, edit mode toggle, visibility controls
- [ ] **Editable Profile View** - 🔴 Critical
  - Component: `EditableProfileView.tsx`
  - Verify: Inline editing, save changes, validation, undo/cancel
- [ ] **Edit Profile Modal** - 🟠 High
  - Component: `EditProfileModal.tsx`
  - Verify: Full-screen edit mode, section navigation, save/cancel
- [ ] **Avatar Upload** - 🟠 High
  - Component: `AvatarUpload.tsx`
  - Verify: Image upload, crop/resize, file size validation, preview
- [ ] **Cover Photo Upload** - 🟡 Medium
  - Component: `CoverUpload.tsx`
  - Verify: Wide image upload, positioning, preview
- [ ] **Empty Profile State** - 🟡 Medium
  - Component: `EmptyProfileStateView.tsx`
  - Verify: Helpful onboarding prompts, quick setup links

### 📝 Profile Sections & Cards

- [ ] **Skills Card** - 🟠 High
  - Component: `SkillsCard.tsx`
  - Verify: Skills display, verification badges, edit link
- [ ] **Skills Editor** - 🟠 High
  - Component: `SkillsEditor.tsx`
  - Verify: Add/edit/remove skills, taxonomy selection
- [ ] **Causes Card** - 🟡 Medium
  - Component: `CausesCard.tsx`
  - Verify: Personal causes display, icons/imagery
- [ ] **Causes Editor** - 🟡 Medium
  - Component: `CausesEditor.tsx`
  - Verify: Add/edit causes, description, save
- [ ] **Mission Card** - 🟡 Medium
  - Component: `MissionCard.tsx`
  - Verify: Personal mission statement display
- [ ] **Mission Editor** - 🟡 Medium
  - Component: `MissionEditor.tsx`
  - Verify: Text editing, character limit, save
- [ ] **Vision Card** - 🟡 Medium
  - Component: `VisionCard.tsx`
  - Verify: Personal vision display
- [ ] **Vision Editor** - 🟡 Medium
  - Component: `VisionEditor.tsx`
  - Verify: Text editing, formatting, save
- [ ] **Values Card** - 🟡 Medium
  - Component: `ValuesCard.tsx`
  - Verify: Personal values list display
- [ ] **Values Editor** - 🟡 Medium
  - Component: `ValuesEditor.tsx`
  - Verify: Add/edit/remove values, reorder

### 📋 Profile Forms

- [ ] **Experience Form** - 🟠 High
  - Component: `/src/components/profile/forms/ExperienceForm.tsx`
  - Verify: Job title, company, dates, description, save/cancel
- [ ] **Education Form** - 🟠 High
  - Component: `/src/components/profile/forms/EducationForm.tsx`
  - Verify: Degree, institution, dates, field of study
- [ ] **Project Form** - 🟡 Medium
  - Component: `/src/components/profile/forms/ProjectForm.tsx`
  - Verify: Project details, skills used, outcomes
- [ ] **Impact Story Form** - 🟡 Medium
  - Component: `/src/components/profile/forms/ImpactStoryForm.tsx`
  - Verify: Story text, metrics, evidence uploads
- [ ] **Volunteer Form** - 🟡 Medium
  - Component: `/src/components/profile/forms/VolunteerForm.tsx`
  - Verify: Organization, role, dates, description

### 🔒 Profile Privacy

- [ ] **Field Visibility Controls** - 🟠 High
  - Component: `IndividualFieldVisibilityControls.tsx`
  - Verify: Per-field privacy settings, preview changes, save
- [ ] **Redacted Fields** - 🟠 High
  - Component: `RedactedField.tsx`
  - Verify: Proper masking of hidden data, visibility indicators

### 🤝 Matching & Opportunities

- [ ] **Matching Main Page** - 🔴 Critical
  - Path: `/src/app/app/i/matching/page.tsx`
  - Verify: Match cards display, filters, sorting, pagination
- [ ] **Match Result Card** - 🔴 Critical
  - Component: `MatchResultCard.tsx`
  - Verify: Assignment details, PAC score, express interest button, snooze option
- [ ] **Matching Profile Setup** - 🟠 High
  - Component: `MatchingProfileSetup.tsx`
  - Verify: Preferences form, availability, desired roles, save
- [ ] **Individual Matching Empty State** - 🟡 Medium
  - Component: `IndividualMatchingEmpty.tsx`
  - Verify: Helpful messaging, CTA to complete profile
- [ ] **Enhanced Match Filters** - 🟠 High
  - Component: `EnhancedMatchFilters.tsx`
  - Verify: Location, compensation, timing, remote options
- [ ] **Weights & Filters Sheet** - 🟡 Medium
  - Component: `WeightsFiltersSheet.tsx`
  - Verify: Adjust matching criteria weights, apply filters
- [ ] **PAC Score Explainer** - 🟡 Medium
  - Component: `PACScoreExplainer.tsx`
  - Verify: Modal explains PAC scoring, helpful visuals
- [ ] **Match Explainer Modal** - 🟡 Medium
  - Component: `MatchExplainerModal.tsx`
  - Verify: Why matched, skill alignment, gap analysis
- [ ] **Explain Panel** - 🟡 Medium
  - Component: `ExplainPanel.tsx`
  - Verify: Inline match reasoning, expandable details
- [ ] **Snooze Dialog** - 🟡 Medium
  - Component: `SnoozeDialog.tsx`
  - Verify: Select snooze duration, add reason, confirm
- [ ] **Snoozed Matches List** - 🟡 Medium
  - Path: `/src/app/app/i/matching/snoozed/page.tsx`
  - Component: `SnoozedMatchesList.tsx`
  - Verify: View snoozed matches, un-snooze option, expiry dates
- [ ] **Opportunities Page** - 🟠 High
  - Path: `/src/app/app/i/opportunities/page.tsx`
  - Verify: Active opportunities, status tracking, actions

### 💬 Messaging & Interviews

- [ ] **Messages Page** - 🔴 Critical
  - Path: `/src/app/app/i/messages/page.tsx`
  - Verify: Conversation list, unread indicators, search
- [ ] **Conversation List** - 🔴 Critical
  - Component: `ConversationList.tsx`
  - Verify: Recent conversations, timestamps, unread badges, click to open
- [ ] **Message Thread** - 🔴 Critical
  - Component: `MessageThread.tsx`
  - Verify: Message history, send new message, timestamps, sender display
- [ ] **Realtime Message Thread** - 🔴 Critical
  - Component: `RealtimeMessageThread.tsx`
  - Verify: Live updates, typing indicators, read receipts
- [ ] **Typing Indicator** - 🟡 Medium
  - Component: `TypingIndicator.tsx`
  - Verify: Shows when other party is typing, disappears appropriately
- [ ] **Read Receipt** - 🟡 Medium
  - Component: `ReadReceipt.tsx`
  - Verify: Message read status, timestamp
- [ ] **Interviews Page** - 🟠 High
  - Path: `/src/app/app/i/interviews/page.tsx`
  - Verify: Scheduled interviews, upcoming/past tabs, calendar view
- [ ] **Schedule Interview Button** - 🟠 High
  - Component: `ScheduleInterviewButton.tsx`
  - Verify: Opens scheduling modal, disabled when unavailable
- [ ] **Schedule Interview Modal** - 🟠 High
  - Component: `ScheduleInterviewModal.tsx`
  - Verify: Date/time picker, timezone, duration, attendees, confirmation
- [ ] **Meeting Link Generator** - 🟠 High
  - Component: `MeetingLinkGenerator.tsx`
  - Verify: Generate Zoom/Google Meet/Teams link, copy link, send invite

### 📊 Projects & Tasks

- [ ] **Projects Page** - 🟡 Medium
  - Path: `/src/app/app/i/projects/page.tsx`
  - Verify: Projects list, status filters, create new project
- [ ] **Project Detail Page** - 🟡 Medium
  - Path: `/src/app/app/i/projects/[id]/page.tsx`
  - Verify: Project overview, tasks, team members, updates

### ⚙️ Settings & Privacy

- [ ] **Settings Main Page** - 🟠 High
  - Path: `/src/app/app/i/settings/page.tsx`
  - Component: `SettingsContent.tsx`
  - Verify: Settings navigation, section tabs, save changes
- [ ] **Privacy Settings Page** - 🔴 Critical
  - Path: `/src/app/app/i/settings/privacy/page.tsx`
  - Component: `PrivacySettingsClient.tsx`
  - Verify: Data privacy controls, visibility settings, consent management
- [ ] **Privacy Overview** - 🟠 High
  - Component: `PrivacyOverview.tsx`
  - Verify: Privacy summary dashboard, quick actions
- [ ] **Visibility Settings Modal** - 🟠 High
  - Component: `VisibilitySettingsModal.tsx`
  - Verify: Field-level visibility, preview, save
- [ ] **Integrations Page** - 🟠 High
  - Path: `/src/app/app/i/settings/integrations/page.tsx`
  - Component: `IntegrationsClient.tsx`
  - Verify: Connected services, OAuth connections, disconnect options
- [ ] **LinkedIn Connect** - 🟠 High
  - Component: `LinkedInConnect.tsx`
  - Verify: OAuth flow, connection status, data import options
- [ ] **Notifications Settings** - 🟠 High
  - Path: `/src/app/app/i/settings/notifications/page.tsx`
  - Verify: Email/push preferences, notification types, frequency settings
- [ ] **Fairness Settings** - 🟡 Medium
  - Path: `/src/app/app/i/settings/fairness/page.tsx`
  - Component: `FairnessSettingsClient.tsx`
  - Verify: Demographic opt-in, fairness tracking preferences
- [ ] **Demographic Opt-In** - 🟡 Medium
  - Component: `DemographicOptIn.tsx`
  - Verify: Optional demographic data, privacy explanation, save
- [ ] **Delete Account** - 🟠 High
  - Component: `DeleteAccount.tsx`
  - Verify: Confirmation flow, data deletion warning, cancel option
- [ ] **Data Breakdown** - 🟡 Medium
  - Component: `DataBreakdown.tsx`
  - Verify: Shows what data is stored, download options
- [ ] **Data Import Button** - 🟡 Medium
  - Component: `DataImportButton.tsx`
  - Verify: Import from external sources, format validation
- [ ] **Enhanced Data Import Dialog** - 🟡 Medium
  - Component: `EnhancedDataImportDialog.tsx`
  - Verify: File upload, field mapping, preview, import confirmation
- [ ] **Audit Log Table** - 🟡 Medium
  - Component: `AuditLogTable.tsx`
  - Verify: Activity history, filters, export logs

### ✅ Verifications

- [ ] **Verifications Page** - 🟠 High
  - Path: `/src/app/app/i/verifications/page.tsx`
  - Component: `VerificationsClient.tsx`
  - Verify: Verification requests (incoming/outgoing), status tracking
- [ ] **Respond Dialog** - 🟠 High
  - Component: `/src/app/app/i/verifications/components/RespondDialog.tsx`
  - Verify: Accept/decline verification request, add comments
- [ ] **Verification Status** - 🟠 High
  - Component: `VerificationStatus.tsx`
  - Verify: Overall verification progress, badges earned
- [ ] **LinkedIn Verification** - 🟠 High
  - Component: `LinkedInVerification.tsx`
  - Verify: LinkedIn profile verification flow, status display
- [ ] **Work Email Verification Form** - 🟠 High
  - Component: `WorkEmailVerificationForm.tsx`
  - Verify: Email input, verification code sending, confirmation
- [ ] **Work Email Verification Page** - 🟠 High
  - Path: `/src/app/verify-work-email/page.tsx`
  - Verify: Email verification link landing, success/error states
- [ ] **Skill Verification Page** - 🟠 High
  - Path: `/src/app/verify-skill/page.tsx`
  - Verify: Skill endorsement link landing, verification confirmation
- [ ] **Veriff Verification** - 🟠 High
  - Component: `VeriffVerification.tsx`
  - Verify: Identity verification via Veriff, status tracking

### 🔔 Notifications

- [ ] **Notifications Page** - 🟠 High
  - Path: `/src/app/app/i/notifications/page.tsx`
  - Verify: Notification list, mark as read, filters, pagination
- [ ] **Notification Bell** - 🟠 High
  - Component: `NotificationBell.tsx`
  - Verify: Unread count badge, click to open dropdown
- [ ] **Notification Dropdown** - 🟠 High
  - Component: `NotificationDropdown.tsx`
  - Verify: Recent notifications, mark all read, view all link

### 🧘 Wellbeing & Zen Mode

- [ ] **Zen Mode Page** - 🟡 Medium
  - Path: `/src/app/app/i/zen/page.tsx`
  - Verify: Zen mode interface, ambient features, exit option
- [ ] **Wellbeing Components** - 🟡 Medium
  - Components in `/src/components/wellbeing/`
  - Verify: Check-in forms, reflections, trend tracking, self-assessment

### 🎨 UI & Navigation

- [ ] **Left Navigation** - 🔴 Critical
  - Component: `LeftNav.tsx`
  - Verify: Main menu items, active state, collapse/expand, responsive mobile
- [ ] **Top Bar** - 🔴 Critical
  - Component: `TopBar.tsx`
  - Verify: Search, notifications, profile dropdown, responsive layout
- [ ] **Individual Layout** - 🔴 Critical
  - Path: `/src/app/app/i/layout.tsx`
  - Verify: Consistent layout across all pages, navigation persistence

### 🎓 Onboarding Tour

- [ ] **Product Tour Components** - 🟡 Medium
  - Components in `/src/components/tour/`
  - Verify: Step-by-step tour, progress tracking, skip/complete options

---

## 🏢 ORGANIZATION USER FLOW

### 🚀 Organization Onboarding

- [ ] **Organization Onboarding** - 🔴 Critical
  - Component: `OrganizationSetup.tsx`
  - Verify: Org name, type, size, basic info, multi-step flow

### 🏠 Organization Dashboard

- [ ] **Organization Home** - 🔴 Critical
  - Path: `/src/app/app/o/[slug]/home/page.tsx`
  - Verify: Organization dashboard widgets, metrics, quick actions
- [ ] **Organization Layout** - 🔴 Critical
  - Path: `/src/app/app/o/[slug]/layout.tsx`
  - Verify: Org-specific navigation, context switching, permissions

### 👥 Team & Structure

- [ ] **Members Page** - 🟠 High
  - Path: `/src/app/app/o/[slug]/members/page.tsx`
  - Verify: Team member list, roles, invite members, remove members
- [ ] **Structure Manager** - 🟠 High
  - Component: `StructureManager.tsx`, `StructureManagerClient.tsx`
  - Verify: Org chart creation, department hierarchy, role management
- [ ] **Structure Tree** - 🟠 High
  - Component: `StructureTree.tsx`
  - Verify: Visual org chart, expand/collapse, edit nodes
- [ ] **Org Chart Viewer** - 🟡 Medium
  - Component: `OrgChartViewer.tsx`
  - Verify: Read-only org chart view, zoom, pan
- [ ] **Add Department Dialog** - 🟡 Medium
  - Component: `AddDepartmentDialog.tsx`
  - Verify: Department name, parent, manager assignment

### 📊 Organization Profile

- [ ] **Organization Profile Page** - 🔴 Critical
  - Path: `/src/app/app/o/[slug]/profile/page.tsx`
  - Verify: Complete org profile, edit sections, visibility settings
- [ ] **Basic Info Form** - 🟠 High
  - Component: `BasicInfoForm.tsx`
  - Verify: Organization details, industry, size, location
- [ ] **Causes Editor (Org)** - 🟡 Medium
  - Component: `CausesEditor.tsx`, `OrganizationCausesEditor.tsx`
  - Verify: Add/edit organizational causes, SDG alignment
- [ ] **Culture Editor** - 🟡 Medium
  - Component: `CultureEditor.tsx`
  - Verify: Culture description, values, work environment
- [ ] **Work Norms Form** - 🟡 Medium
  - Component: `WorkNormsForm.tsx`
  - Verify: Work hours, remote policy, meeting culture
- [ ] **Accessibility Commitments** - 🟡 Medium
  - Component: `AccessibilityCommitments.tsx`
  - Verify: Accessibility features, accommodations offered

### 🎯 Goals & Impact

- [ ] **Goals Manager** - 🟠 High
  - Component: `GoalsManager.tsx`
  - Verify: Create/edit/delete goals, track progress
- [ ] **Goal Card** - 🟡 Medium
  - Component: `GoalCard.tsx`
  - Verify: Goal display, progress bar, status
- [ ] **Goal Form** - 🟡 Medium
  - Component: `GoalForm.tsx`
  - Verify: Goal details, metrics, deadlines, owners
- [ ] **Goal Progress Chart** - 🟡 Medium
  - Component: `GoalProgressChart.tsx`
  - Verify: Visual progress tracking, historical data
- [ ] **Impact Dashboard** - 🟡 Medium
  - Component: `ImpactDashboard.tsx`
  - Verify: Impact metrics, charts, stories
- [ ] **Impact Entry Form** - 🟡 Medium
  - Component: `ImpactEntryForm.tsx`
  - Verify: Add impact stories, metrics, evidence
- [ ] **Impact Metrics Chart** - 🟡 Medium
  - Component: `ImpactMetricsChart.tsx`
  - Verify: Visual impact data, trends over time

### 🤝 Partnerships

- [ ] **Partnerships Manager** - 🟡 Medium
  - Component: `PartnershipsManager.tsx`
  - Verify: List partnerships, add/edit/delete
- [ ] **Partnership Card** - 🟡 Medium
  - Component: `PartnershipCard.tsx`
  - Verify: Partner details, relationship type, status
- [ ] **Partnership Form** - 🟡 Medium
  - Component: `PartnershipForm.tsx`
  - Verify: Partner info, collaboration details, save
- [ ] **Add Partnership Dialog** - 🟡 Medium
  - Component: `AddPartnershipDialog.tsx`
  - Verify: Quick add partner, validation

### 📁 Projects & Assignments

- [ ] **Projects Page (Org)** - 🟠 High
  - Path: `/src/app/app/o/[slug]/projects/page.tsx`
  - Verify: Organization projects list, create new, filters
- [ ] **Projects Manager** - 🟠 High
  - Component: `ProjectsManager.tsx`
  - Verify: Project management, team assignment, status tracking
- [ ] **Project Card** - 🟡 Medium
  - Component: `ProjectCard.tsx`
  - Verify: Project summary, progress, team members
- [ ] **Project Form** - 🟡 Medium
  - Component: `ProjectForm.tsx`
  - Verify: Project details, timeline, budget, team
- [ ] **Projects List** - 🟡 Medium
  - Component: `ProjectsList.tsx`
  - Verify: List view, sorting, pagination, search
- [ ] **Add Project Dialog** - 🟡 Medium
  - Component: `AddProjectDialog.tsx`
  - Verify: Quick create project form

### 📋 Assignment Management

- [ ] **Assignment Wizard** - 🔴 Critical
  - Component: `AssignmentWizard.tsx`
  - Verify: Multi-step assignment creation, skill requirements, budget
- [ ] **Assignment Manager** - 🟠 High
  - Component: `AssignmentManager.tsx`
  - Verify: View assignments, edit, publish/unpublish, archive
- [ ] **Assignment Builder V2** - 🟠 High
  - Component: `AssignmentBuilderV2.tsx`
  - Verify: Enhanced assignment creation, templates
- [ ] **New Assignment Page** - 🔴 Critical
  - Path: `/src/app/app/o/[slug]/assignments/new/page.tsx`
  - Verify: Assignment creation flow, validation, save as draft
- [ ] **Assignment Review Page** - 🟠 High
  - Path: `/src/app/app/o/[slug]/assignments/[id]/review/page.tsx`
  - Verify: Review candidates, shortlist, reject, feedback
- [ ] **Stakeholder Assignment Form** - 🟡 Medium
  - Component: `StakeholderAssignmentForm.tsx`
  - Verify: Assign internal stakeholders to assignment
- [ ] **Stakeholder Invite Dialog** - 🟡 Medium
  - Component: `StakeholderInviteDialog.tsx`
  - Verify: Invite external stakeholders, permissions
- [ ] **Assignment Token Page** - 🟠 High
  - Path: `/src/app/assign/[token]/page.tsx`
  - Verify: Assignment invitation link, accept/decline
- [ ] **Invitations Page** - 🟠 High
  - Path: `/src/app/app/o/[slug]/invitations/[token]/page.tsx`
  - Verify: Org invitation acceptance flow

### 🎯 Matching (Organization Side)

- [ ] **Organization Matching Page** - 🔴 Critical
  - Path: `/src/app/app/o/[slug]/matching/page.tsx`
  - Verify: Candidate matches, filters, review pipeline
- [ ] **Organization Matching View** - 🔴 Critical
  - Component: `MatchingOrganizationView.tsx`
  - Verify: Match cards for org, candidate details, PAC scores
- [ ] **Organization Matching Empty** - 🟡 Medium
  - Component: `OrganizationMatchingEmpty.tsx`
  - Verify: Empty state messaging, create assignment CTA

### 💼 Opportunities (Org)

- [ ] **Opportunities Page (Org)** - 🟠 High
  - Path: `/src/app/app/o/[slug]/opportunities/page.tsx`
  - Verify: Active assignments, candidate pipeline, status tracking

### 💬 Messaging & Interviews (Org)

- [ ] **Messages Page (Org)** - 🟠 High
  - Path: `/src/app/app/o/[slug]/messages/page.tsx`
  - Verify: Organization conversations, candidate communication
- [ ] **Interviews Page (Org)** - 🟠 High
  - Path: `/src/app/app/o/[slug]/interviews/page.tsx`
  - Verify: Scheduled candidate interviews, calendar view

### 🔒 Organization Privacy & Visibility

- [ ] **Organization Visibility Settings** - 🟠 High
  - Component: `OrganizationVisibilitySettings.tsx`
  - Verify: Control what's publicly visible, preview
- [ ] **Field Visibility Controls (Org)** - 🟠 High
  - Component: `FieldVisibilityControls.tsx`
  - Verify: Per-field privacy for org profile
- [ ] **Visibility Level Badge** - 🟡 Medium
  - Component: `VisibilityLevelBadge.tsx`
  - Verify: Shows visibility status (public/private/members)
- [ ] **Visibility Preview** - 🟡 Medium
  - Component: `VisibilityPreview.tsx`
  - Verify: Preview profile as different viewer types

### 📦 Evidence Pack

- [ ] **Evidence Pack Generator (Org)** - 🟡 Medium
  - Component: `EvidencePackGenerator.tsx`, `EvidencePackExport.tsx`
  - Verify: Generate comprehensive org evidence pack, download PDF

### ⚙️ Organization Settings

- [ ] **Organization Settings Page** - 🟠 High
  - Path: `/src/app/app/o/[slug]/settings/page.tsx`
  - Verify: Org-wide settings, billing, team permissions, integrations

### 🔍 Organization Not Found

- [ ] **Organization Not Found** - 🟡 Medium
  - Path: `/src/app/app/o/[slug]/not-found.tsx`
  - Verify: 404 handling, helpful error message

---

## 👨‍💼 ADMIN FLOW

### 🎛️ Admin Dashboard

- [ ] **Admin Dashboard Main** - 🔴 Critical
  - Path: `/src/app/admin/page.tsx`
  - Component: `AdminDashboard.tsx`
  - Verify: Platform metrics, user activity, system health, quick actions
- [ ] **Admin Metrics Page** - 🟠 High
  - Path: `/src/app/app/admin/metrics/page.tsx`
  - Component: `MetricsDashboard.tsx`
  - Verify: Detailed analytics, charts, export data

### ✅ Verification Reviews

- [ ] **Admin Verification Dashboard** - 🔴 Critical
  - Path: `/src/app/admin/verification/page.tsx`
  - Component: `AdminVerificationDashboard.tsx`
  - Verify: Pending verifications, review queue, approve/reject
- [ ] **Admin Review Modal** - 🔴 Critical
  - Component: `AdminReviewModal.tsx`
  - Verify: Detailed verification review, evidence viewing, decision making

### 🚨 Moderation

- [ ] **Moderation Queue** - 🟠 High
  - Component: `ModerationQueue.tsx`
  - Verify: Flagged content, user reports, moderation actions

### 📊 Fairness & Analytics

- [ ] **Fairness Dashboard** - 🟠 High
  - Component: `FairnessDashboard.tsx`
  - Verify: Demographic analytics, bias detection, fairness metrics
- [ ] **Fairness Note Card** - 🟡 Medium
  - Component: `FairnessNoteCard.tsx`
  - Verify: Individual fairness note display
- [ ] **Fairness Note Dashboard** - 🟡 Medium
  - Component: `FairnessNoteDashboard.tsx`
  - Verify: Aggregate fairness tracking
- [ ] **Admin Analytics** - 🟠 High
  - Component: `/src/components/admin/analytics/*`
  - Verify: Platform-wide analytics, growth metrics, engagement

### 🚫 Error & Access Pages

- [ ] **403 Forbidden Page** - 🟡 Medium
  - Path: `/src/app/403/page.tsx`
  - Verify: Access denied message, helpful navigation

---

# 🎯 VIEW 2: BY FEATURE AREA

## 🔐 Authentication & Security

- [ ] **Login System** - 🔴 Critical
  - Components: `SignIn.tsx`, social sign-in buttons
  - Pages: Login, signup, verify email, password reset
  - Verify: Email auth, OAuth (Google, LinkedIn), session management
- [ ] **Email Verification Flow** - 🔴 Critical
  - Verify: Email sending, link validation, account activation
- [ ] **Password Management** - 🟠 High
  - Verify: Reset flow, strength validation, secure storage
- [ ] **Session & Tokens** - 🔴 Critical
  - Verify: JWT tokens, CSRF protection, secure cookies

## 👨‍💼 Profile Management

- [ ] **Individual Profiles** - 🔴 Critical
  - Components: Profile view, edit, forms, cards, editors
  - Verify: Complete profile CRUD, image uploads, field validation
- [ ] **Organization Profiles** - 🔴 Critical
  - Components: Org profile, structure, culture, impact
  - Verify: Org data management, team hierarchy, public visibility
- [ ] **Profile Completeness** - 🟠 High
  - Verify: Progress tracking, required fields, suggestions
- [ ] **Empty States** - 🟡 Medium
  - Verify: Helpful onboarding for new profiles

## 🎯 Expertise & Skills

- [ ] **Expertise Atlas (20K Skills)** - 🔴 Critical
  - Components: L1 Grid, L2 Modal, L4 Cards, skill management
  - Verify: Taxonomy navigation, skill CRUD, verification integration
- [ ] **Skill Widgets & Analytics** - 🟡 Medium
  - Components: Skill wheel, heatmap, credibility pie, scatter plots
  - Verify: Data visualization, interactivity, accuracy
- [ ] **Gap Analysis** - 🟠 High
  - Components: GapMap, recommendations
  - Verify: Job market comparison, skill suggestions
- [ ] **CV/JD Import** - 🟠 High
  - Components: Auto-suggest, LinkedIn import
  - Verify: File parsing, skill extraction, AI assistance

## 🤝 Matching System

- [ ] **Individual Matching** - 🔴 Critical
  - Components: Match cards, filters, profile setup
  - Pages: Matching main, snoozed matches
  - Verify: PAC scoring, interest expression, match quality
- [ ] **Organization Matching** - 🔴 Critical
  - Components: Org matching view, candidate pipeline
  - Verify: Assignment matching, shortlisting, rejection flow
- [ ] **Match Filtering & Weights** - 🟠 High
  - Components: Enhanced filters, weights sheet
  - Verify: Filter functionality, weight adjustments, real-time updates
- [ ] **Match Explainability** - 🟡 Medium
  - Components: Explainer modal, PAC score breakdown
  - Verify: Clear reasoning, skill alignment visualization
- [ ] **Snoozing System** - 🟡 Medium
  - Components: Snooze dialog, snoozed list
  - Verify: Snooze durations, reminders, un-snooze

## 📋 Projects & Assignments

- [ ] **Assignment Creation** - 🔴 Critical
  - Components: Assignment wizard, builder, forms
  - Verify: Multi-step flow, skill requirements, validation
- [ ] **Assignment Management** - 🟠 High
  - Components: Assignment manager, review page
  - Verify: Draft/publish, edit, archive, candidate pipeline
- [ ] **Stakeholder Management** - 🟡 Medium
  - Components: Stakeholder forms, invite dialogs
  - Verify: Internal/external stakeholders, permissions
- [ ] **Projects (Individual)** - 🟡 Medium
  - Pages: Projects list, project detail
  - Verify: Project tracking, updates, completion
- [ ] **Projects (Organization)** - 🟠 High
  - Components: Projects manager, cards, forms
  - Verify: Project CRUD, team assignment, progress tracking

## 💬 Messaging & Communication

- [ ] **Messaging System** - 🔴 Critical
  - Components: Conversation list, message thread, realtime thread
  - Verify: Message sending, real-time updates, read receipts
- [ ] **Typing Indicators** - 🟡 Medium
  - Verify: Real-time typing status, performance
- [ ] **Conversation Management** - 🟠 High
  - Verify: Search conversations, archive, unread tracking

## 📅 Interviews & Scheduling

- [ ] **Interview Scheduling** - 🟠 High
  - Components: Schedule button, modal, meeting link generator
  - Verify: Calendar integration, timezone handling, video links
- [ ] **Interview Management** - 🟠 High
  - Pages: Interviews page (individual & org)
  - Verify: Upcoming/past views, reschedule, cancel, join meeting

## 🏢 Organization Management

- [ ] **Organization Structure** - 🟠 High
  - Components: Structure manager, org chart, departments
  - Verify: Hierarchy creation, role management, visual tree
- [ ] **Team Management** - 🟠 High
  - Pages: Members page
  - Verify: Invite members, roles, permissions, remove members
- [ ] **Organization Goals** - 🟡 Medium
  - Components: Goals manager, goal cards, progress charts
  - Verify: Goal CRUD, progress tracking, metrics
- [ ] **Organization Impact** - 🟡 Medium
  - Components: Impact dashboard, entry forms, metrics charts
  - Verify: Impact stories, metrics, visualizations
- [ ] **Partnerships** - 🟡 Medium
  - Components: Partnership manager, cards, forms
  - Verify: Partnership CRUD, relationship tracking
- [ ] **Organization Culture** - 🟡 Medium
  - Components: Culture editor, work norms, accessibility
  - Verify: Culture description, values, work policies

## ✅ Verifications

- [ ] **Skill Verifications** - 🟠 High
  - Pages: Verifications page, respond dialog
  - Verify: Request/respond flow, status tracking, notifications
- [ ] **Identity Verification** - 🟠 High
  - Component: Veriff verification
  - Verify: ID verification flow, status updates, security
- [ ] **Work Email Verification** - 🟠 High
  - Component: Work email form, verification page
  - Verify: Email validation, code sending, confirmation
- [ ] **LinkedIn Verification** - 🟠 High
  - Component: LinkedIn verification
  - Verify: OAuth connection, profile import, verification status
- [ ] **Verification Status Display** - 🟡 Medium
  - Component: Verification status, badges
  - Verify: Status indicators, credibility display

## 🔒 Settings & Privacy

- [ ] **Privacy Controls** - 🔴 Critical
  - Components: Privacy settings, field visibility controls
  - Pages: Privacy settings page
  - Verify: Granular visibility, GDPR compliance, consent management
- [ ] **Data Management** - 🟠 High
  - Components: Data breakdown, import/export, audit log
  - Verify: Data portability, deletion, audit trail
- [ ] **Account Settings** - 🟠 High
  - Components: Settings content, delete account
  - Verify: Account preferences, deletion flow, data retention
- [ ] **Integrations** - 🟠 High
  - Pages: Integrations settings
  - Components: LinkedIn connect, OAuth connections
  - Verify: Connect/disconnect services, data sync
- [ ] **Notification Preferences** - 🟠 High
  - Pages: Notification settings
  - Verify: Email/push preferences, frequency, categories
- [ ] **Fairness Settings** - 🟡 Medium
  - Pages: Fairness settings
  - Components: Demographic opt-in
  - Verify: Optional demographic data, transparency

## 🔔 Notifications

- [ ] **Notification System** - 🟠 High
  - Components: Notification bell, dropdown
  - Pages: Notifications page
  - Verify: Real-time alerts, mark as read, navigation to source
- [ ] **Notification Types** - 🟠 High
  - Verify: Match notifications, message alerts, verification requests, system updates

## 🎨 Dashboard & Widgets

- [ ] **Customizable Dashboard** - 🔴 Critical
  - Components: Customizable dashboard, draggable dashboard
  - Verify: Widget add/remove, drag-and-drop, layout persistence
- [ ] **Dashboard Widgets** - 🟠 High
  - Components: All widget cards (explore, goals, projects, tasks, etc.)
  - Verify: Data accuracy, click interactions, responsive layout
- [ ] **Widget Customization** - 🟡 Medium
  - Component: Customize modal
  - Verify: Widget settings, personalization options

## 📊 Analytics & Wellbeing

- [ ] **Fairness Analytics** - 🟠 High
  - Components: Fairness dashboard, fairness note cards
  - Verify: Demographic tracking (opt-in), bias detection, reporting
- [ ] **Platform Metrics** - 🟠 High
  - Component: Metrics dashboard
  - Verify: Admin-level analytics, growth metrics, engagement
- [ ] **Wellbeing Features** - 🟡 Medium
  - Components: Wellbeing check-ins, reflections, trends
  - Verify: Self-assessment, mental health tracking, privacy
- [ ] **Zen Mode** - 🟡 Medium
  - Pages: Zen mode page
  - Components: Zen interface
  - Verify: Distraction-free mode, ambient features

## 🎓 Onboarding & Tours

- [ ] **User Onboarding** - 🔴 Critical
  - Pages: Onboarding page
  - Components: Persona choice, individual/org setup
  - Verify: Multi-step flow, data collection, skip options
- [ ] **Product Tours** - 🟡 Medium
  - Components: Tour components
  - Verify: Step-by-step guidance, progress tracking, dismiss

## 📝 Feedback & Moderation

- [ ] **Feedback System** - 🟡 Medium
  - Component: Why not shortlisted feedback
  - Verify: Candidate feedback collection, organization responses
- [ ] **Moderation Queue** - 🟠 High
  - Component: Moderation queue
  - Verify: Flagged content, user reports, moderation actions, appeal flow

## 🎨 UI Components & Design System

- [ ] **Brand Components** - 🟡 Medium
  - Components: Logo, network background
  - Verify: Consistent branding, responsive graphics
- [ ] **Landing Page** - 🟠 High
  - Component: ProofoundLanding, landing components
  - Verify: Hero section, CTA buttons, responsive design, navigation
- [ ] **Navigation Components** - 🔴 Critical
  - Components: LeftNav, TopBar, layouts
  - Verify: Consistent navigation, mobile menu, search, dropdowns
- [ ] **Error Handling** - 🟡 Medium
  - Components: ErrorBoundary, 403 page, not-found pages
  - Verify: Graceful error display, helpful messaging, navigation options
- [ ] **UI Library (shadcn)** - 🟠 High
  - Components: All UI components (button, dialog, card, etc.)
  - Verify: Consistent styling, accessibility, interactions

---

# 🧩 VIEW 3: BY COMPONENT TYPE

## 📄 PAGES (Routes)

### Authentication Pages

- [ ] `/src/app/(auth)/login/page.tsx` - 🔴 Critical
- [ ] `/src/app/(auth)/signup/page.tsx` - 🔴 Critical
- [ ] `/src/app/(auth)/verify-email/page.tsx` - 🔴 Critical
- [ ] `/src/app/(auth)/reset-password/page.tsx` - 🟠 High
- [ ] `/src/app/(auth)/reset-password/confirm/page.tsx` - 🟠 High

### Public Pages

- [ ] `/src/app/page.tsx` (Landing) - 🟠 High
- [ ] `/src/app/privacy/page.tsx` - 🟠 High
- [ ] `/src/app/terms/page.tsx` - 🟠 High
- [ ] `/src/app/onboarding/page.tsx` - 🔴 Critical

### Individual User Pages

- [ ] `/src/app/app/i/home/page.tsx` - 🔴 Critical
- [ ] `/src/app/app/i/profile/page.tsx` - 🔴 Critical
- [ ] `/src/app/app/i/expertise/page.tsx` - 🔴 Critical
- [ ] `/src/app/app/i/matching/page.tsx` - 🔴 Critical
- [ ] `/src/app/app/i/matching/snoozed/page.tsx` - 🟡 Medium
- [ ] `/src/app/app/i/messages/page.tsx` - 🔴 Critical
- [ ] `/src/app/app/i/notifications/page.tsx` - 🟠 High
- [ ] `/src/app/app/i/opportunities/page.tsx` - 🟠 High
- [ ] `/src/app/app/i/interviews/page.tsx` - 🟠 High
- [ ] `/src/app/app/i/projects/page.tsx` - 🟡 Medium
- [ ] `/src/app/app/i/projects/[id]/page.tsx` - 🟡 Medium
- [ ] `/src/app/app/i/verifications/page.tsx` - 🟠 High
- [ ] `/src/app/app/i/zen/page.tsx` - 🟡 Medium
- [ ] `/src/app/app/i/settings/page.tsx` - 🟠 High
- [ ] `/src/app/app/i/settings/privacy/page.tsx` - 🔴 Critical
- [ ] `/src/app/app/i/settings/integrations/page.tsx` - 🟠 High
- [ ] `/src/app/app/i/settings/notifications/page.tsx` - 🟠 High
- [ ] `/src/app/app/i/settings/fairness/page.tsx` - 🟡 Medium

### Organization Pages

- [ ] `/src/app/app/o/[slug]/home/page.tsx` - 🔴 Critical
- [ ] `/src/app/app/o/[slug]/profile/page.tsx` - 🔴 Critical
- [ ] `/src/app/app/o/[slug]/members/page.tsx` - 🟠 High
- [ ] `/src/app/app/o/[slug]/projects/page.tsx` - 🟠 High
- [ ] `/src/app/app/o/[slug]/assignments/new/page.tsx` - 🔴 Critical
- [ ] `/src/app/app/o/[slug]/assignments/[id]/review/page.tsx` - 🟠 High
- [ ] `/src/app/app/o/[slug]/matching/page.tsx` - 🔴 Critical
- [ ] `/src/app/app/o/[slug]/opportunities/page.tsx` - 🟠 High
- [ ] `/src/app/app/o/[slug]/messages/page.tsx` - 🟠 High
- [ ] `/src/app/app/o/[slug]/interviews/page.tsx` - 🟠 High
- [ ] `/src/app/app/o/[slug]/invitations/[token]/page.tsx` - 🟠 High
- [ ] `/src/app/app/o/[slug]/settings/page.tsx` - 🟠 High

### Admin Pages

- [ ] `/src/app/admin/page.tsx` - 🔴 Critical
- [ ] `/src/app/admin/verification/page.tsx` - 🔴 Critical
- [ ] `/src/app/app/admin/metrics/page.tsx` - 🟠 High

### Special Pages

- [ ] `/src/app/403/page.tsx` - 🟡 Medium
- [ ] `/src/app/not-found.tsx` - 🟡 Medium
- [ ] `/src/app/error.tsx` - 🟡 Medium
- [ ] `/src/app/verify-skill/page.tsx` - 🟠 High
- [ ] `/src/app/verify-work-email/page.tsx` - 🟠 High
- [ ] `/src/app/assign/[token]/page.tsx` - 🟠 High

### Layout Pages

- [ ] `/src/app/layout.tsx` (Root layout) - 🔴 Critical
- [ ] `/src/app/app/i/layout.tsx` (Individual layout) - 🔴 Critical
- [ ] `/src/app/app/o/[slug]/layout.tsx` (Org layout) - 🔴 Critical

---

## 🧱 COMPONENTS

### Admin Components

- [ ] `AdminDashboard.tsx` - 🔴 Critical
- [ ] `AdminVerificationDashboard.tsx` - 🔴 Critical
- [ ] `AdminReviewModal.tsx` - 🔴 Critical
- [ ] `FairnessDashboard.tsx` - 🟠 High
- [ ] `ModerationQueue.tsx` - 🟠 High

### Analytics Components

- [ ] `FairnessNoteCard.tsx` - 🟡 Medium
- [ ] `FairnessNoteDashboard.tsx` - 🟡 Medium

### App Navigation

- [ ] `LeftNav.tsx` - 🔴 Critical
- [ ] `TopBar.tsx` - 🔴 Critical

### Assignment Components

- [ ] `AssignmentManager.tsx` - 🟠 High
- [ ] `AssignmentWizard.tsx` - 🔴 Critical
- [ ] `AssignmentBuilderV2.tsx` - 🟠 High
- [ ] `StakeholderAssignmentForm.tsx` - 🟡 Medium
- [ ] `StakeholderInviteDialog.tsx` - 🟡 Medium

### Authentication Components

- [ ] `SignIn.tsx` - 🔴 Critical
- [ ] `SignupForm.tsx` - 🔴 Critical
- [ ] `social-sign-in-buttons.tsx` - 🔴 Critical

### Brand Components

- [ ] `Logo.tsx` - 🟡 Medium
- [ ] `NetworkBackground.tsx` - 🟡 Medium

### Dashboard Components

- [ ] `CustomizableDashboard.tsx` - 🔴 Critical
- [ ] `DraggableDashboard.tsx` - 🔴 Critical
- [ ] `CustomizeModal.tsx` - 🟡 Medium
- [ ] `ExploreCard.tsx` - 🟠 High
- [ ] `GoalsCard.tsx` - 🟠 High
- [ ] `ProjectsCard.tsx` - 🟠 High
- [ ] `TasksCard.tsx` - 🟠 High
- [ ] `WhileAwayCard.tsx` - 🟡 Medium
- [ ] `MatchingResultsCard.tsx` - 🟠 High
- [ ] `ImpactSnapshotCard.tsx` - 🟡 Medium
- [ ] `TeamRolesCard.tsx` - 🟡 Medium
- [ ] `GapMapWidget.tsx` - 🟠 High
- [ ] `NextBestActionsWidget.tsx` - 🟠 High

### Expertise Components

- [ ] `ExpertiseAtlasClient.tsx` - 🔴 Critical
- [ ] `L1Grid.tsx` - 🔴 Critical
- [ ] `L2Modal.tsx` - 🔴 Critical
- [ ] `L4Card.tsx` - 🔴 Critical
- [ ] `AddSkillDrawer.tsx` - 🟠 High
- [ ] `EditSkillWindow.tsx` - 🟠 High
- [ ] `SkillsSideSheet.tsx` - 🟡 Medium
- [ ] `DashboardFilters.tsx` - 🟡 Medium
- [ ] `EmptyState.tsx` - 🟡 Medium
- [ ] `AboutSection.tsx` - 🟡 Medium
- [ ] `CVJDAutoSuggest.tsx` - 🟠 High
- [ ] `GapMap.tsx` - 🟠 High
- [ ] `LinkedInImportModal.tsx` - 🟠 High
- [ ] `ModeSelector.tsx` - 🟡 Medium

### Expertise Widgets

- [ ] `SkillWheel.tsx` - 🟡 Medium
- [ ] `CoverageHeatmap.tsx` - 🟡 Medium
- [ ] `CredibilityPie.tsx` - 🟡 Medium
- [ ] `RecencyScatter.tsx` - 🟡 Medium
- [ ] `RelevanceBars.tsx` - 🟡 Medium
- [ ] `VerificationSourcesPie.tsx` - 🟡 Medium
- [ ] `NextBestActions.tsx` (Expertise) - 🟠 High

### Feedback Components

- [ ] `WhyNotShortlisted.tsx` - 🟡 Medium

### Interview Components

- [ ] `MeetingLinkGenerator.tsx` - 🟠 High
- [ ] `ScheduleInterviewButton.tsx` - 🟠 High
- [ ] `ScheduleInterviewModal.tsx` - 🟠 High

### Landing Components

- [ ] `ProofoundLanding.tsx` - 🟠 High
- [ ] `Header.tsx` - 🟠 High
- [ ] `ProgressBar.tsx` - 🟡 Medium
- [ ] `StickyCTA.tsx` - 🟡 Medium

### Matching Components

- [ ] `MatchResultCard.tsx` - 🔴 Critical
- [ ] `MatchingProfileSetup.tsx` - 🟠 High
- [ ] `MatchingOrganizationView.tsx` - 🔴 Critical
- [ ] `IndividualMatchingEmpty.tsx` - 🟡 Medium
- [ ] `OrganizationMatchingEmpty.tsx` - 🟡 Medium
- [ ] `EnhancedMatchFilters.tsx` - 🟠 High
- [ ] `WeightsFiltersSheet.tsx` - 🟡 Medium
- [ ] `PACScoreExplainer.tsx` - 🟡 Medium
- [ ] `MatchExplainerModal.tsx` - 🟡 Medium
- [ ] `ExplainPanel.tsx` - 🟡 Medium
- [ ] `SnoozeDialog.tsx` - 🟡 Medium
- [ ] `SnoozedMatchesList.tsx` - 🟡 Medium
- [ ] `AssignmentBuilder.tsx` - 🟠 High
- [ ] `CEFRLanguageRow.tsx` - 🟡 Medium
- [ ] `CompensationInput.tsx` - 🟡 Medium
- [ ] `DateWindowInput.tsx` - 🟡 Medium
- [ ] `LocationInput.tsx` - 🟡 Medium
- [ ] `SkillLevelRow.tsx` - 🟡 Medium
- [ ] `TypeaheadChips.tsx` - 🟡 Medium

### Messaging Components

- [ ] `ConversationList.tsx` - 🔴 Critical
- [ ] `MessageThread.tsx` - 🔴 Critical
- [ ] `RealtimeMessageThread.tsx` - 🔴 Critical
- [ ] `TypingIndicator.tsx` - 🟡 Medium
- [ ] `ReadReceipt.tsx` - 🟡 Medium

### Metrics Components

- [ ] `MetricsDashboard.tsx` - 🟠 High

### Notification Components

- [ ] `NotificationBell.tsx` - 🟠 High
- [ ] `NotificationDropdown.tsx` - 🟠 High

### Onboarding Components

- [ ] `OnboardingClient.tsx` - 🔴 Critical
- [ ] `PersonaChoice.tsx` - 🔴 Critical
- [ ] `IndividualSetup.tsx` - 🔴 Critical
- [ ] `OrganizationSetup.tsx` - 🔴 Critical

### Organization Components

- [ ] `BasicInfoForm.tsx` - 🟠 High
- [ ] `StructureManager.tsx` - 🟠 High
- [ ] `StructureManagerClient.tsx` - 🟠 High
- [ ] `StructureTree.tsx` - 🟠 High
- [ ] `OrgChartViewer.tsx` - 🟡 Medium
- [ ] `AddDepartmentDialog.tsx` - 🟡 Medium
- [ ] `CausesEditor.tsx` - 🟡 Medium
- [ ] `OrganizationCausesEditor.tsx` - 🟡 Medium
- [ ] `CultureEditor.tsx` - 🟡 Medium
- [ ] `WorkNormsForm.tsx` - 🟡 Medium
- [ ] `AccessibilityCommitments.tsx` - 🟡 Medium
- [ ] `GoalsManager.tsx` - 🟠 High
- [ ] `GoalCard.tsx` - 🟡 Medium
- [ ] `GoalForm.tsx` - 🟡 Medium
- [ ] `GoalProgressChart.tsx` - 🟡 Medium
- [ ] `ImpactDashboard.tsx` - 🟡 Medium
- [ ] `ImpactEntryForm.tsx` - 🟡 Medium
- [ ] `ImpactMetricsChart.tsx` - 🟡 Medium
- [ ] `PartnershipsManager.tsx` - 🟡 Medium
- [ ] `PartnershipCard.tsx` - 🟡 Medium
- [ ] `PartnershipForm.tsx` - 🟡 Medium
- [ ] `AddPartnershipDialog.tsx` - 🟡 Medium
- [ ] `ProjectsManager.tsx` - 🟠 High
- [ ] `ProjectCard.tsx` - 🟡 Medium
- [ ] `ProjectForm.tsx` - 🟡 Medium
- [ ] `ProjectsList.tsx` - 🟡 Medium
- [ ] `AddProjectDialog.tsx` - 🟡 Medium
- [ ] `OrganizationVisibilitySettings.tsx` - 🟠 High
- [ ] `VisibilityLevelBadge.tsx` - 🟡 Medium
- [ ] `VisibilityPreview.tsx` - 🟡 Medium
- [ ] `EvidencePackGenerator.tsx` (Org) - 🟡 Medium
- [ ] `EvidencePackExport.tsx` - 🟡 Medium
- [ ] `EmptyOrganizationProfileView.tsx` - 🟡 Medium

### Privacy Components

- [ ] `FieldVisibilityControls.tsx` - 🟠 High
- [ ] `VisibilitySettingsModal.tsx` - 🟠 High

### Profile Components

- [ ] `ProfileView.tsx` - 🔴 Critical
- [ ] `EditableProfileView.tsx` - 🔴 Critical
- [ ] `EditProfileModal.tsx` - 🟠 High
- [ ] `AvatarUpload.tsx` - 🟠 High
- [ ] `CoverUpload.tsx` - 🟡 Medium
- [ ] `EmptyProfileStateView.tsx` - 🟡 Medium
- [ ] `SkillsCard.tsx` - 🟠 High
- [ ] `SkillsEditor.tsx` - 🟠 High
- [ ] `CausesCard.tsx` - 🟡 Medium
- [ ] `CausesEditor.tsx` (Individual) - 🟡 Medium
- [ ] `MissionCard.tsx` - 🟡 Medium
- [ ] `MissionEditor.tsx` - 🟡 Medium
- [ ] `VisionCard.tsx` - 🟡 Medium
- [ ] `VisionEditor.tsx` - 🟡 Medium
- [ ] `ValuesCard.tsx` - 🟡 Medium
- [ ] `ValuesEditor.tsx` - 🟡 Medium
- [ ] `IndividualFieldVisibilityControls.tsx` - 🟠 High
- [ ] `RedactedField.tsx` - 🟠 High

### Profile Form Components

- [ ] `ExperienceForm.tsx` - 🟠 High
- [ ] `EducationForm.tsx` - 🟠 High
- [ ] `ProjectForm.tsx` (Profile) - 🟡 Medium
- [ ] `ImpactStoryForm.tsx` - 🟡 Medium
- [ ] `VolunteerForm.tsx` - 🟡 Medium

### Settings Components

- [ ] `SettingsContent.tsx` - 🟠 High
- [ ] `PrivacySettingsClient.tsx` - 🔴 Critical
- [ ] `PrivacyOverview.tsx` - 🟠 High
- [ ] `IntegrationsClient.tsx` - 🟠 High
- [ ] `LinkedInConnect.tsx` - 🟠 High
- [ ] `FairnessSettingsClient.tsx` - 🟡 Medium
- [ ] `DemographicOptIn.tsx` - 🟡 Medium
- [ ] `DeleteAccount.tsx` - 🟠 High
- [ ] `DataBreakdown.tsx` - 🟡 Medium
- [ ] `DataImportButton.tsx` - 🟡 Medium
- [ ] `EnhancedDataImportDialog.tsx` - 🟡 Medium
- [ ] `AuditLogTable.tsx` - 🟡 Medium
- [ ] `LinkedInVerification.tsx` - 🟠 High
- [ ] `VeriffVerification.tsx` - 🟠 High
- [ ] `VerificationStatus.tsx` - 🟠 High
- [ ] `WorkEmailVerificationForm.tsx` - 🟠 High

### Tour Components

- [ ] Tour components (in `/src/components/tour/`) - 🟡 Medium

### UI Components (shadcn/ui)

- [ ] All UI library components in `/src/components/ui/` - 🟠 High
  - Button, Card, Dialog, Input, Select, Checkbox, etc.
  - Verify: Consistent styling, accessibility, keyboard navigation

### Verification Components

- [ ] `VerificationsClient.tsx` - 🟠 High
- [ ] `RespondDialog.tsx` - 🟠 High

### Wellbeing Components

- [ ] Wellbeing components (in `/src/components/wellbeing/`) - 🟡 Medium

### Zen Components

- [ ] Zen components (in `/src/components/zen/`) - 🟡 Medium

### Other Components

- [ ] `ErrorBoundary.tsx` - 🟡 Medium
- [ ] `ComingSoon.tsx` - 🟡 Medium

---

## 🔌 API ROUTES (Reference Only - Testing via UI)

### Admin APIs

- `/api/admin/*` - Verification, moderation, analytics, fairness metrics

### Analytics APIs

- `/api/analytics/*` - Tracking, fairness notes, demographic opt-in

### Assignment APIs

- `/api/assignments/*` - CRUD, pipeline, outcomes, expertise matrix

### Auth APIs

- `/api/auth/*` - OAuth callbacks (Google, LinkedIn, Zoom)

### Contract APIs

- `/api/contracts/*` - Contract management

### Conversation APIs

- `/api/conversations/*` - Messaging

### Core APIs

- `/api/core/matching/*` - Matching engine, profiles, interests

### Cron APIs

- `/api/cron/*` - Background jobs, SLA enforcement, deletions

### Dashboard APIs

- `/api/dashboard/*` - Layout persistence

### Data APIs

- `/api/data-export/*`, `/api/data-import/*` - Data portability

### Evidence Pack APIs

- `/api/evidence-pack/*` - PDF generation

### Expertise APIs

- `/api/expertise/*` - Skills, taxonomy, verifications, LinkedIn import

### Feedback APIs

- `/api/feedback/*` - Candidate feedback

### Integration APIs

- `/api/integrations/*` - External service connections

### Interview APIs

- `/api/interviews/*` - Scheduling

### Match APIs

- `/api/match/*` - Matching, decisions, interest, snooze

### Matching Profile APIs

- `/api/matching-profile/*` - Matching preferences

### Message APIs

- `/api/messages/*` - Messaging

### Metrics APIs

- `/api/metrics/*` - Platform metrics

### Moderation APIs

- `/api/moderation/*` - Content moderation

### Notification APIs

- `/api/notifications/*` - Notifications, preferences

### Organization APIs

- `/api/organizations/*` - Org management, structure, goals, projects

### Profile APIs

- `/api/profile/*`, `/api/profiles/*` - Profile management

### Project APIs

- `/api/projects/*` - Project management

### Taxonomy APIs

- `/api/taxonomy/*` - Skill taxonomy

### Update APIs

- `/api/updates/*` - Activity updates

### Upload APIs

- `/api/upload/*` - File uploads (avatar, cover, documents)

### User APIs

- `/api/user/*` - User account, privacy, consent, export

### Verification APIs

- `/api/verification/*` - All verification types

### Wellbeing APIs

- `/api/wellbeing/*` - Wellbeing check-ins, assessments

---

# ✅ TESTING COMPLETION CHECKLIST

## Summary Statistics

- **Total Items to Test:** ~250 items
- **Critical Priority:** ~50 items
- **High Priority:** ~100 items
- **Medium Priority:** ~75 items
- **Low Priority:** ~25 items

## Testing Guidelines

### For Each Item:

1. **Responsive Design**
   - Test on mobile (375px)
   - Test on tablet (768px)
   - Test on desktop (1440px)
   - Check touch interactions on mobile

2. **Database Connection**
   - Data loads correctly from Supabase
   - Create operations save to database
   - Update operations persist changes
   - Delete operations remove data
   - Error handling for failed operations

3. **UI/UX Quality**
   - Clean, professional design
   - Intuitive user flow
   - Proper loading states
   - Helpful error messages
   - Accessibility (keyboard navigation, screen readers)

4. **Functionality**
   - All buttons work
   - Forms validate properly
   - Navigation functions correctly
   - Modals open/close
   - Dropdowns expand/collapse

5. **Performance**
   - Page loads < 3 seconds
   - Smooth animations (60fps)
   - No lag on interactions
   - Optimized images
   - Efficient database queries

## Recommended Testing Approach

### Phase 1: Critical Path (Days 1-3)

Test all 🔴 Critical items first:

- Authentication flow
- Individual dashboard & profile
- Expertise Atlas
- Matching system
- Organization dashboard
- Admin dashboard

### Phase 2: Core Features (Days 4-7)

Test all 🟠 High priority items:

- Messaging & interviews
- Settings & privacy
- Verifications
- Projects & assignments
- Organization management

### Phase 3: Enhanced Features (Days 8-12)

Test all 🟡 Medium priority items:

- Widgets & analytics
- Wellbeing features
- Secondary org features
- Enhanced UX components

### Phase 4: Polish (Days 13-14)

Test all 🟢 Low priority items:

- Nice-to-have features
- Edge cases
- Performance optimization

---

## 📝 Notes for Agents

- **Mark items as complete** by checking the box ✅
- **Document any bugs** found during testing
- **Take screenshots** of responsive design at different breakpoints
- **Record performance metrics** (load times, animation fps)
- **Test with real data** from the database, not just mock data
- **Test edge cases**: empty states, error states, loading states
- **Verify GDPR compliance** for all privacy-related features
- **Check accessibility** with keyboard-only navigation and screen readers

---

**Document Version:** 1.0  
**Last Updated:** November 4, 2025  
**Platform:** Proofound - Talent Matching & Expertise Management  
**Status:** Ready for QA Testing
