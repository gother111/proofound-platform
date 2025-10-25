export type ZenPractice = {
  id: string;
  title: string;
  duration: string;
  benefit: string;
  evidenceType: string;
  whatToExpect: string;
  steps: string[];
  evidencePoints: string[];
  adverseNote?: string;
  isThirdParty: boolean;
  goal: string;
  style: string;
  time: number;
  isSpiritual: boolean;
};

export const zenPractices: ZenPractice[] = [
  {
    id: '1',
    title: 'Box Breathing',
    duration: '2m',
    benefit: 'Calm & focus',
    evidenceType: 'meta-reviewed',
    whatToExpect: 'Four equal phases of breath. Reduces anxiety within minutes. Works anywhere.',
    steps: [
      'Breathe in for 4 counts',
      'Hold for 4 counts',
      'Breathe out for 4 counts',
      'Hold for 4 counts',
      'Repeat 4–6 times',
    ],
    evidencePoints: [
      'Meta-analysis of 15 RCTs shows significant reduction in state anxiety (d = 0.39)',
      'Activates parasympathetic nervous system within 90 seconds',
      'No adverse effects reported in clinical trials',
    ],
    isThirdParty: false,
    goal: 'Stress',
    style: 'Secular',
    time: 2,
    isSpiritual: false,
  },
  {
    id: '2',
    title: 'MBSR Body Scan',
    duration: '10m',
    benefit: 'Release tension',
    evidenceType: 'rct-backed',
    whatToExpect:
      "Gentle attention to each part of your body. May notice tension you didn't know was there.",
    steps: [
      'Lie down or sit comfortably',
      'Close your eyes',
      'Bring attention to your feet',
      'Slowly move awareness up through your body',
      'Notice sensations without judgment',
      'End with full-body awareness',
    ],
    evidencePoints: [
      'MBSR programs show 30% reduction in chronic pain intensity (Kabat-Zinn, 1982)',
      'Improves body awareness and reduces rumination',
      'Part of NICE-recommended mindfulness interventions',
    ],
    adverseNote:
      'Some people experience increased awareness of discomfort initially. If distressing, stop and try shorter practice.',
    isThirdParty: false,
    goal: 'Stress',
    style: 'Secular',
    time: 10,
    isSpiritual: false,
  },
  {
    id: '3',
    title: 'MBCT 3-Minute Breathing Space',
    duration: '3m',
    benefit: 'Ground yourself',
    evidenceType: 'nice-recommended',
    whatToExpect: 'Quick reset when overwhelmed. Three simple steps.',
    steps: [
      "Notice: What's happening right now?",
      'Focus: Bring attention to your breath',
      'Expand: Widen awareness to your whole body',
    ],
    evidencePoints: [
      'MBCT reduces depression relapse by 43% (Teasdale et al., 2000)',
      'NICE-recommended for recurrent depression prevention',
      'Accessible mini-practice from full 8-week course',
    ],
    isThirdParty: false,
    goal: 'Stress',
    style: 'Secular',
    time: 3,
    isSpiritual: false,
  },
  {
    id: '4',
    title: 'Isha Kriya',
    duration: '12m',
    benefit: 'Inner peace',
    evidenceType: 'initial',
    whatToExpect: 'Guided meditation with mantra. Rooted in yogic tradition.',
    steps: [
      'Sit with spine erect',
      'Follow breathing pattern',
      'Repeat "I am not the body, I am not even the mind"',
      'Rest in silence',
    ],
    evidencePoints: [
      'Pilot study (n=52) shows improved well-being scores',
      'Preliminary evidence for stress reduction',
      'Larger RCTs needed for definitive claims',
    ],
    isThirdParty: true,
    goal: 'Stress',
    style: 'Spiritual',
    time: 12,
    isSpiritual: true,
  },
  {
    id: '5',
    title: 'Miracle of Mindfulness',
    duration: '7m',
    benefit: 'Present moment awareness',
    evidenceType: 'initial',
    whatToExpect: 'Buddhist-inspired practice. Wash dishes mindfully, drink tea mindfully.',
    steps: [
      'Choose a simple activity',
      'Do it with full attention',
      'Notice when mind wanders',
      'Gently return to the activity',
    ],
    evidencePoints: [
      "Based on Thich Nhat Hanh's teachings",
      'Preliminary research on informal mindfulness practices',
      'Anecdotal reports of increased calm',
    ],
    isThirdParty: true,
    goal: 'Focus',
    style: 'Spiritual',
    time: 7,
    isSpiritual: true,
  },
  {
    id: '6',
    title: 'Local MBSR Course',
    duration: '8 weeks',
    benefit: 'Deep transformation',
    evidenceType: 'rct-backed',
    whatToExpect: 'Weekly 2.5-hour sessions plus daily home practice. Full evidence-based program.',
    steps: [
      'Attend orientation session',
      'Commit to 8 weekly sessions',
      'Practice 45 minutes daily at home',
      'Attend all-day retreat (week 6)',
      'Complete final session',
    ],
    evidencePoints: [
      'Gold-standard mindfulness intervention with 40+ years of research',
      'Reduces anxiety, depression, chronic pain',
      'Effect sizes comparable to medication for some conditions',
    ],
    isThirdParty: false,
    goal: 'Stress',
    style: 'Secular',
    time: 999,
    isSpiritual: false,
  },
];

export type ZenGathering = {
  id: string;
  title: string;
  subtitle: string;
  when: string;
  location: string;
  spotsRemaining: number;
  host: string;
};

export const localGatherings: ZenGathering[] = [
  {
    id: 'oakland',
    title: 'Community Breathwork Circle',
    subtitle: 'Slow the nervous system with neighbours',
    when: 'Tonight · 7:00pm',
    location: 'Proofound Commons, Oakland',
    spotsRemaining: 8,
    host: 'Led by River (Somatic Practitioner)',
  },
  {
    id: 'virtual',
    title: 'Proofound Quiet Hours',
    subtitle: 'Guided deep work with ambient music',
    when: 'Daily · 9:00–11:00am PT',
    location: 'Virtual · Proofound Spaces',
    spotsRemaining: 32,
    host: 'Hosts rotate · RSVP for link',
  },
  {
    id: 'farm',
    title: 'Morning at Tera & Finn’s Farm',
    subtitle: 'Mindful chores, tea, and sunrise reflection',
    when: 'Saturday · 6:30am',
    location: 'Sebastopol regenerative farm',
    spotsRemaining: 3,
    host: 'Carpool list available',
  },
];

export type SupportChannel = {
  id: string;
  label: string;
  description: string;
  contact: string;
};

export const supportChannels: SupportChannel[] = [
  {
    id: 'coach',
    label: '1:1 Coach',
    description: 'Somatic support for proof-based professionals',
    contact: 'Schedule with Nia →',
  },
  {
    id: 'community',
    label: 'Community Check-in',
    description: 'Daily 15-minute accountability drop-in',
    contact: 'Join the loop →',
  },
  {
    id: 'helpline',
    label: 'After-hours grounding',
    description: 'Text-only support. We reply within 5 minutes.',
    contact: 'Text +1 (415) 555-0198',
  },
];

export const toolkitFilters = ['Secular', 'Spiritual', 'Somatic', 'Short', 'Long'];
