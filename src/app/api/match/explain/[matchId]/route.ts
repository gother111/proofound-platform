/**
 * Match Explanation API
 *
 * GET /api/match/explain/[matchId]
 * Returns detailed breakdown of match scoring for transparency
 *
 * Implements PRD Flow I-18: Rank Transparency & Assignment Detail
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { matchId } = await params;

    if (!matchId) {
      return NextResponse.json({ error: 'Match ID required' }, { status: 400 });
    }

    // Fetch the match record with detailed scoring data
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select(
        `
        *,
        assignment:assignments!inner(
          id,
          role,
          requiredSkills,
          niceSkills,
          valuesRequired,
          valuesTags,
          causeTags,
          locationMode,
          country,
          workMode,
          compMin,
          compMax,
          currency,
          hoursMin,
          hoursMax
        ),
        individual_profile:individual_profiles!inner(
          userId,
          values,
          causes
        )
      `
      )
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      console.error('Failed to fetch match:', matchError);
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Ensure user is authorized to view this match
    if (match.profileId !== user.id && match.assignment.organizationId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch user's skills for comparison
    const { data: userSkills, error: skillsError } = await supabase
      .from('skills')
      .select('skillCode, level, monthsExperience, evidenceStrength')
      .eq('userId', match.profileId);

    if (skillsError) {
      console.error('Failed to fetch user skills:', skillsError);
    }

    // Get skill labels from taxonomy
    const skillCodes = userSkills?.map((s) => s.skillCode) || [];
    const { data: skillLabels } = await supabase
      .from('l4_skills')
      .select('code, name')
      .in('code', skillCodes);

    const skillMap = new Map(skillLabels?.map((s) => [s.code, s.name]) || []);

    // Calculate skill matches
    const requiredSkills = (match.assignment.requiredSkills || []) as Array<{
      skillCode: string;
      minLevel: number;
    }>;
    const niceSkills = (match.assignment.niceSkills || []) as Array<{
      skillCode: string;
      desiredLevel?: number;
    }>;

    const skillsMatch = {
      required: requiredSkills.map((required) => {
        const userSkill = userSkills?.find((s) => s.skillCode === required.skillCode);
        return {
          skillName: skillMap.get(required.skillCode) || required.skillCode,
          requiredLevel: required.minLevel,
          yourLevel: userSkill?.level || 0,
          met: (userSkill?.level || 0) >= required.minLevel,
        };
      }),
      nice: niceSkills.map((nice) => {
        const userSkill = userSkills?.find((s) => s.skillCode === nice.skillCode);
        return {
          skillName: skillMap.get(nice.skillCode) || nice.skillCode,
          desiredLevel: nice.desiredLevel,
          yourLevel: userSkill?.level || 0,
          met: userSkill !== undefined,
        };
      }),
    };

    // Calculate PAC (Purpose-Alignment Contribution)
    const userValues = (match.individual_profile?.values || []) as string[];
    const userCauses = (match.individual_profile?.causes || []) as string[];
    const assignmentValues = (match.assignment.valuesTags || []) as string[];
    const assignmentCauses = (match.assignment.causeTags || []) as string[];

    // Jaccard similarity for values
    const sharedValues = userValues.filter((v) => assignmentValues.includes(v));
    const totalUniqueValues = new Set([...userValues, ...assignmentValues]).size;
    const valuesOverlap = totalUniqueValues > 0 ? sharedValues.length / totalUniqueValues : 0;

    // Jaccard similarity for causes
    const sharedCauses = userCauses.filter((c) => assignmentCauses.includes(c));
    const totalUniqueCauses = new Set([...userCauses, ...assignmentCauses]).size;
    const causesOverlap = totalUniqueCauses > 0 ? sharedCauses.length / totalUniqueCauses : 0;

    const pac = {
      valuesOverlap,
      causesOverlap,
      sharedValues,
      sharedCauses,
      totalValues: totalUniqueValues,
      totalCauses: totalUniqueCauses,
    };

    // Calculate constraints match
    const constraints = {
      location: {
        match: match.assignment.locationMode === 'remote' || true, // Simplified
        details: `${match.assignment.locationMode || 'Not specified'}`,
      },
      salary: {
        match: true, // Would need matching profile salary range
        details: match.assignment.compMin
          ? `${match.assignment.currency} ${match.assignment.compMin}-${match.assignment.compMax}`
          : 'Not specified',
      },
      hours: {
        match: true,
        details: match.assignment.hoursMin
          ? `${match.assignment.hoursMin}-${match.assignment.hoursMax} hours/week`
          : 'Not specified',
      },
      workMode: {
        match: true,
        details: match.assignment.workMode || 'Not specified',
      },
    };

    // Get rank (if available)
    // This would require querying all matches for this assignment sorted by score
    const { data: allMatches } = await supabase
      .from('matches')
      .select('id, totalScore')
      .eq('assignmentId', match.assignmentId)
      .order('totalScore', { ascending: false });

    const rank = allMatches ? allMatches.findIndex((m) => m.id === matchId) + 1 : 0;
    const totalCandidates = allMatches?.length || 0;

    // Determine rank band
    let rankBand: string | undefined;
    if (rank <= 5) rankBand = 'Top 5';
    else if (rank <= 10) rankBand = 'Top 10';
    else if (rank <= 20) rankBand = 'Top 20';

    // Build response
    const explanation = {
      matchId: match.id,
      compositeScore: match.totalScore || 0,
      rank,
      totalCandidates,
      rankBand,
      subscores: {
        skills: match.skillScore || 0,
        pac: match.pacScore || 0,
        constraints: match.constraintScore || 0,
        recency: match.recencyScore || 0,
        evidence: match.evidenceScore || 0,
      },
      skillsMatch,
      pac,
      constraints,
    };

    return NextResponse.json(explanation);
  } catch (error) {
    console.error('Match explanation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
