// Analytics event tracking for Proofound MVP
import { createClient } from "@/lib/supabase/client";
import type { AnalyticsEventInsert } from "@/types";

// Track an analytics event
export async function trackEvent(
  eventName: string,
  properties?: Record<string, any>,
  eventCategory?: string
) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get user agent and referrer from browser
    const userAgent = typeof window !== "undefined" ? window.navigator.userAgent : null;
    const referrer = typeof window !== "undefined" ? document.referrer : null;
    
    const event: AnalyticsEventInsert = {
      event_name: eventName,
      event_category: eventCategory,
      user_id: user?.id,
      properties: properties || null,
      user_agent: userAgent,
      referrer: referrer,
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

// Convenience functions for common events

export async function trackSignUp(method: "email" | "google" | "linkedin", referrer?: string) {
  await trackEvent("signed_up", { method, referrer }, "auth");
}

export async function trackLogin(method: "email" | "google" | "linkedin") {
  await trackEvent("logged_in", { method }, "auth");
}

export async function trackProfileCreated() {
  await trackEvent("created_profile", {}, "profile");
}

export async function trackProfileReady(completionPercentage: number, timeToReadyHours: number) {
  await trackEvent(
    "profile_ready_for_match",
    { completion_percentage: completionPercentage, time_to_ready_hours: timeToReadyHours },
    "profile"
  );
}

export async function trackOrganizationVerified(orgId: string, verificationMethod: string) {
  await trackEvent(
    "org_verified",
    { organization_id: orgId, verification_method: verificationMethod },
    "verification"
  );
}

export async function trackAssignmentPublished(assignmentId: string, assignmentType: string) {
  await trackEvent(
    "assignment_published",
    { assignment_id: assignmentId, assignment_type: assignmentType },
    "matching"
  );
}

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

export async function trackMessageSent(matchId: string, isFirstMessage: boolean) {
  await trackEvent(
    "message_sent",
    { match_id: matchId, is_first_message: isFirstMessage },
    "messaging"
  );
}

export async function trackVerificationRequested(proofId: string, verifierEmail: string) {
  await trackEvent(
    "verification_requested",
    { proof_id: proofId, verifier_email: verifierEmail },
    "verification"
  );
}

export async function trackVerificationCompleted(proofId: string, status: string) {
  await trackEvent(
    "verification_completed",
    { proof_id: proofId, status },
    "verification"
  );
}

export async function trackContentReported(entityType: string, entityId: string, reasonCategory: string) {
  await trackEvent(
    "content_reported",
    { entity_type: entityType, entity_id: entityId, reason_category: reasonCategory },
    "safety"
  );
}

// Page view tracking
export async function trackPageView(pagePath: string, pageTitle?: string) {
  await trackEvent("page_view", { page_path: pagePath, page_title: pageTitle }, "navigation");
}

