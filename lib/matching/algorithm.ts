// Matching algorithm for Proofound MVP
// Calculates match scores between profiles and assignments with explainability

import type { Profile, Assignment, ExpertiseAtlas, MatchExplainability, MatchStrength, MatchGap, ImprovementSuggestion } from "@/types";

interface MatchInput {
  profile: Profile & {
    expertise?: ExpertiseAtlas[];
  };
  assignment: Assignment;
}

interface MatchScoreResult {
  overall_score: number;
  mission_values_score: number;
  mission_values_weight: number;
  core_expertise_score: number;
  core_expertise_weight: number;
  tools_score: number;
  tools_weight: number;
  logistics_score: number;
  logistics_weight: number;
  recency_score: number;
  recency_weight: number;
  explainability: MatchExplainability;
  is_strong_match: boolean;
  is_near_match: boolean;
}

/**
 * Calculate mission and values alignment score
 */
function calculateMissionValuesScore(profile: Profile, assignment: Assignment): number {
  let score = 0;
  let factors = 0;

  // Compare mission statements (text similarity - simplified)
  if (profile.mission && assignment.mission_alignment_weight) {
    const profileMission = profile.mission.toLowerCase();
    const assignmentValues = assignment.values_keywords as any;
    
    if (assignmentValues && Array.isArray(assignmentValues)) {
      const matches = assignmentValues.filter((keyword: string) =>
        profileMission.includes(keyword.toLowerCase())
      );
      score += (matches.length / Math.max(assignmentValues.length, 1)) * 100;
      factors++;
    }
  }

  // Compare values
  if (profile.values && assignment.values_keywords) {
    const profileValues = Array.isArray(profile.values) ? profile.values : [];
    const assignmentValues = assignment.values_keywords as any;
    
    if (Array.isArray(assignmentValues)) {
      const commonValues = profileValues.filter((v: any) =>
        assignmentValues.some((av: string) => 
          typeof v === 'string' && v.toLowerCase() === av.toLowerCase()
        )
      );
      score += (commonValues.length / Math.max(assignmentValues.length, 1)) * 100;
      factors++;
    }
  }

  // Compare causes
  if (profile.causes && assignment.values_keywords) {
    const profileCauses = Array.isArray(profile.causes) ? profile.causes : [];
    const assignmentValues = assignment.values_keywords as any;
    
    if (Array.isArray(assignmentValues)) {
      const commonCauses = profileCauses.filter((c: any) =>
        assignmentValues.some((av: string) =>
          typeof c === 'string' && c.toLowerCase().includes(av.toLowerCase())
        )
      );
      score += (commonCauses.length / Math.max(assignmentValues.length, 1)) * 100;
      factors++;
    }
  }

  return factors > 0 ? score / factors : 50; // Default to 50 if no data
}

/**
 * Calculate core expertise match score
 */
function calculateExpertiseScore(profile: Profile & { expertise?: ExpertiseAtlas[] }, assignment: Assignment): number {
  if (!profile.expertise || profile.expertise.length === 0) {
    return 0;
  }

  const requiredExpertise = assignment.required_expertise as any;
  if (!requiredExpertise || !Array.isArray(requiredExpertise)) {
    return 50; // Default if no requirements specified
  }

  let totalScore = 0;
  let matchedCount = 0;

  for (const required of requiredExpertise) {
    const match = profile.expertise.find(
      (exp) => exp.skill_name.toLowerCase() === required.skill?.toLowerCase()
    );

    if (match) {
      matchedCount++;
      
      // Score based on proficiency level
      const proficiencyScores: Record<string, number> = {
        expert: 100,
        advanced: 85,
        intermediate: 70,
        beginner: 50,
      };
      
      const proficiencyScore = proficiencyScores[match.proficiency_level || 'intermediate'] || 70;
      
      // Boost if verified
      const verificationBoost = match.is_verified ? 15 : 0;
      
      // Boost if core expertise
      const coreBoost = match.is_core_expertise ? 10 : 0;
      
      totalScore += Math.min(proficiencyScore + verificationBoost + coreBoost, 100);
    }
  }

  if (matchedCount === 0) return 0;
  
  const avgScore = totalScore / matchedCount;
  const coverageRatio = matchedCount / requiredExpertise.length;
  
  // Weighted: 70% avg skill score, 30% coverage
  return avgScore * 0.7 + (coverageRatio * 100 * 0.3);
}

