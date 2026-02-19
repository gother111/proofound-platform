export type ActivityEventType =
  | 'goal_progress'
  | 'profile_progress'
  | 'verification_update'
  | 'assignment_readiness'
  | 'new_match'
  | 'message'
  | 'interview';

export type ReadinessActionPriority = 'high' | 'medium' | 'low';

export type ReadinessAction = {
  id: string;
  title: string;
  description: string;
  priority: ReadinessActionPriority;
  category: 'profile' | 'expertise' | 'verification' | 'matching' | 'assignment' | 'process';
  actionUrl: string;
};

export type ReadinessScoreBreakdown = {
  key: string;
  label: string;
  score: number;
  maxScore: number;
  notes?: string;
};

export type ActivityEvent = {
  id: string;
  type: ActivityEventType;
  text: string;
  timestamp: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
};

export type ProofProgressTracker = {
  totalProofs: number;
  verifiedProofs: number;
  pendingVerificationRequests: number;
  completionRate: number;
  nextStep: string;
};

export type IndividualReadiness = {
  readinessScore: number;
  scoreBreakdown: ReadinessScoreBreakdown[];
  topActions: ReadinessAction[];
  proofProgress: ProofProgressTracker;
  skillToOpportunityBridge: Array<{
    skillCode: string;
    skillName: string;
    topRole?: string;
    currentLevel: number;
    targetLevel: number;
    expectedImpactMin: number;
    expectedImpactMax: number;
  }>;
  marketActivityLow: boolean;
  metrics: {
    totalMatches: number;
    highQualityMatches: number;
    pendingVerifications: number;
    skillsCount: number;
  };
};

export type OrganizationReadiness = {
  readinessScore: number;
  scoreBreakdown: ReadinessScoreBreakdown[];
  topActions: ReadinessAction[];
  assignmentReadiness: {
    totalActiveAssignments: number;
    assignmentWithRequirements: number;
    assignmentWithVerificationGates: number;
    assignmentWithClearScope: number;
  };
  talentAvailabilityInsights: Array<{
    skillCode: string;
    skillName: string;
    requiredByAssignments: number;
    availableProfiles: number;
    signal: 'scarce' | 'emerging' | 'available';
  }>;
  marketActivityLow: boolean;
  metrics: {
    totalMatches: number;
    shortlists: number;
    activeAssignments: number;
  };
};

export type MomentumSummary = {
  persona: 'individual' | 'organization';
  marketActivityLow: boolean;
  summary: string;
  topActions: ReadinessAction[];
  updates: ActivityEvent[];
  metrics: Record<string, number>;
  generatedAt: string;
};

export type WeeklyDigestPayload = {
  userId: string;
  persona: 'individual' | 'organization';
  subject: string;
  summary: string;
  topActions: ReadinessAction[];
  updates: ActivityEvent[];
  metrics: Record<string, number>;
  generatedAt: string;
};
