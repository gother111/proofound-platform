import { isMockSupabaseEnabled, visualFixturesRuntimeAllowed } from '@/lib/env';

export const VISUAL_ASSIGNMENT_FIXTURE_IDS = new Set([
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
]);

export const VISUAL_ASSIGNMENT_MOCK_ORG_ID = '99999999-9999-4999-9999-999999999999';

export type VisualAssignmentFixture = {
  id: string;
  orgId: string;
  role: string;
  title: string;
  engagementType: string;
  status: string;
  creationStatus: string;
  builderMode: string;
  businessValue: string;
  expectedImpact: string | null;
  mustHaveSkills: Array<{ id: string; label: string; level: number }>;
  niceToHaveSkills: Array<{ id: string; label: string; level: number }>;
  createdAt: string;
  updatedAt: string;
  matchingSummary: {
    candidateCount: number;
    reviewChangeCount: number;
    lastCandidateAt: string | null;
    lastReviewChangeAt: string | null;
    lastActivityAt: string | null;
  };
  ttfqiWarning: null;
};

export function visualAssignmentFixturesEnabled() {
  return (
    isMockSupabaseEnabled() &&
    process.env.PROOFOUND_VISUAL_FIXTURES === 'true' &&
    visualFixturesRuntimeAllowed()
  );
}

export function isVisualAssignmentFixtureId(assignmentId: string) {
  return VISUAL_ASSIGNMENT_FIXTURE_IDS.has(assignmentId);
}

export function buildVisualAssignmentFixtures(orgId: string): VisualAssignmentFixture[] {
  const now = Date.now();
  const isoHoursAgo = (hours: number) => new Date(now - hours * 60 * 60 * 1000).toISOString();

  return [
    {
      id: '11111111-1111-4111-8111-111111111111',
      orgId,
      role: 'Field operations launch lead for municipal infrastructure handoffs',
      title: 'Field operations launch lead for municipal infrastructure handoffs',
      engagementType: 'full_time',
      status: 'active',
      creationStatus: 'review_ready',
      builderMode: 'basic',
      businessValue:
        'Reduce field handoff delays by turning site constraints into clear weekly launch decisions.',
      expectedImpact:
        'Proof should show owned rollout plans, stakeholder updates, and measured field-readiness decisions.',
      mustHaveSkills: [
        { id: 'program-operations', label: 'Program operations', level: 4 },
        { id: 'stakeholder-updates', label: 'Stakeholder updates', level: 4 },
        { id: 'risk-logs', label: 'Risk logs', level: 3 },
      ],
      niceToHaveSkills: [{ id: 'municipal-procurement', label: 'Municipal procurement', level: 2 }],
      createdAt: isoHoursAgo(96),
      updatedAt: isoHoursAgo(5),
      matchingSummary: {
        candidateCount: 7,
        reviewChangeCount: 2,
        lastCandidateAt: isoHoursAgo(5),
        lastReviewChangeAt: isoHoursAgo(3),
        lastActivityAt: isoHoursAgo(3),
      },
      ttfqiWarning: null,
    },
    {
      id: '22222222-2222-4222-8222-222222222222',
      orgId,
      role: 'Partner readiness analyst',
      title: 'Partner readiness analyst',
      engagementType: 'contract_consulting',
      status: 'draft',
      creationStatus: 'assignment_ready',
      builderMode: 'basic',
      businessValue:
        'Clarify readiness evidence before partner expansion work reaches proof review.',
      expectedImpact: null,
      mustHaveSkills: [
        { id: 'process-mapping', label: 'Process mapping', level: 3 },
        { id: 'partner-ops', label: 'Partner operations', level: 3 },
      ],
      niceToHaveSkills: [],
      createdAt: isoHoursAgo(28),
      updatedAt: isoHoursAgo(2),
      matchingSummary: {
        candidateCount: 0,
        reviewChangeCount: 0,
        lastCandidateAt: null,
        lastReviewChangeAt: null,
        lastActivityAt: null,
      },
      ttfqiWarning: null,
    },
  ];
}

export function getVisualAssignmentFixtureById(
  assignmentId: string,
  orgId: string
): VisualAssignmentFixture | null {
  if (!isVisualAssignmentFixtureId(assignmentId)) {
    return null;
  }

  return buildVisualAssignmentFixtures(orgId).find((item) => item.id === assignmentId) ?? null;
}

export function buildVisualAssignmentDetailResponse(fixture: VisualAssignmentFixture) {
  const outcomes = [
    {
      id: 'visual-outcome-field-readiness',
      metric: 'Field-readiness decisions logged weekly',
      target: '100% of launch blockers have an owner and next step',
      timeframe: 'within the first 8 weeks',
    },
    {
      id: 'visual-outcome-handoff-latency',
      metric: 'Handoff review latency',
      target: 'Reduce average review turnaround to under 48 hours',
      timeframe: 'by week 12',
    },
  ];

  return {
    id: fixture.id,
    orgId: fixture.orgId,
    title: fixture.title,
    role: fixture.role,
    engagementType: fixture.engagementType,
    rolePurpose: fixture.businessValue,
    businessValue: fixture.businessValue,
    workSummary:
      'Coordinate municipal field teams through weekly readiness reviews, stakeholder updates, and clear handoff decisions.',
    description:
      'Coordinate municipal field teams through weekly readiness reviews, stakeholder updates, and clear handoff decisions.',
    proofExpectations: fixture.expectedImpact ?? '',
    expectedImpact: fixture.expectedImpact ?? '',
    expectedOutcomes: outcomes,
    outcomes,
    missionWeight: 33,
    expertiseWeight: 34,
    workModeWeight: 33,
    compensationMin: 95000,
    compensationMax: 125000,
    compMin: 95000,
    compMax: 125000,
    currency: 'EUR',
    hoursMin: 32,
    hoursMax: 40,
    locationMode: 'hybrid',
    city: 'Stockholm',
    country: 'SE',
    startEarliest: null,
    startLatest: null,
    practicalConstraints: {
      locationMode: 'hybrid',
      city: 'Stockholm',
      country: 'SE',
      compMin: 95000,
      compMax: 125000,
      currency: 'EUR',
      hoursMin: 32,
      hoursMax: 40,
      startEarliest: null,
      startLatest: null,
    },
    weights: { mission: 33, expertise: 34, workMode: 33 },
    location: 'hybrid',
    mustHaveSkills: fixture.mustHaveSkills,
    requiredSkills: fixture.mustHaveSkills,
    niceToHaveSkills: fixture.niceToHaveSkills,
    verificationGates: ['identity', 'work_email'],
    status: fixture.status,
    creationStatus: fixture.creationStatus,
    builderMode: fixture.builderMode,
  };
}
