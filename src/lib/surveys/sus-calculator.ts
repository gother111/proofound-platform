/**
 * System Usability Scale (SUS) Calculator
 *
 * PRD: Part 2 (lines 83-84), Part 12
 * Target: SUS ≥75 (above average)
 *
 * Standard 10-question SUS survey with 5-point Likert scale
 * Scoring: 0-100 scale where:
 * - 68+ is above average
 * - 75+ is good (our target)
 * - 85+ is excellent
 */

export interface SUSResponse {
  q1: number; // 1-5: I think I would like to use this system frequently
  q2: number; // 1-5: I found the system unnecessarily complex
  q3: number; // 1-5: I thought the system was easy to use
  q4: number; // 1-5: I think I would need support to use this system
  q5: number; // 1-5: I found the various functions well integrated
  q6: number; // 1-5: I thought there was too much inconsistency
  q7: number; // 1-5: I would imagine most people would learn quickly
  q8: number; // 1-5: I found the system very cumbersome
  q9: number; // 1-5: I felt very confident using the system
  q10: number; // 1-5: I needed to learn a lot before I could get going
}

export interface SUSResult {
  rawScore: number; // 0-100
  percentile: number; // Approximate percentile rank
  grade: 'F' | 'D' | 'C' | 'B' | 'A'; // Letter grade
  adjective:
    | 'Worst Imaginable'
    | 'Awful'
    | 'Poor'
    | 'OK'
    | 'Good'
    | 'Excellent'
    | 'Best Imaginable';
  interpretation: string;
  meetsTarget: boolean; // Whether it meets our ≥75 target
}

/**
 * Calculate SUS score from survey responses
 *
 * Algorithm:
 * - For odd questions (1, 3, 5, 7, 9): contribution = response - 1
 * - For even questions (2, 4, 6, 8, 10): contribution = 5 - response
 * - Sum all contributions and multiply by 2.5 to get 0-100 scale
 */
export function calculateSUSScore(responses: SUSResponse): SUSResult {
  // Validate all responses are between 1-5
  const values = Object.values(responses);
  if (values.some((v) => v < 1 || v > 5)) {
    throw new Error('All SUS responses must be between 1 and 5');
  }

  // Calculate contributions for each question
  const contributions = [
    responses.q1 - 1, // Odd: positive statement
    5 - responses.q2, // Even: negative statement
    responses.q3 - 1, // Odd: positive statement
    5 - responses.q4, // Even: negative statement
    responses.q5 - 1, // Odd: positive statement
    5 - responses.q6, // Even: negative statement
    responses.q7 - 1, // Odd: positive statement
    5 - responses.q8, // Even: negative statement
    responses.q9 - 1, // Odd: positive statement
    5 - responses.q10, // Even: negative statement
  ];

  // Sum contributions and multiply by 2.5
  const sumContributions = contributions.reduce((sum, c) => sum + c, 0);
  const rawScore = sumContributions * 2.5;

  // Calculate percentile (approximate based on research)
  const percentile = scoreToPercentile(rawScore);

  // Assign letter grade
  const grade = scoreToGrade(rawScore);

  // Assign adjective rating
  const adjective = scoreToAdjective(rawScore);

  // Generate interpretation
  const interpretation = generateInterpretation(rawScore);

  // Check if meets our target
  const meetsTarget = rawScore >= 75;

  return {
    rawScore,
    percentile,
    grade,
    adjective,
    interpretation,
    meetsTarget,
  };
}

/**
 * Convert SUS score to approximate percentile rank
 * Based on research showing average SUS score is ~68
 */
function scoreToPercentile(score: number): number {
  if (score >= 85) return 95;
  if (score >= 80) return 90;
  if (score >= 75) return 80;
  if (score >= 70) return 70;
  if (score >= 68) return 50; // Average
  if (score >= 60) return 35;
  if (score >= 50) return 20;
  if (score >= 40) return 10;
  return 5;
}

/**
 * Convert SUS score to letter grade
 */
function scoreToGrade(score: number): 'F' | 'D' | 'C' | 'B' | 'A' {
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

/**
 * Convert SUS score to adjective rating
 * Based on Bangor, Kortum & Miller (2009) research
 */
function scoreToAdjective(
  score: number
): 'Worst Imaginable' | 'Awful' | 'Poor' | 'OK' | 'Good' | 'Excellent' | 'Best Imaginable' {
  if (score >= 90) return 'Best Imaginable';
  if (score >= 85) return 'Excellent';
  if (score >= 73) return 'Good';
  if (score >= 52) return 'OK';
  if (score >= 39) return 'Poor';
  if (score >= 25) return 'Awful';
  return 'Worst Imaginable';
}

/**
 * Generate interpretation text for the score
 */
function generateInterpretation(score: number): string {
  if (score >= 85) {
    return 'Excellent! Users find the system highly usable and are very satisfied.';
  } else if (score >= 75) {
    return 'Good usability. Users are generally satisfied and find the system easy to use.';
  } else if (score >= 68) {
    return 'Average usability. The system is acceptable but has room for improvement.';
  } else if (score >= 50) {
    return 'Below average usability. Users experience notable difficulties and frustrations.';
  } else {
    return 'Poor usability. Significant improvements needed to meet user needs.';
  }
}

/**
 * Standard SUS questions
 */
export const SUS_QUESTIONS = [
  {
    id: 'q1',
    text: 'I think that I would like to use this system frequently',
    type: 'positive' as const,
  },
  {
    id: 'q2',
    text: 'I found the system unnecessarily complex',
    type: 'negative' as const,
  },
  {
    id: 'q3',
    text: 'I thought the system was easy to use',
    type: 'positive' as const,
  },
  {
    id: 'q4',
    text: 'I think that I would need the support of a technical person to be able to use this system',
    type: 'negative' as const,
  },
  {
    id: 'q5',
    text: 'I found the various functions in this system were well integrated',
    type: 'positive' as const,
  },
  {
    id: 'q6',
    text: 'I thought there was too much inconsistency in this system',
    type: 'negative' as const,
  },
  {
    id: 'q7',
    text: 'I would imagine that most people would learn to use this system very quickly',
    type: 'positive' as const,
  },
  {
    id: 'q8',
    text: 'I found the system very cumbersome to use',
    type: 'negative' as const,
  },
  {
    id: 'q9',
    text: 'I felt very confident using the system',
    type: 'positive' as const,
  },
  {
    id: 'q10',
    text: 'I needed to learn a lot of things before I could get going with this system',
    type: 'negative' as const,
  },
];

/**
 * Likert scale options for SUS questions
 */
export const LIKERT_SCALE = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly Agree' },
];
