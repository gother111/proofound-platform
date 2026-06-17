import { isMockSupabaseEnabled, visualFixturesRuntimeAllowed } from '@/lib/env';

export type MatchingVisualState = 'filled' | 'empty';

export function matchingVisualFixturesEnabled() {
  return (
    isMockSupabaseEnabled() &&
    process.env.PROOFOUND_VISUAL_FIXTURES === 'true' &&
    visualFixturesRuntimeAllowed()
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
        role: 'Proof operations lead for a privacy-safe assignment review',
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
      reasonCodes: [
        'canonical_skill_overlap',
        'proof_text_overlap',
        'role_relevant_outcome',
        'proof_expectation_overlap',
        'fresh_proof_present',
        'non_self_trust_anchor_present',
        'constraint_match',
        'privacy_safe_for_stage',
      ],
      scoreSnapshotJson: {
        discovery_status: 'review_ready_match',
        fit_band: 'strong_evidence_overlap',
      },
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
      rankBand: null,
      why: {
        summary: ['Strong evidence overlap', 'Fresh anchored proof supports the corridor.'],
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
        candidateLabel: 'Submission A',
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
        fitBand: 'Strong evidence overlap',
        fitSummary: {
          headline: 'Strong evidence overlap with fresh, anchored proof.',
          bullets: [
            'Required operations skills appear in proof-backed work.',
            'Proof outcome matches the assignment handoff goal.',
            'Blind review remains privacy safe at this stage.',
          ],
          reasonCodes: ['canonical_skill_overlap', 'proof_text_overlap', 'role_relevant_outcome'],
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
      reasonCodes: [
        'alias_skill_overlap',
        'proof_text_overlap',
        'fresh_proof_present',
        'non_self_trust_anchor_present',
        'constraint_match',
        'privacy_safe_for_stage',
      ],
      scoreSnapshotJson: {
        discovery_status: 'review_ready_match',
        fit_band: 'relevant_partial',
      },
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
      rankBand: null,
      why: {
        summary: ['Relevant partial match', 'Alias and proof text signals support review.'],
        sections: [
          {
            title: 'Verified Competence',
            bullets: ['Expert system engineer with compliance certification.'],
          },
        ],
      },
      reviewCard: {
        candidateLabel: 'Submission B',
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
        fitBand: 'Relevant partial',
        fitSummary: {
          headline: 'Relevant partial match through adjacent evidence wording.',
          bullets: [
            'Proof text overlaps the assignment evidence expectations.',
            'Trust anchor is present for the relevant proof corridor.',
            'Constraints look compatible for review, not automatic intro.',
          ],
          reasonCodes: ['alias_skill_overlap', 'proof_text_overlap', 'constraint_match'],
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
      reasonCodes: [
        'custom_wording_overlap',
        'proof_text_overlap',
        'role_relevant_outcome',
        'fresh_proof_present',
        'constraint_match',
        'privacy_safe_for_stage',
      ],
      scoreSnapshotJson: {
        discovery_status: 'review_ready_match',
        fit_band: 'relevant_partial',
      },
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
      rankBand: null,
      why: {
        summary: ['Relevant partial match', 'Custom wording overlaps outcome evidence.'],
        sections: [
          {
            title: 'Product Focus',
            bullets: ['Experienced in data-driven product management.'],
          },
        ],
      },
      reviewCard: {
        candidateLabel: 'Submission C',
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
        fitBand: 'Relevant partial',
        fitSummary: {
          headline: 'Custom wording overlaps the assignment outcome.',
          bullets: [
            'Outcome text maps to the assignment impact language.',
            'Fresh proof is present for review.',
            'Non-self trust is still needed before intro.',
          ],
          reasonCodes: ['custom_wording_overlap', 'role_relevant_outcome'],
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
      reasonCodes: [
        'adjacent_skill_overlap',
        'custom_wording_overlap',
        'low_supply_expanded_discovery',
        'privacy_safe_for_stage',
      ],
      scoreSnapshotJson: {
        discovery_status: 'possible_discovery_match',
        fit_band: 'adjacent_exploratory',
      },
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
      rankBand: null,
      why: {
        summary: ['Adjacent exploratory discovery', 'Low supply expanded the review pool.'],
        sections: [
          {
            title: 'Design Systems',
            bullets: ['Built component libraries and design-to-code workflows.'],
          },
        ],
      },
      reviewCard: {
        candidateLabel: 'Submission D',
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
        fitBand: 'Adjacent exploratory',
        fitSummary: {
          headline: 'Adjacent exploratory signal only.',
          bullets: [
            'Adjacent skills may help with workflow handoff design.',
            'Low candidate supply widened discovery.',
            'This is not intro-ready without stronger proof and gates.',
          ],
          reasonCodes: ['adjacent_skill_overlap', 'low_supply_expanded_discovery'],
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
      reasonCodes: [
        'proof_expectation_overlap',
        'fresh_proof_missing',
        'constraint_match',
        'privacy_safe_for_stage',
      ],
      scoreSnapshotJson: {
        discovery_status: 'review_ready_match',
        fit_band: 'needs_more_proof',
      },
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
      rankBand: null,
      why: {
        summary: ['Needs more proof', 'Proof expectation overlap is not fresh enough for intro.'],
        sections: [
          {
            title: 'Infrastructure',
            bullets: ['Extensive AWS, Kubernetes, and IaC experience.'],
          },
        ],
      },
      reviewCard: {
        candidateLabel: 'Submission E',
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
        fitBand: 'Needs more proof',
        fitSummary: {
          headline: 'Needs more fresh role-relevant proof.',
          bullets: [
            'Proof expectations overlap the assignment.',
            'Fresh role-relevant proof is missing.',
            'Intro stays blocked until the proof gate is satisfied.',
          ],
          reasonCodes: ['proof_expectation_overlap', 'fresh_proof_missing'],
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
      reasonCodes: [
        'canonical_skill_overlap',
        'proof_text_overlap',
        'role_relevant_outcome',
        'fresh_proof_present',
        'non_self_trust_anchor_present',
        'constraint_match',
        'privacy_safe_for_stage',
      ],
      scoreSnapshotJson: {
        discovery_status: 'intro_ready_match',
        fit_band: 'strong_evidence_overlap',
      },
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
      rankBand: null,
      why: {
        summary: ['Intro-ready evidence gate', 'Fresh anchored proof is available.'],
        sections: [
          {
            title: 'Documentation',
            bullets: ['Wrote comprehensive developer documentation and APIs guides.'],
          },
        ],
      },
      reviewCard: {
        candidateLabel: 'Submission F',
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
        fitBand: 'Strong evidence overlap',
        fitSummary: {
          headline: 'Intro-ready after shortlist review.',
          bullets: [
            'Required skills and proof outcome overlap the assignment.',
            'Fresh proof and non-self trust anchor are present.',
            'Identity-bearing reveal remains candidate-consented.',
          ],
          reasonCodes: [
            'canonical_skill_overlap',
            'proof_text_overlap',
            'non_self_trust_anchor_present',
          ],
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
      reasonCodes: [
        'alias_skill_overlap',
        'proof_text_overlap',
        'fresh_proof_present',
        'non_self_trust_anchor_present',
        'constraint_match',
        'privacy_safe_for_stage',
      ],
      scoreSnapshotJson: {
        discovery_status: 'intro_ready_match',
        fit_band: 'relevant_partial',
      },
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
      rankBand: null,
      why: {
        summary: ['Intro already open', 'Alias and proof text evidence supported the corridor.'],
        sections: [
          {
            title: 'Test Automation',
            bullets: ['Set up full CI/CD test automation pipelines.'],
          },
        ],
      },
      reviewCard: {
        candidateLabel: 'Submission G',
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
        fitBand: 'Relevant partial',
        fitSummary: {
          headline: 'Intro already open from a relevant partial match.',
          bullets: [
            'Alias and proof text signals were enough for shortlist review.',
            'Trust and freshness gates are present.',
            'Conversation is open after consented reveal.',
          ],
          reasonCodes: ['alias_skill_overlap', 'proof_text_overlap'],
        },
        privacy: {
          reviewState: 'visible',
          reasons: [],
        },
      },
    },
  ];
}
