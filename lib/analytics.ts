// Analytics event tracking for Proofound MVP
// Privacy-first analytics with user consent and anonymization options

import { createClient } from "@/lib/supabase/client";
import type { AnalyticsEventInsert } from "@/types";

// Generate or retrieve session ID
function getSessionId(): string {
  if (typeof window === "undefined") return "";
  
  let sessionId = sessionStorage.getItem("proofound_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("proofound_session_id", sessionId);
  }
  return sessionId;
}

// Check if analytics is enabled (respects user privacy settings)
async function isAnalyticsEnabled(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return true; // Track anonymous events
    
    // Check user's privacy settings
    const { data: profile } = await supabase
      .from('profiles')
      .select('field_visibility')
      .eq('id', user.id)
      .single();
    
    // Respect opt-out preference
    const visibility = profile?.field_visibility as any;
    return visibility?.analytics !== false;
  } catch {
    return true; // Default to enabled if can't check
  }
}

// Core tracking function
export async function trackEvent(
  eventName: string,
  properties?: Record<string, any>,
  eventCategory?: string
) {
  try {
    // Check if analytics is enabled
    const enabled = await isAnalyticsEnabled();
    if (!enabled) return;

    const supabase = createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get browser context
    const userAgent = typeof window !== "undefined" ? window.navigator.userAgent : null;
    const referrer = typeof window !== "undefined" ? document.referrer : null;
    const sessionId = getSessionId();
    
    const event: AnalyticsEventInsert = {
      event_name: eventName,
      event_category: eventCategory,
      user_id: user?.id,
      properties: properties || null,
      user_agent: userAgent,
      referrer: referrer,
      session_id: sessionId,
    };
    
    const { error } = await supabase
      .from("analytics_events")
      .insert(event);
    
    if (error) {
      console.error("Analytics tracking error:", error);
    }
  } catch (error) {
    // Fail silently - don't disrupt user experience
    console.error("Analytics error:", error);
  }
}

// ========================================
// AUTHENTICATION EVENTS
// ========================================

export async function trackSignUp(method: "email" | "google" | "linkedin", referrer?: string) {
  await trackEvent("signed_up", { method, referrer }, "auth");
}

export async function trackLogin(method: "email" | "google" | "linkedin") {
  await trackEvent("logged_in", { method }, "auth");
}

export async function trackLogout() {
  await trackEvent("logged_out", {}, "auth");
}

export async function trackPasswordReset(method: "request" | "complete") {
  await trackEvent("password_reset", { method }, "auth");
}

// ========================================
// PROFILE EVENTS
// ========================================

export async function trackProfileCreated(accountType: "individual" | "organization") {
  await trackEvent("created_profile", { account_type: accountType }, "profile");
}

export async function trackProfileUpdated(fields: string[]) {
  await trackEvent("profile_updated", { fields_updated: fields }, "profile");
}

export async function trackProfileViewed(viewedProfileId: string, viewerType: "individual" | "organization") {
  await trackEvent("profile_viewed", { 
    viewed_profile_id: viewedProfileId,
    viewer_type: viewerType 
  }, "profile");
}

export async function trackProfileReady(completionPercentage: number, timeToReadyHours: number) {
  await trackEvent(
    "profile_ready_for_match",
    { completion_percentage: completionPercentage, time_to_ready_hours: timeToReadyHours },
    "profile"
  );
}

// ========================================
// EXPERTISE ATLAS EVENTS
// ========================================

export async function trackSkillAdded(skillName: string, category: string, proficiency: string) {
  await trackEvent("skill_added", {
    skill_name: skillName,
    category,
    proficiency
  }, "expertise");
}

export async function trackSkillUpdated(skillId: string, changes: string[]) {
  await trackEvent("skill_updated", {
    skill_id: skillId,
    changes
  }, "expertise");
}

export async function trackSkillLinkedToProof(skillId: string, proofId: string) {
  await trackEvent("skill_linked_proof", {
    skill_id: skillId,
    proof_id: proofId
  }, "expertise");
}

// ========================================
// ORGANIZATION EVENTS
// ========================================

export async function trackOrganizationCreated(orgId: string, orgType: string) {
  await trackEvent("organization_created", {
    organization_id: orgId,
    organization_type: orgType
  }, "organization");
}

export async function trackOrganizationVerified(orgId: string, verificationMethod: string) {
  await trackEvent(
    "org_verified",
    { organization_id: orgId, verification_method: verificationMethod },
    "verification"
  );
}

