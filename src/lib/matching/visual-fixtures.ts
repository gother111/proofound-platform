import { isMockSupabaseEnabled } from '@/lib/env';

export type MatchingVisualState = 'filled' | 'empty';

export function matchingVisualFixturesEnabled() {
  return (
    isMockSupabaseEnabled() &&
    process.env.PROOFOUND_VISUAL_FIXTURES === 'true' &&
    process.env.VERCEL_ENV !== 'production'
  );
}

export function getMatchingVisualState(
  requestUrl?: string | URL | null
): MatchingVisualState | null {
  const envState = process.env.PROOFOUND_MATCHING_VISUAL_STATE;
  if (envState === 'filled' || envState === 'empty') {
    return envState;
  }

  if (!requestUrl) {
    return null;
  }

  const url = typeof requestUrl === 'string' ? new URL(requestUrl) : requestUrl;
  const state = url.searchParams.get('visualState');
  return state === 'filled' || state === 'empty' ? state : null;
}

export function buildVisualMatchingProfile(userId: string) {
  return {
    id: 'visual-matching-profile',
    profileId: userId,
    timezone: 'Europe/Stockholm',
    languages: [{ code: 'en', level: 'C1' }],
    verified: { work_email: true, manager_attestation: true },
    rightToWork: 'yes',
    country: 'SE',
    city: 'Stockholm',
    availabilityEarliest: '2026-06-01',
    availabilityLatest: '2026-08-15',
    workMode: 'remote',
    engagementType: 'contract_consulting',
    radiusKm: 25,
    hoursMin: 24,
    hoursMax: 32,
    compMin: 90000,
    compMax: 130000,
    compPeriod: 'annual',
    currency: 'EUR',
    desiredRoles: ['Proof systems lead', 'Evidence operations consultant'],
    desiredIndustries: ['Hiring technology', 'Civic infrastructure'],
    preferredIndustryKeys: ['hiring-technology', 'civic-infrastructure'],
    preferredIndustryLabels: ['Hiring technology', 'Civic infrastructure'],
    avoidIndustryKeys: [],
    avoidIndustryLabels: [],
    orgTypes: ['startup', 'ngo'],
    skills: [
      {
        id: 'visual-skill-proof-systems',
        skillId: 'proof-systems',
        skillCode: 'proof-systems',
        level: 4,
        monthsExperience: 36,
        lastUsedAt: '2026-05-01',
      },
      {
        id: 'visual-skill-privacy-review',
        skillId: 'privacy-review',
        skillCode: 'privacy-review',
        level: 4,
        monthsExperience: 30,
        lastUsedAt: '2026-04-24',
      },
      {
        id: 'visual-skill-launch-ops',
        skillId: 'launch-ops',
        skillCode: 'launch-ops',
        level: 3,
        monthsExperience: 24,
        lastUsedAt: '2026-04-12',
      },
    ],
  };
}

export function buildVisualMatchingReadinessActions() {
  return [
    {
      id: 'visual-match-preferences',
      title: 'Tune match preferences',
      description: 'Adjust work mode, availability, and compensation before sending interest.',
      actionUrl: '/app/i/matching/preferences',
    },
    {
      id: 'visual-proof-pack',
      title: 'Refresh proof pack',
      description: 'Keep the strongest proof example easy for organizations to review.',
      actionUrl: '/app/i/profile?profileView=full&tab=proof_packs',
    },
    {
      id: 'visual-privacy-check',
      title: 'Review privacy settings',
      description: 'Confirm what stays masked before an introduction is approved.',
      actionUrl: '/app/i/settings/privacy',
    },
  ];
}

