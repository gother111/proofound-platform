// API route to generate matches for a profile
import { NextResponse } from "next/server";
import { createServerSupabaseClient, requireAuth } from "@/lib/supabase/server";
import { calculateMatchScore } from "@/lib/matching/algorithm";
import { trackMatchSuggested } from "@/lib/analytics";

export async function POST(request: Request) {
  try {
    // Require authentication
    const user = await requireAuth();
    
    const supabase = await createServerSupabaseClient();

    // Get the user's profile with expertise
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(`
        *,
        expertise:expertise_atlas(*)
      `)
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Check if profile is ready for matching
    if (!profile.profile_ready_for_match) {
      return NextResponse.json(
        { error: "Profile not ready for matching. Please complete your profile." },
        { status: 400 }
      );
    }

    // Get published assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from("assignments")
      .select("*")
      .eq("status", "published")
      .is("deleted_at", null);

    if (assignmentsError) {
      return NextResponse.json(
        { error: "Failed to fetch assignments" },
        { status: 500 }
      );
    }

    if (!assignments || assignments.length === 0) {
      return NextResponse.json({
        message: "No assignments available for matching",
        matches: [],
      });
    }

    // Calculate matches
    const matchResults = [];
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

    for (const assignment of assignments) {
      // Check if match already exists
      const { data: existingMatch } = await supabase
        .from("matches")
        .select("id")
        .eq("profile_id", user.id)
        .eq("assignment_id", assignment.id)
        .single();

      if (existingMatch) {
        continue; // Skip if match already exists
      }

      // Calculate match score
      const matchScore = calculateMatchScore({
        profile: profile as any,
        assignment,
      });

      // Only create matches above a minimum threshold (e.g., 40%)
      if (matchScore.overall_score >= 40) {
        const { data: newMatch, error: matchError } = await supabase
          .from("matches")
          .insert({
            profile_id: user.id,
            assignment_id: assignment.id,
            overall_score: matchScore.overall_score,
            mission_values_score: matchScore.mission_values_score,
            mission_values_weight: matchScore.mission_values_weight,
            core_expertise_score: matchScore.core_expertise_score,
            core_expertise_weight: matchScore.core_expertise_weight,
            tools_score: matchScore.tools_score,
            tools_weight: matchScore.tools_weight,
            logistics_score: matchScore.logistics_score,
            logistics_weight: matchScore.logistics_weight,
            recency_score: matchScore.recency_score,
            recency_weight: matchScore.recency_weight,
            strengths: matchScore.explainability.strengths,
            gaps: matchScore.explainability.gaps,
            improvement_suggestions: matchScore.explainability.improvements,
            is_strong_match: matchScore.is_strong_match,
            is_near_match: matchScore.is_near_match,
            status: "suggested",
            generated_at: now,
            expires_at: expiresAt,
          })
          .select()
          .single();

        if (!matchError && newMatch) {
          matchResults.push(newMatch);
          
          // Track analytics event
          await trackMatchSuggested(
            newMatch.id,
            assignment.id,
            matchScore.overall_score
          );
        }
      }
    }

    return NextResponse.json({
      message: `Generated ${matchResults.length} new matches`,
      matches: matchResults,
    });
  } catch (error) {
    console.error("Match generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate matches" },
      { status: 500 }
    );
  }
}