export async function trackTeamMemberInvited(orgId: string, role: string) {
  await trackEvent("team_member_invited", {
    organization_id: orgId,
    role
  }, "organization");
}

// ========================================
// ASSIGNMENT EVENTS
// ========================================

export async function trackAssignmentCreated(assignmentId: string, assignmentType: string) {
  await trackEvent(
    "assignment_created",
    { assignment_id: assignmentId, assignment_type: assignmentType },
    "assignment"
  );
}

export async function trackAssignmentPublished(assignmentId: string, assignmentType: string) {
  await trackEvent(
    "assignment_published",
    { assignment_id: assignmentId, assignment_type: assignmentType },
    "matching"
  );
}

export async function trackAssignmentEdited(assignmentId: string, fieldsChanged: string[]) {
  await trackEvent("assignment_edited", {
    assignment_id: assignmentId,
    fields_changed: fieldsChanged
  }, "assignment");
}

export async function trackAssignmentClosed(assignmentId: string, reason: string) {
  await trackEvent("assignment_closed", {
    assignment_id: assignmentId,
    reason
  }, "assignment");
}

// ========================================
// MATCHING EVENTS
// ========================================

export async function trackMatchSuggested(matchId: string, assignmentId: string, overallScore: number) {
  await trackEvent(
    "match_suggested",
    { match_id: matchId, assignment_id: assignmentId, overall_score: overallScore },
    "matching"
  );
}

export async function trackMatchViewed(matchId: string, assignmentId: string) {
  await trackEvent(
    "match_viewed",
    { match_id: matchId, assignment_id: assignmentId },
    "matching"
  );
}

export async function trackMatchAccepted(matchId: string, assignmentId: string, overallScore: number, timeToAcceptHours: number) {
  await trackEvent(
    "match_accepted",
    {
      match_id: matchId,
      assignment_id: assignmentId,
      overall_score: overallScore,
      time_to_accept_hours: timeToAcceptHours,
    },
    "matching"
  );
}

export async function trackMatchDeclined(matchId: string, assignmentId: string, reason?: string) {
  await trackEvent(
    "match_declined",
    { match_id: matchId, assignment_id: assignmentId, reason },
    "matching"
  );
}

export async function trackMatchExplanationViewed(matchId: string, componentViewed: string) {
  await trackEvent("match_explanation_viewed", {
    match_id: matchId,
    component_viewed: componentViewed
  }, "matching");
}

// ========================================
// MESSAGING EVENTS
// ========================================

export async function trackMessageSent(matchId: string, isFirstMessage: boolean, hasAttachment: boolean = false) {
  await trackEvent(
    "message_sent",
    { match_id: matchId, is_first_message: isFirstMessage, has_attachment: hasAttachment },
    "messaging"
  );
}

export async function trackConversationStarted(matchId: string, initiatorType: "individual" | "organization") {
  await trackEvent("conversation_started", {
    match_id: matchId,
    initiator_type: initiatorType
  }, "messaging");
}

export async function trackMessageRead(matchId: string, messageId: string) {
  await trackEvent("message_read", {
    match_id: matchId,
    message_id: messageId
  }, "messaging");
}

// ========================================
// VERIFICATION EVENTS
// ========================================

export async function trackProofSubmitted(proofId: string, claimType: string, proofType: string) {
  await trackEvent("proof_submitted", {
    proof_id: proofId,
    claim_type: claimType,
    proof_type: proofType
  }, "verification");
}

export async function trackVerificationRequested(proofId: string, verifierEmail: string) {
  await trackEvent(
    "verification_requested",
    { proof_id: proofId, verifier_email: verifierEmail },
    "verification"
  );
}

export async function trackVerificationCompleted(proofId: string, status: string, timeToVerifyHours: number) {
  await trackEvent(
    "verification_completed",
    { proof_id: proofId, status, time_to_verify_hours: timeToVerifyHours },
    "verification"
  );
}

export async function trackVerificationEmailResent(requestId: string) {
  await trackEvent("verification_email_resent", {
    request_id: requestId
  }, "verification");
}

export async function trackRefereeVerificationViewed(token: string) {
  await trackEvent("referee_verification_viewed", {
    token_hash: token.substring(0, 8) // Only track first 8 chars for privacy
  }, "verification");
}

// ========================================
// ZEN HUB EVENTS (Privacy-First)
// ========================================

export async function trackZenPracticeStarted(practiceId: string, practiceType: string) {
  // Note: No user-specific data stored for mental health practices
  await trackEvent("zen_practice_started", {
    practice_id: practiceId,
    practice_type: practiceType
  }, "wellbeing");
}