export function buildVisualIndividualMatches() {
  return [
    {
      id: 'visual-individual-match-1',
      assignmentId: 'visual-assignment-proof-ops',
      score: 0.86,
      scoreTotal: 8600,
      subscores: {
        skills: 0.88,
        constraints: 0.8,
        verifications: 0.84,
        recency: 0.91,
        compensation: 0.74,
      },
      contributions: {
        skills_fit: 0.88,
        proof_fit: 0.91,
        constraints_fit: 0.8,
        verification_fit: 0.84,
      },
      gaps: [],
      missing: [],
      assignment: {
        role: 'Proof operations lead for a privacy-safe hiring corridor',
        locationMode: 'remote',
        workMode: 'contract',
        country: 'SE',
        hoursMin: 24,
        hoursMax: 32,
        compMin: 95000,
        compMax: 125000,
        currency: 'EUR',
        skills: {
          'proof-systems': { level: 4 },
          'privacy-review': { level: 4 },
          'launch-ops': { level: 3 },
        },
      },
      focusBoost: {
        total: 0.08,
        matched: { role: true, industry: true, orgType: false },
        contributions: { role: 0.04, industry: 0.04, orgType: 0 },
      },
      reasonCodes: ['skills_fit_high', 'recent_proof', 'privacy_ready'],
    },
    {
      id: 'visual-individual-match-2',
      assignmentId: 'visual-assignment-evidence-systems',
      score: 0.72,
      scoreTotal: 7200,
      subscores: {
        skills: 0.76,
        constraints: 0.7,
        verifications: 0.72,
        recency: 0.78,
        compensation: 0.62,
      },
      contributions: {
        skills_fit: 0.76,
        proof_fit: 0.78,
        constraints_fit: 0.7,
        verification_fit: 0.72,
      },
      gaps: [{ id: 'stakeholder-enablement', required: 4, have: 3 }],
      missing: ['stakeholder-enablement'],
      assignment: {
        role: 'Evidence systems consultant',
        locationMode: 'hybrid',
        workMode: 'part-time',
        country: 'SE',
        hoursMin: 16,
        hoursMax: 24,
        compMin: 80000,
        compMax: 105000,
        currency: 'EUR',
        skills: {
          'proof-systems': { level: 4 },
          'stakeholder-enablement': { level: 3 },
          'privacy-review': { level: 3 },
        },
      },
      focusBoost: {
        total: 0.05,
        matched: { role: true, industry: false, orgType: true },
        contributions: { role: 0.03, industry: 0, orgType: 0.02 },
      },
      reasonCodes: ['proof_fit_good', 'constraints_fit_good'],
    },
  ];
}

