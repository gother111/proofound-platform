export const SEEDED_PUBLIC_ORG_TRUST_MONITOR_KEY = 'public_org_trust_page' as const;
export const SEEDED_PUBLIC_ORG_TRUST_SLUG = 'proofound-labs' as const;
export const SEEDED_PUBLIC_ORG_TRUST_PATH =
  `/portfolio/org/${SEEDED_PUBLIC_ORG_TRUST_SLUG}` as const;

export const SEEDED_PUBLIC_ORG_TRUST_FIXTURE = {
  orgId: '0f0f0f0f-1111-4222-8333-444444444444',
  assignmentId: '1a1a1a1a-2222-4333-8444-555555555555',
  organization: {
    slug: SEEDED_PUBLIC_ORG_TRUST_SLUG,
    displayName: 'Proofound Labs',
    type: 'company' as const,
    website: 'https://proofound.io',
    tagline: 'Proof-first hiring should stay calm, credible, and privacy-safe.',
    mission:
      'Build proof-first hiring infrastructure that helps organizations review real work without widening privacy or identity risk.',
    workingContext:
      'Small distributed team working asynchronously with tight review loops and documented decisions.',
    operatingRegion: 'Europe/Stockholm',
    publicPortfolioState: 'public_noindex' as const,
    trustStatus: 'platform_reviewed' as const,
    orgTrustTier: 'reviewed' as const,
  },
  assignment: {
    role: 'Founding product engineer',
    businessValue:
      'Turn trustworthy review rules into shipped product behavior without weakening blind review or proof-first evaluation.',
    locationMode: 'remote',
  },
  visibility: {
    display_name: 'public',
    mission: 'public',
    vision: 'internal_only',
    causes: 'internal_only',
    work_culture: 'internal_only',
    structure: 'internal_only',
    projects: 'internal_only',
    partnerships: 'internal_only',
    goals: 'internal_only',
    impact: 'internal_only',
  } as const,
} as const;

export function shouldMonitorSeededPublicOrgTrustPage() {
  return process.env.VERCEL_ENV !== 'production';
}
