/**
 * Fairness Note Types
 *
 * PRD: Part 2 (line 90-92), Part 5 F4
 * Defines types for automated fairness note generation
 */

export interface DemographicCohort {
  cohortId: string;
  cohortName: string;
  size: number;
  protected: boolean; // Whether this is a protected/underrepresented group
}

export interface CohortMetrics {
  cohort: DemographicCohort;
  introductionRate: number; // Percentage of profiles that received intros
  contractRate: number; // Percentage of intros that became contracts
  avgMatchScore: number;
  avgTimeToFirstIntro: number; // In hours
  sampleSize: number;
}

export interface FairnessGap {
  cohortA: string;
  cohortB: string;
  introductionGap: number; // Percentage point difference
  contractGap: number;
  statisticallySignificant: boolean;
  pValue: number;
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
}

export interface FairnessAnalysis {
  period: {
    startDate: Date;
    endDate: Date;
  };
  cohorts: CohortMetrics[];
  gaps: FairnessGap[];
  overallAssessment: 'pass' | 'warning' | 'fail';
  summary: string;
}

export interface FairnessNote {
  id: string;
  version: string;
  generatedAt: Date;
  period: {
    startDate: Date;
    endDate: Date;
  };
  analysis: FairnessAnalysis;
  findings: FairnessFinding[];
  recommendations: FairnessRecommendation[];
  nextReviewDate: Date;
  complianceStatus: 'compliant' | 'monitor' | 'action_required';
}

export interface FairnessFinding {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  category: 'demographic_gap' | 'algorithmic_bias' | 'outcome_disparity' | 'access_barrier';
  title: string;
  description: string;
  affectedCohorts: string[];
  metrics: {
    name: string;
    value: number;
    threshold: number;
    unit: string;
  }[];
}

export interface FairnessRecommendation {
  id: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'algorithm' | 'process' | 'policy' | 'outreach';
  title: string;
  description: string;
  expectedImpact: string;
  estimatedEffort: string;
  targetCohorts?: string[];
}

export interface SavedFairnessNote {
  note: FairnessNote;
  filePath: string;
  savedAt: Date;
}