/**
 * Calculate tools/tech match score
 */
function calculateToolsScore(profile: Profile & { expertise?: ExpertiseAtlas[] }, assignment: Assignment): number {
  if (!profile.expertise || profile.expertise.length === 0) {
    return 0;
  }

  const requiredExpertise = assignment.required_expertise as any;
  if (!requiredExpertise || !Array.isArray(requiredExpertise)) {
    return 50;
  }

  // Filter for tool-specific expertise
  const toolExpertise = profile.expertise.filter(
    (exp) => exp.skill_category?.toLowerCase().includes('tool') || 
            exp.skill_category?.toLowerCase().includes('tech')
  );

  const requiredTools = requiredExpertise.filter(
    (req: any) => req.type === 'tool' || req.category === 'tool'
  );

  if (requiredTools.length === 0) return 75; // Not critical
  if (toolExpertise.length === 0) return 0;

  const matchedTools = requiredTools.filter((req: any) =>
    toolExpertise.some((exp) => exp.skill_name.toLowerCase().includes(req.skill?.toLowerCase()))
  );

  return (matchedTools.length / requiredTools.length) * 100;
}

/**
 * Calculate logistics match score (location, timezone, availability)
 */
function calculateLogisticsScore(profile: Profile, assignment: Assignment): number {
  let score = 0;
  let factors = 0;

  // Location match (if not remote)
  if (!assignment.is_remote && profile.region && assignment.location) {
    const regionMatch = profile.region.toLowerCase().includes(assignment.location.toLowerCase()) ||
                       assignment.location.toLowerCase().includes(profile.region.toLowerCase());
    score += regionMatch ? 100 : 30; // Partial score if not exact match
    factors++;
  } else if (assignment.is_remote) {
    score += 100; // Perfect score for remote
    factors++;
  }

  // Timezone match
  if (profile.timezone && assignment.timezone_preference) {
    const timezoneMatch = profile.timezone === assignment.timezone_preference;
    score += timezoneMatch ? 100 : 60;
    factors++;
  }

  // Availability
  if (profile.available_for_match) {
    score += 100;
    factors++;
  } else {
    score += 0;
    factors++;
  }

  // Language requirements
  if (assignment.required_languages && Array.isArray(assignment.required_languages)) {
    const profileLangs = profile.languages || [];
    const matchedLangs = assignment.required_languages.filter((lang) =>
      profileLangs.includes(lang)
    );
    score += (matchedLangs.length / assignment.required_languages.length) * 100;
    factors++;
  }

  return factors > 0 ? score / factors : 50;
}

/**
 * Calculate recency score based on recent activity
 */
