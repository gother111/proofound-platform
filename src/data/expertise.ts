export type CapabilitySignal = {
  id: string;
  title: string;
  summary: string;
  proof: string;
  confidence: number;
};

export const capabilitySignals: CapabilitySignal[] = [
  {
    id: 'energy-justice',
    title: 'Energy justice program design',
    summary:
      'Piloted equitable solar incentives with measurable household savings across three municipalities.',
    proof: 'Verified case studies · 9 peer endorsements · 3 regulatory citations',
    confidence: 4,
  },
  {
    id: 'community-fiber',
    title: 'Community fiber deployment',
    summary: 'Coordinated field teams and contractors to light up 12 underserved neighbourhoods.',
    proof: 'Performance reviews · 6 audited milestones · Federal broadband grant compliance',
    confidence: 3,
  },
  {
    id: 'regenerative-finance',
    title: 'Regenerative finance literacy',
    summary: 'Facilitated monthly salons connecting local founders with mission-aligned capital.',
    proof: 'Supabase event logs · 87% attendee retention · Audio transcripts linked to proof vault',
    confidence: 3,
  },
];

export type GrowthMoment = {
  id: string;
  period: string;
  focus: string;
  highlight: string;
  sentiment: string;
};

export const growthTimeline: GrowthMoment[] = [
  {
    id: 'q1',
    period: 'Q1 2025',
    focus: 'Grid innovation sprint',
    highlight: 'Delivered pilot metrics to state energy council 3 weeks early.',
    sentiment: 'Marked as breakthrough · Highest proof density this quarter',
  },
  {
    id: 'q2',
    period: 'Q2 2025',
    focus: 'Mutual aid deployment',
    highlight: 'Mobilized 120 volunteers and 14 mutual aid orgs during wildfire response.',
    sentiment: 'Community verified · Confidence increased across coordination skills',
  },
  {
    id: 'q3',
    period: 'Q3 2025',
    focus: 'Proof-based mentorship',
    highlight: 'Mentored 5 fellows to Level 4 credibility using shared playbooks.',
    sentiment: 'Mentorship stories recorded · 18 artifacts added to vault',
  },
];

export type PersonaMode = 'individual' | 'organization';

export const personaCopy: Record<PersonaMode, { headline: string; description: string }> = {
  individual: {
    headline: 'Proof map for Eva River (individual)',
    description:
      'Shows live credibility levels, mentorship impact, and readiness signals for mission-critical work.',
  },
  organization: {
    headline: 'Proof map for Proofound Cooperative',
    description:
      'Aggregates verified contributions, compliance evidence, and community trust markers across the org.',
  },
};

export const whyItMatters = [
  {
    title: 'Promotion readiness',
    description: 'Proof-based advancement conversations backed by audited artifacts.',
    emoji: '🎯',
  },
  {
    title: 'Internal mobility',
    description: 'Discover adjacent roles and mutual-aid contributions without guesswork.',
    emoji: '🔄',
  },
  {
    title: 'Community signal',
    description: 'Share credibility snapshots externally while keeping raw data private.',
    emoji: '📡',
  },
];