export async function trackZenPracticeCompleted(practiceId: string, durationMinutes: number) {
  await trackEvent("zen_practice_completed", {
    practice_id: practiceId,
    duration_minutes: durationMinutes
  }, "wellbeing");
}

export async function trackSafetyPlanCreated() {
  // No personal details tracked
  await trackEvent("safety_plan_created", {}, "wellbeing");
}

// ========================================
// SETTINGS EVENTS
// ========================================

export async function trackSettingsUpdated(section: string, changes: string[]) {
  await trackEvent("settings_updated", {
    section,
    changes
  }, "settings");
}

export async function trackPrivacySettingChanged(setting: string, newValue: boolean) {
  await trackEvent("privacy_setting_changed", {
    setting,
    new_value: newValue
  }, "settings");
}

export async function trackNotificationPreferenceUpdated(channel: string, enabled: boolean) {
  await trackEvent("notification_preference_updated", {
    channel,
    enabled
  }, "settings");
}

export async function trackAccountDeleted(reason?: string) {
  await trackEvent("account_deleted", { reason }, "account");
}

// ========================================
// MODERATION EVENTS
// ========================================

export async function trackContentReported(entityType: string, entityId: string, reasonCategory: string) {
  await trackEvent(
    "content_reported",
    { entity_type: entityType, entity_id: entityId, reason_category: reasonCategory },
    "safety"
  );
}

export async function trackModerationActionTaken(reportId: string, action: string, moderatorId: string) {
  await trackEvent("moderation_action_taken", {
    report_id: reportId,
    action,
    moderator_id: moderatorId
  }, "safety");
}

// ========================================
// NAVIGATION EVENTS
// ========================================

export async function trackPageView(pagePath: string, pageTitle?: string) {
  await trackEvent("page_view", { page_path: pagePath, page_title: pageTitle }, "navigation");
}

export async function trackSearchPerformed(query: string, resultsCount: number, context: string) {
  await trackEvent("search_performed", {
    query_length: query.length, // Don't store actual query for privacy
    results_count: resultsCount,
    context
  }, "navigation");
}

export async function trackFilterApplied(filterType: string, filterValue: string, context: string) {
  await trackEvent("filter_applied", {
    filter_type: filterType,
    filter_value: filterValue,
    context
  }, "navigation");
}

// ========================================
// FEATURE ENGAGEMENT
// ========================================

export async function trackFeatureUsed(featureName: string, context?: string) {
  await trackEvent("feature_used", {
    feature_name: featureName,
    context
  }, "engagement");
}

export async function trackTutorialStarted(tutorialName: string) {
  await trackEvent("tutorial_started", {
    tutorial_name: tutorialName
  }, "onboarding");
}

export async function trackTutorialCompleted(tutorialName: string, timeSpentSeconds: number) {
  await trackEvent("tutorial_completed", {
    tutorial_name: tutorialName,
    time_spent_seconds: timeSpentSeconds
  }, "onboarding");
}

// ========================================
// ERROR TRACKING
// ========================================

export async function trackError(errorType: string, errorMessage: string, context?: string) {
  await trackEvent("error_occurred", {
    error_type: errorType,
    error_message: errorMessage.substring(0, 200), // Limit length
    context
  }, "error");
}

// ========================================
// CONVERSION EVENTS
// ========================================

export async function trackSubscriptionStarted(plan: string, billingCycle: string) {
  await trackEvent("subscription_started", {
    plan,
    billing_cycle: billingCycle
  }, "conversion");
}

export async function trackSubscriptionCancelled(plan: string, reason?: string) {
  await trackEvent("subscription_cancelled", {
    plan,
    reason
  }, "conversion");
}

export async function trackPromoCodeUsed(code: string, success: boolean) {
  await trackEvent("promo_code_used", {
    code_hash: code.substring(0, 4), // Partial for privacy
    success
  }, "conversion");
}

// ========================================
// ANALYTICS UTILITIES
// ========================================

// Track time spent on page
export function trackTimeOnPage(pagePath: string) {
  const startTime = Date.now();
  
  return () => {
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    trackEvent("time_on_page", {
      page_path: pagePath,
      time_spent_seconds: timeSpent
    }, "engagement");
  };
}

// Batch event tracking
export async function trackBatch(events: Array<{
  name: string;
  properties?: Record<string, any>;
  category?: string;
}>) {
  for (const event of events) {
    await trackEvent(event.name, event.properties, event.category);
  }
}