export function buildVisualOrgMatches(assignmentId: string): any[] {
  return [
    {
      id: 'visual-match-1',
      profileId: 'visual-profile-1',
      score: 0.94,
      scoreTotal: 100,
      reasonCodes: ['skills_fit_high', 'recent_proof', 'privacy_ready'],
      profile: {
        skills: {
          'program-operations': { level: 4 },
          'stakeholder-updates': { level: 4 },
          'risk-logs': { level: 3 },
        },
        timezone: 'Europe/Stockholm',
        country: 'SE',
        city: 'Stockholm',
        rightToWork: 'yes',
        workMode: 'remote',
      },
      reviewStage: 'blind_review',
      revealScope: 'blind',
      visibleIdentityFields: [],
      corridorState: 'shortlist',
      fairness: { status: 'pass' },
      rankBand: 'Highest-priority proof review',
      why: {
        summary: [
          'Very strong proof alignment',
          'Critical role requirements have supporting proof.',
        ],
        sections: [
          {
            title: 'Verified Competence',
            bullets: [
              'Demonstrated Lvl 4 Program Operations over 36 months.',
              'Verified stakeholder updates and risk log management experience.',
            ],
          },
        ],
      },
      reviewCard: {
        candidateLabel: 'Candidate A',
        strongestProof: {
          summary:
            'Led the deployment of a new proof-verification framework across 4 cross-functional team workflows.',
          outcome:
            'Achieved a 99.8% audit pass rate and reduced verification latency from weeks to under 4 hours.',
          ownership: 'Sole Owner & Architect',
          anchorContext: 'Experience at TechCorp (36 months)',
          freshnessLabel: 'Verified 2 weeks ago',
        },
        verification: {
          summaryLabel: 'Verified proof pack review present',
          count: 3,
        },
        trustLabels: ['Verified Email', 'Audit Cleared'],
        fitBand: 'Highest-priority',
        fitSummary: {
          headline: 'Strong technical and timezone alignment.',
          bullets: [
            'Verified C1 English proficiency.',
            'Has 3+ years experience with proof systems.',
            'Located in Europe/Stockholm.',
          ],
          reasonCodes: ['skills_fit_high', 'recent_proof'],
        },
        privacy: {
          reviewState: 'visible',
          reasons: [],
        },
      },
    },
    {
      id: 'visual-match-2',
      profileId: 'visual-profile-2',
      score: 0.88,
      scoreTotal: 100,
      reasonCodes: ['proof_fit_good', 'constraints_fit_good'],
      profile: {
        skills: {
          'systems-engineering': { level: 5 },
          compliance: { level: 4 },
        },
        timezone: 'Europe/Stockholm',
        country: 'SE',
        city: 'Gothenburg',
        rightToWork: 'yes',
        workMode: 'hybrid',
      },
      reviewStage: 'blind_review',
      revealScope: 'blind',
      visibleIdentityFields: [],
      corridorState: 'shortlist',
      fairness: { status: 'pass' },
      rankBand: 'High-priority proof review',
      why: {
        summary: ['Strong proof alignment', 'Compliance and systems evidence match the brief.'],
        sections: [
          {
            title: 'Verified Competence',
            bullets: ['Expert system engineer with compliance certification.'],
          },
        ],
      },
      reviewCard: {
        candidateLabel: 'Candidate B',
        strongestProof: {
          summary:
            'Architected a highly resilient systems integration platform compliant with ISO 27001 standards.',
          outcome: 'Passed independent external compliance audit with zero observations.',
          ownership: 'Technical Lead',
          anchorContext: 'Experience at SafeSystems (48 months)',
          freshnessLabel: 'Verified 1 month ago',
        },
        verification: {
          summaryLabel: 'Verified security certification present',
          count: 2,
        },
        trustLabels: ['ISO 27001 Certified', 'Reference Attestation'],
        fitBand: 'High-priority',
        fitSummary: {
          headline: 'Robust engineering background.',
          bullets: [
            'Strong systems engineering (Level 5).',
            'ISO 27001 audit experience.',
            'Based in Gothenburg (hybrid available).',
          ],
          reasonCodes: ['proof_fit_good', 'constraints_fit_good'],
        },
        privacy: {
          reviewState: 'visible',
          reasons: [],
        },
      },
    },
    {
      id: 'visual-match-3',
      profileId: 'visual-profile-3',
      score: 0.82,
      scoreTotal: 100,
      reasonCodes: ['skills_fit_high', 'privacy_ready'],
      profile: {
        skills: {
          'product-management': { level: 4 },
          'data-analysis': { level: 4 },
        },
        timezone: 'Europe/Stockholm',
        country: 'SE',
        city: 'Malmö',
        rightToWork: 'yes',
        workMode: 'remote',
      },
      reviewStage: 'blind_review',
      revealScope: 'blind',
      visibleIdentityFields: [],
      corridorState: 'shortlist',
      fairness: { status: 'pass' },
      rankBand: 'Priority proof review',
      why: {
        summary: ['Clear proof alignment', 'Product and data evidence match the brief.'],
        sections: [
          {
            title: 'Product Focus',
            bullets: ['Experienced in data-driven product management.'],
          },
        ],
      },
      reviewCard: {
        candidateLabel: 'Candidate C',
        strongestProof: {
          summary:
            'Designed and launched the analytics dashboard that serves over 50,000 active monthly users.',
          outcome: 'Increased feature adoption by 40% within the first two quarters.',
          ownership: 'Product Manager',
          anchorContext: 'Experience at DataFlow (24 months)',
          freshnessLabel: 'Verified 3 weeks ago',
        },
        verification: {
          summaryLabel: 'Verified education & references',
          count: 2,
        },
        trustLabels: ['Verified Degree', 'Reference Verified'],
        fitBand: 'Priority',
        fitSummary: {
          headline: 'Data-driven Product Manager.',
          bullets: [
            'Strong analytics skills.',
            'Managed scale products successfully.',
            'Ready to start remotely.',
          ],
          reasonCodes: ['skills_fit_high', 'privacy_ready'],
        },
        privacy: {
          reviewState: 'visible',
          reasons: [],
        },
      },
    },
    {
      id: 'visual-match-4',
      profileId: 'visual-profile-4',
      score: 0.78,
      scoreTotal: 100,
      reasonCodes: ['proof_fit_good'],
      profile: {
        skills: {
          'frontend-engineering': { level: 4 },
          'ui-ux-design': { level: 4 },
        },
        timezone: 'Europe/London',
        country: 'GB',
        city: 'London',
        rightToWork: 'no',
        workMode: 'remote',
      },
      reviewStage: 'blind_review',
      revealScope: 'blind',
      visibleIdentityFields: [],
      corridorState: 'shortlist',
      fairness: { status: 'pass' },
      rankBand: 'Strong proof review',
      why: {
        summary: ['Clear proof alignment', 'Design and development evidence are balanced.'],
        sections: [
          {
            title: 'Design Systems',
            bullets: ['Built component libraries and design-to-code workflows.'],
          },
        ],
      },
      reviewCard: {
        candidateLabel: 'Candidate D',
        strongestProof: {
          summary:
            'Created and open-sourced a React-based Tailwind CSS components library with 10k+ stars.',
          outcome: 'Widely adopted in the developer community; robust test coverage verified.',
          ownership: 'Lead Contributor',
          anchorContext: 'Independent Open Source Work',
          freshnessLabel: 'Verified 2 months ago',
        },
        verification: {
          summaryLabel: 'Verified public portfolio',
          count: 1,
        },
        trustLabels: ['GitHub Contributor', 'Verified Portfolio'],
        fitBand: 'Strong',
        fitSummary: {
          headline: 'Design Engineer with strong portfolio.',
          bullets: [
            'Strong React & CSS skills.',
            'Maintains popular open-source packages.',
            'Prefers remote contract roles.',
          ],
          reasonCodes: ['proof_fit_good'],
        },
        privacy: {
          reviewState: 'visible',
          reasons: [],
        },
      },
    },
    {
      id: 'visual-match-5',
      profileId: 'visual-profile-5',
      score: 0.71,
      scoreTotal: 100,
      reasonCodes: ['constraints_fit_good'],
      profile: {
        skills: {
          devops: { level: 5 },
          'cloud-architecture': { level: 4 },
        },
        timezone: 'Europe/Stockholm',
        country: 'SE',
        city: 'Stockholm',
        rightToWork: 'yes',
        workMode: 'onsite',
      },
      reviewStage: 'blind_review',
      revealScope: 'blind',
      visibleIdentityFields: [],
      corridorState: 'shortlist',
      fairness: { status: 'pass' },
      rankBand: 'Clear proof review',
      why: {
        summary: ['Relevant proof alignment', 'Cloud and DevOps evidence supports review.'],
        sections: [
          {
            title: 'Infrastructure',
            bullets: ['Extensive AWS, Kubernetes, and IaC experience.'],
          },
        ],
      },
      reviewCard: {
        candidateLabel: 'Candidate E',
        strongestProof: {
          summary: 'Migrated legacy container orchestrator to AWS EKS with zero downtime.',
          outcome: 'Reduced hosting bill by 35% and increased deployment speed 3x.',
          ownership: 'Lead DevOps',
          anchorContext: 'Experience at CloudScale (36 months)',
          freshnessLabel: 'Verified 4 weeks ago',
        },
        verification: {
          summaryLabel: 'AWS Certified Solutions Architect',
          count: 2,
        },
        trustLabels: ['AWS Certified', 'Manager Attestation'],
        fitBand: 'Clear',
        fitSummary: {
          headline: 'Experienced Cloud & DevOps Engineer.',
          bullets: [
            'Kubernetes and Terraform expert.',
            'Proven cost reduction achievements.',
            'Stockholm onsite preferred.',
          ],
          reasonCodes: ['constraints_fit_good'],
        },
        privacy: {
          reviewState: 'visible',
          reasons: [],
        },
      },
    },
    {
      id: 'visual-match-6',
      profileId: 'visual-profile-6',
      score: 0.91,
      scoreTotal: 100,
      reasonCodes: ['skills_fit_high', 'recent_proof'],
      profile: {
        skills: {
          'technical-writing': { level: 4 },
          'content-strategy': { level: 4 },
        },
        timezone: 'Europe/Stockholm',
        country: 'SE',
        city: 'Stockholm',
        rightToWork: 'yes',
        workMode: 'remote',
      },
      reviewStage: 'shortlisted',
      revealScope: 'shortlist_identity',
      visibleIdentityFields: [
        'photo',
        'country',
        'city',
        'desired_roles',
        'timezone',
        'right_to_work',
        'engagement_type',
        'skills',
      ],
      corridorState: 'shortlist',
      fairness: { status: 'pass' },
      rankBand: 'Highest-priority proof review',
      why: {
        summary: ['Very strong proof alignment', 'Technical documentation evidence is recent.'],
        sections: [
          {
            title: 'Documentation',
            bullets: ['Wrote comprehensive developer documentation and APIs guides.'],
          },
        ],
      },
      reviewCard: {
        candidateLabel: 'Candidate F',
        strongestProof: {
          summary:
            'Authored and structured the entire developer documentation portal for a fintech startup.',
          outcome: 'Reduced developer onboarding friction and API support queries by 50%.',
          ownership: 'Lead Technical Writer',
          anchorContext: 'Experience at FinTech (24 months)',
          freshnessLabel: 'Verified 1 week ago',
        },
        verification: {
          summaryLabel: 'Verified technical portfolio',
          count: 3,
        },
        trustLabels: ['Verified Writing', 'Reference Approved'],
        fitBand: 'Highest-priority',
        fitSummary: {
          headline: 'Exceptional writer and content strategist.',
          bullets: [
            'Wrote developer docs from scratch.',
            'Based in Stockholm, remote-ready.',
            'Excellent client feedback.',
          ],
          reasonCodes: ['skills_fit_high', 'recent_proof'],
        },
        privacy: {
          reviewState: 'visible',
          reasons: [],
        },
      },
    },
    {
      id: 'visual-match-7',
      profileId: 'visual-profile-7',
      score: 0.85,
      scoreTotal: 100,
      reasonCodes: ['proof_fit_good', 'privacy_ready'],
      profile: {
        skills: {
          'qa-engineering': { level: 4 },
          'test-automation': { level: 4 },
        },
        timezone: 'Europe/Stockholm',
        country: 'SE',
        city: 'Stockholm',
        rightToWork: 'yes',
        workMode: 'remote',
      },
      reviewStage: 'shortlisted',
      revealScope: 'shortlist_identity',
      visibleIdentityFields: [
        'photo',
        'country',
        'city',
        'desired_roles',
        'timezone',
        'right_to_work',
        'engagement_type',
        'skills',
      ],
      corridorState: 'intro_approved',
      conversationId: 'visual-conv-7',
      fairness: { status: 'pass' },
      rankBand: 'High-priority proof review',
      why: {
        summary: ['Strong proof alignment', 'QA automation evidence is ready for review.'],
        sections: [
          {
            title: 'Test Automation',
            bullets: ['Set up full CI/CD test automation pipelines.'],
          },
        ],
      },
      reviewCard: {
        candidateLabel: 'Candidate G',
        strongestProof: {
          summary:
            'Designed Playwright test framework checking critical user checkout and onboarding paths.',
          outcome: 'Caught 12 critical regression issues in production-candidate builds.',
          ownership: 'QA Architect',
          anchorContext: 'Experience at ShopFlow (36 months)',
          freshnessLabel: 'Verified 2 weeks ago',
        },
        verification: {
          summaryLabel: 'Verified test pipeline quality',
          count: 2,
        },
        trustLabels: ['Playwright Certified', 'Reference Confirmed'],
        fitBand: 'High-priority',
        fitSummary: {
          headline: 'Expert QA Automation Engineer.',
          bullets: [
            'Built CI/CD Playwright suites.',
            'Strong test strategy background.',
            'Stockholm remote role preferred.',
          ],
          reasonCodes: ['proof_fit_good', 'privacy_ready'],
        },
        privacy: {
          reviewState: 'visible',
          reasons: [],
        },
      },
    },
  ];
}
