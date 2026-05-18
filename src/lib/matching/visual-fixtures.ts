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
