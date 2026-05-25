/**
 * Match Score Explainer Library
 *
 * Pure functions for generating human-readable explanations of match scores.
 * Used by Match Detail Panel and Match Explainer Modal.
 *
 * PRD Reference: Part 5 F4 - "Why This Match" transparency feature
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ScoreExplanation {
  overall: string;
  subscores: {
    skills: { score: number; explanation: string };
    constraints: { score: number; explanation: string };
    recency: { score: number; explanation: string };
  };
  strengths: string[];
  improvements: string[];
}

export interface MatchData {
  compositeScore: number; // 0-1
  subscores: {
    skills: number;
    constraints: number;
    recency: number;
  };
  skillsMatch: {
    required: Array<{ skillName: string; requiredLevel: number; yourLevel: number; met: boolean }>;
    nice: Array<{ skillName: string; yourLevel: number; met: boolean }>;
  };
}

// ============================================================================
// EXPLANATION GENERATORS
// ============================================================================

/**
 * Generate overall score explanation
 */
export function explainOverallScore(score: number): string {
  const percent = Math.round(score * 100);

  if (percent >= 90) {
    return `Outstanding ${percent}% match! You're an exceptional fit for this role across all dimensions.`;
  }
  if (percent >= 80) {
    return `Excellent ${percent}% match! You align very well with this opportunity.`;
  }
  if (percent >= 70) {
    return `Strong ${percent}% match. You meet most requirements with credible proof and practical fit.`;
  }
  if (percent >= 60) {
    return `Good ${percent}% match. You have solid alignment in key areas.`;
  }
  if (percent >= 50) {
    return `Moderate ${percent}% match. There are some gaps but potential for growth.`;
  }
  return `${percent}% match. Consider if this aligns with your goals and if you can close the gaps.`;
}

/**
 * Explain skills subscore
 */
export function explainSkillsScore(
  score: number,
  required: MatchData['skillsMatch']['required'],
  nice: MatchData['skillsMatch']['nice']
): { score: number; explanation: string } {
  const percent = Math.round(score * 100);
  const metRequired = required.filter((s) => s.met).length;
  const totalRequired = required.length;
  const metNice = nice.filter((s) => s.met).length;
  const totalNice = nice.length;

  let explanation = `You match ${percent}% of the skill requirements. `;

  if (totalRequired > 0) {
    explanation += `Required skills: ${metRequired}/${totalRequired} met. `;
  }

  if (totalNice > 0) {
    explanation += `Nice-to-have skills: ${metNice}/${totalNice} met.`;
  }

  if (metRequired === totalRequired && metNice > 0) {
    explanation += ' Strong skill match!';
  } else if (metRequired < totalRequired) {
    const missing = required.filter((s) => !s.met);
    const examples = missing.slice(0, 2).map((s) => s.skillName);
    explanation += ` Missing: ${examples.join(', ')}${missing.length > 2 ? ', ...' : ''}.`;
  }

  return { score, explanation };
}

/**
 * Explain constraints score (location, salary, hours, etc.)
 */
export function explainConstraintsScore(
  score: number,
  constraints: {
    location: { match: boolean; details?: string };
    salary: { match: boolean; details?: string };
    hours: { match: boolean; details?: string };
    workMode: { match: boolean; details?: string };
  }
): { score: number; explanation: string } {
  const percent = Math.round(score * 100);
  const matched = Object.values(constraints).filter((c) => c.match).length;
  const total = Object.keys(constraints).length;

  let explanation = `${matched}/${total} practical constraints met (${percent}%). `;

  const unmet = Object.entries(constraints)
    .filter(([_, c]) => !c.match)
    .map(([key, _]) => key);

  if (unmet.length > 0) {
    explanation += `Potential mismatches: ${unmet.join(', ')}.`;
  } else {
    explanation += 'All logistics align!';
  }

  return { score, explanation };
}

/**
 * Explain recency score (how recently skills were used)
 */
export function explainRecencyScore(score: number): { score: number; explanation: string } {
  const percent = Math.round(score * 100);

  let explanation = '';

  if (percent >= 80) {
    explanation = 'Your skills are very recent and active. Excellent!';
  } else if (percent >= 60) {
    explanation = 'Your skills are fairly recent and relevant.';
  } else if (percent >= 40) {
    explanation = 'Some of your skills may need refreshing.';
  } else {
    explanation = 'Consider updating your skills to improve recency.';
  }

  return { score, explanation: `${percent}% recency. ${explanation}` };
}

// ============================================================================
// IMPROVEMENT TIPS
// ============================================================================