function calculateRecencyScore(profile: Profile & { expertise?: ExpertiseAtlas[] }): number {
  if (!profile.expertise || profile.expertise.length === 0) {
    return 50;
  }

  const now = new Date();
  const recentSkills = profile.expertise.filter((exp) => {
    if (!exp.last_used_date) return false;
    const lastUsed = new Date(exp.last_used_date);
    const monthsAgo = (now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return monthsAgo <= 12; // Used within last year
  });

  const recencyRatio = recentSkills.length / profile.expertise.length;
  return recencyRatio * 100;
}

/**
 * Generate explainability for the match
 */
function generateExplainability(
  scores: Omit<MatchScoreResult, 'explainability' | 'is_strong_match' | 'is_near_match'>,
  profile: Profile & { expertise?: ExpertiseAtlas[] },
  assignment: Assignment
): MatchExplainability {
  const strengths: MatchStrength[] = [];
  const gaps: MatchGap[] = [];
  const improvements: ImprovementSuggestion[] = [];

  // Identify strengths
  if (scores.mission_values_score >= 80) {
    strengths.push({
      area: "Mission & Values",
      description: "Strong alignment with organization's mission and values",
      score: scores.mission_values_score,
    });
  }

  if (scores.core_expertise_score >= 80) {
    strengths.push({
      area: "Core Expertise",
      description: "Excellent match for required skills and experience",
      score: scores.core_expertise_score,
    });
  }

  if (scores.logistics_score >= 80) {
    strengths.push({
      area: "Logistics",
      description: "Location, timezone, and availability align well",
      score: scores.logistics_score,
    });
  }

  // Identify gaps
  if (scores.core_expertise_score < 60) {
    gaps.push({
      area: "Core Expertise",
      description: "Some required skills are missing or not verified",
      impact: "high",
    });
  }

  if (scores.tools_score < 50) {
    gaps.push({
      area: "Tools & Technology",
      description: "Limited experience with required tools",
      impact: "medium",
    });
  }

  if (scores.mission_values_score < 50) {
    gaps.push({
      area: "Mission Alignment",
      description: "Could strengthen mission/values alignment in profile",
      impact: "medium",
    });
  }

  // Generate improvement suggestions
  if (scores.core_expertise_score < 80) {
    improvements.push({
      action: "Add verified proofs for your core skills",
      potential_increase_min: 8,
      potential_increase_max: 12,
      priority: "high",
    });
  }

  if (!profile.mission || profile.mission.length < 50) {
    improvements.push({
      action: "Complete your mission statement to improve alignment matching",
      potential_increase_min: 5,
      potential_increase_max: 10,
      priority: "medium",
    });
  }

  if (scores.recency_score < 70) {
    improvements.push({
      action: "Update 'last used' dates for your skills",
      potential_increase_min: 3,
      potential_increase_max: 7,
      priority: "low",
    });
  }

  return {
    overall_score: scores.overall_score,
    breakdown: {
      mission_values: {
        score: scores.mission_values_score,
        weight: scores.mission_values_weight,
      },
      core_expertise: {
        score: scores.core_expertise_score,
        weight: scores.core_expertise_weight,
      },
      tools: {
        score: scores.tools_score,
        weight: scores.tools_weight,
      },
      logistics: {
        score: scores.logistics_score,
        weight: scores.logistics_weight,
      },
      recency: {
        score: scores.recency_score,
        weight: scores.recency_weight,
      },
    },
    strengths,
    gaps,
    improvements,
  };
}

/**
 * Main matching function
 */
export function calculateMatchScore(input: MatchInput): MatchScoreResult {
  const { profile, assignment } = input;

  // Get weights from assignment (with defaults)
  const weights = {
    mission_values: assignment.mission_alignment_weight || 30,
    core_expertise: assignment.core_expertise_weight || 40,
    tools: assignment.tools_weight || 10,
    logistics: assignment.logistics_weight || 10,
    recency: assignment.recency_weight || 10,
  };

  // Calculate individual scores
  const mission_values_score = calculateMissionValuesScore(profile, assignment);
  const core_expertise_score = calculateExpertiseScore(profile, assignment);
  const tools_score = calculateToolsScore(profile, assignment);
  const logistics_score = calculateLogisticsScore(profile, assignment);
  const recency_score = calculateRecencyScore(profile);

  // Calculate weighted overall score
  const overall_score =
    (mission_values_score * weights.mission_values +
      core_expertise_score * weights.core_expertise +
      tools_score * weights.tools +
      logistics_score * weights.logistics +
      recency_score * weights.recency) /
    100;

  const scores = {
    overall_score: Math.round(overall_score * 100) / 100,
    mission_values_score: Math.round(mission_values_score * 100) / 100,
    mission_values_weight: weights.mission_values,
    core_expertise_score: Math.round(core_expertise_score * 100) / 100,
    core_expertise_weight: weights.core_expertise,
    tools_score: Math.round(tools_score * 100) / 100,
    tools_weight: weights.tools,
    logistics_score: Math.round(logistics_score * 100) / 100,
    logistics_weight: weights.logistics,
    recency_score: Math.round(recency_score * 100) / 100,
    recency_weight: weights.recency,
  };

  // Generate explainability
  const explainability = generateExplainability(scores, profile, assignment);

  // Determine match quality
  const is_strong_match = overall_score >= 75;
  const is_near_match = overall_score >= 60 && overall_score < 75;

  return {
    ...scores,
    explainability,
    is_strong_match,
    is_near_match,
  };
}

/**
 * Batch calculate matches for a profile against multiple assignments
 */
export function calculateMatches(
  profile: Profile & { expertise?: ExpertiseAtlas[] },
  assignments: Assignment[]
): MatchScoreResult[] {
  return assignments
    .map((assignment) => calculateMatchScore({ profile, assignment }))
    .sort((a, b) => b.overall_score - a.overall_score);
}

