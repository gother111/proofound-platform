/**
 * System Usability Scale (SUS) Scoring
 *
 * Implements the standard SUS calculation methodology.
 * SUS is a 10-question survey with 5-point Likert scale responses.
 * Questions alternate between positive and negative framing.
 *
 * Target: SUS score ≥75 (industry benchmark for "good" usability)
 *
 * PRD Reference: Part 2 (lines 83-84), Part 12
 */

export const SUS_QUESTIONS = [
  {
    id: 1,
    text: 'I think that I would like to use this system frequently.',
    positive: true,
  },
  {
    id: 2,
    text: 'I found the system unnecessarily complex.',
    positive: false,
  },
  {
    id: 3,
    text: 'I thought the system was easy to use.',
    positive: true,
  },
  {
    id: 4,
    text: 'I think that I would need the support of a technical person to be able to use this system.',
    positive: false,
  },
  {
    id: 5,
    text: 'I found the various functions in this system were well integrated.',
    positive: true,
  },
  {
    id: 6,
    text: 'I thought there was too much inconsistency in this system.',
    positive: false,
  },
  {
    id: 7,
    text: 'I would imagine that most people would learn to use this system very quickly.',
    positive: true,
  },
  {
    id: 8,
    text: 'I found the system very cumbersome to use.',
    positive: false,
  },
  {
    id: 9,
    text: 'I felt very confident using the system.',
    positive: true,
  },
  {
    id: 10,
    text: 'I needed to learn a lot of things before I could get going with this system.',
    positive: false,
  },
];

export interface SUSResponse {
  questionId: number;
  value: number; // 1-5 scale
}

export interface SUSResult {
  score: number; // 0-100 scale
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  adjective: 'Best Imaginable' | 'Excellent' | 'Good' | 'OK' | 'Poor' | 'Worst Imaginable';
  meetsTarget: boolean; // ≥75
  interpretation: string;
}

/**
 * Calculate SUS score from responses
 *
 * Formula:
 * - For odd items (1, 3, 5, 7, 9): contribution = response - 1
 * - For even items (2, 4, 6, 8, 10): contribution = 5 - response
 * - Total score = sum of contributions * 2.5
 *
 * This scales the score to 0-100
 */
export function calculateSUSScore(responses: SUSResponse[]): SUSResult {
  if (responses.length !== 10) {
    throw new Error('SUS requires exactly 10 responses');
  }

  // Validate all responses are in range 1-5
  for (const response of responses) {
    if (response.value < 1 || response.value > 5) {
      throw new Error(`Invalid response value: ${response.value}. Must be 1-5.`);
    }
  }

  // Sort responses by question ID to ensure correct order
  const sortedResponses = [...responses].sort((a, b) => a.questionId - b.questionId);

  // Calculate contribution for each question
  let totalContribution = 0;

  for (let i = 0; i < 10; i++) {
    const response = sortedResponses[i];
    const questionId = response.questionId;
    const value = response.value;

    // Odd questions (1, 3, 5, 7, 9) are positively framed
    // Even questions (2, 4, 6, 8, 10) are negatively framed
    const contribution = questionId % 2 === 1 ? value - 1 : 5 - value;

    totalContribution += contribution;
  }

  // Scale to 0-100
  const score = totalContribution * 2.5;

  // Determine grade based on research by Jeff Sauro
  let grade: SUSResult['grade'];
  if (score >= 80.3) grade = 'A';
  else if (score >= 68) grade = 'B';
  else if (score >= 51) grade = 'C';
  else if (score >= 25.1) grade = 'D';
  else grade = 'F';

  // Determine adjective rating based on research
  let adjective: SUSResult['adjective'];
  if (score >= 84.1) adjective = 'Best Imaginable';
  else if (score >= 80.8) adjective = 'Excellent';
  else if (score >= 68) adjective = 'Good';
  else if (score >= 51) adjective = 'OK';
  else if (score >= 25.1) adjective = 'Poor';
  else adjective = 'Worst Imaginable';

  const meetsTarget = score >= 75;

  // Generate interpretation
  let interpretation: string;
  if (score >= 80) {
    interpretation = 'Excellent usability. Users find the system easy and enjoyable to use.';
  } else if (score >= 68) {
    interpretation =
      'Good usability. The system meets user expectations with minor room for improvement.';
  } else if (score >= 51) {
    interpretation = 'Acceptable usability, but significant improvements are needed.';
  } else {
    interpretation = 'Poor usability. Urgent attention required to improve user experience.';
  }

  return {
    score: Math.round(score * 10) / 10, // Round to 1 decimal place
    grade,
    adjective,
    meetsTarget,
    interpretation,
  };
}

/**
 * Calculate average SUS score from multiple surveys
 */
export function calculateAverageSUS(scores: number[]): {
  average: number;
  median: number;
  min: number;
  max: number;
  meetsTarget: boolean;
} {
  if (scores.length === 0) {
    return { average: 0, median: 0, min: 0, max: 0, meetsTarget: false };
  }

  const sorted = [...scores].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, score) => acc + score, 0);
  const average = sum / sorted.length;

  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

  return {
    average: Math.round(average * 10) / 10,
    median: Math.round(median * 10) / 10,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    meetsTarget: average >= 75,
  };
}

/**
 * Calculate SUS scores by cohort
 */
export function calculateSUSByCohort(
  surveys: Array<{ score: number; cohort: string }>
): Map<string, { average: number; count: number; meetsTarget: boolean }> {
  const cohortMap = new Map<
    string,
    { scores: number[]; average: number; count: number; meetsTarget: boolean }
  >();

  // Group by cohort
  surveys.forEach((survey) => {
    if (!cohortMap.has(survey.cohort)) {
      cohortMap.set(survey.cohort, { scores: [], average: 0, count: 0, meetsTarget: false });
    }
    cohortMap.get(survey.cohort)!.scores.push(survey.score);
  });

  // Calculate averages
  cohortMap.forEach((data, cohort) => {
    const average = data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length;
    data.average = Math.round(average * 10) / 10;
    data.count = data.scores.length;
    data.meetsTarget = average >= 75;
  });

  return cohortMap;
}

/**
 * Calculate response rate for SUS surveys
 */
export function calculateResponseRate(
  displayed: number,
  completed: number
): {
  rate: number;
  percentage: string;
} {
  if (displayed === 0) {
    return { rate: 0, percentage: '0%' };
  }

  const rate = completed / displayed;
  const percentage = `${Math.round(rate * 100)}%`;

  return { rate, percentage };
}