/**
 * Generate actionable improvement tips
 */
export function generateImprovementTips(match: MatchData): string[] {
  const tips: string[] = [];
  const { subscores, skillsMatch } = match;

  // Skills tips
  if (subscores.skills < 0.8) {
    const missingRequired = skillsMatch.required.filter((s) => !s.met);
    if (missingRequired.length > 0) {
      const examples = missingRequired.slice(0, 3).map((s) => s.skillName);
      tips.push(
        `Build these required skills: ${examples.join(', ')}${missingRequired.length > 3 ? ', and more' : ''}`
      );
    }

    const lowLevel = skillsMatch.required.filter((s) => s.met && s.yourLevel < s.requiredLevel + 1);
    if (lowLevel.length > 0) {
      tips.push('Level up your existing skills to exceed requirements');
    }
  }

  // Recency tips
  if (subscores.recency < 0.6) {
    tips.push('Update your experience dates to show recent skill usage');
  }

  // Constraints tips
  if (subscores.constraints < 0.8) {
    tips.push('Review your matching profile constraints (location, salary, hours)');
  }

  // If already strong, encourage application
  if (tips.length === 0 && match.compositeScore >= 0.75) {
    tips.push("You're a strong match! Consider applying to this opportunity.");
  }

  return tips;
}

/**
 * Identify match strengths
 */
export function identifyStrengths(match: MatchData): string[] {
  const strengths: string[] = [];
  const { subscores, skillsMatch } = match;

  if (subscores.skills >= 0.9) {
    strengths.push('Exceptional skills match');
  } else if (subscores.skills >= 0.8) {
    strengths.push('Strong skills alignment');
  }

  if (subscores.constraints >= 0.95) {
    strengths.push('Perfect logistics match');
  }

  if (subscores.recency >= 0.8) {
    strengths.push('Recent and active skills');
  }

  // Specific skill strengths
  const exceededRequired = skillsMatch.required.filter(
    (s) => s.met && s.yourLevel > s.requiredLevel
  );
  if (exceededRequired.length > 0) {
    strengths.push(`Exceed requirements in ${exceededRequired.length} skill(s)`);
  }

  return strengths;
}

/**
 * Generate complete score explanation
 */
export function generateScoreExplanation(match: MatchData): ScoreExplanation {
  return {
    overall: explainOverallScore(match.compositeScore),
    subscores: {
      skills: explainSkillsScore(
        match.subscores.skills,
        match.skillsMatch.required,
        match.skillsMatch.nice
      ),
      constraints: explainConstraintsScore(match.subscores.constraints, {
        location: { match: true },
        salary: { match: true },
        hours: { match: true },
        workMode: { match: true },
      }),
      recency: explainRecencyScore(match.subscores.recency),
    },
    strengths: identifyStrengths(match),
    improvements: generateImprovementTips(match),
  };
}

// ============================================================================
// RANK EXPLANATION
// ============================================================================

/**
 * Explain rank/standing in candidate pool
 */
export function explainRank(rank: number, totalCandidates: number): string {
  if (rank <= 5) {
    return `You're in the Top 5 out of ${totalCandidates} candidates. Excellent standing!`;
  }
  if (rank <= 10) {
    return `You're in the Top 10 out of ${totalCandidates} candidates. Strong position!`;
  }
  if (rank <= 20) {
    return `You're in the Top 20 out of ${totalCandidates} candidates. Good positioning.`;
  }
  if (rank <= Math.ceil(totalCandidates * 0.25)) {
    return `You're in the top 25% of ${totalCandidates} candidates.`;
  }
  if (rank <= Math.ceil(totalCandidates * 0.5)) {
    return `You're in the top half of ${totalCandidates} candidates.`;
  }
  return `You're ranked #${rank} out of ${totalCandidates} candidates.`;
}

/**
 * Get rank display string (Top X or band)
 */
export function getRankDisplay(rank: number, totalCandidates: number): string {
  if (rank <= 5) return 'Top 5';
  if (rank <= 10) return 'Top 10';
  if (rank <= 20) return 'Top 20';
  if (rank <= Math.ceil(totalCandidates * 0.25)) return 'Top 25%';
  if (rank <= Math.ceil(totalCandidates * 0.5)) return 'Top 50%';
  return `#${rank}`;
}

/**
 * Get color for rank visualization
 */
export function getRankColor(rank: number): string {
  if (rank <= 5) return '#1C4D3A'; // Forest green
  if (rank <= 10) return '#7A9278'; // Sage
  if (rank <= 20) return '#C76B4A'; // Terracotta
  return '#6B6760'; // Charcoal
}
