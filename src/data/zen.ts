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
  // Optional: mark very short practices and map to moods/risk states for quick suggestions
  isMicro?: boolean;
  recommendedFor?: RiskState[];
};

export type CheckInScale = {
  score: number;
  label: string;
  description: string;
};

export type ZenCheckInConfig = {
  stressScale: CheckInScale[];
  controlScale: CheckInScale[];
  privacyBanner: string;
  moodUiDensityHints: {
    state: RiskState;
    uiHint: string;
  }[];
  quickPracticePrompt: string;
};

export const riskStates = [
  {
    id: 'calm',
    label: 'Calm & Steady',
    tone: 'bg-proofound-forest text-white',
    description: 'Clear to focus · light check-ins only',
  },
  {
    id: 'focus',
    label: 'Heightened Alert',
    tone: 'bg-amber-600 text-white',
    description: 'Recommend 10 minute reset + breathing stack',
  },
  {
    id: 'support',
    label: 'Need Support',
    tone: 'bg-rose-600 text-white',
    description: 'Pause deliverables · escalate to support team',
  },
] as const;

export type RiskState = (typeof riskStates)[number]['id'];

export const zenCheckInConfig: ZenCheckInConfig = {
  // UI: feed to check-in widget for 1–5 stress/control and mood-based density hints.
  stressScale: [
    { score: 1, label: 'Very low', description: 'Body feels loose; breathing steady.' },
    { score: 2, label: 'Low', description: 'Slight tension but manageable.' },
    { score: 3, label: 'Neutral', description: 'Noticeable tension; still focused.' },
    { score: 4, label: 'High', description: 'Hard to focus; body feels tight.' },
    { score: 5, label: 'Very high', description: 'Overwhelmed; need immediate reset.' },
  ],
  controlScale: [
    { score: 1, label: 'Out of control', description: 'Feel stuck; no clear next step.' },
    { score: 2, label: 'Low control', description: 'Need support or a pause.' },
    { score: 3, label: 'Some control', description: 'Can act after a short reset.' },
    { score: 4, label: 'High control', description: 'Have options; can prioritize.' },
    { score: 5, label: 'Very high', description: 'Clear plan; calm execution.' },
  ],
  privacyBanner:
    'Private by default. Zen Hub data is never used to rank or match you and stays in a separate secure partition.',
  moodUiDensityHints: [
    { state: 'support', uiHint: 'Hide non-essential panels and highlight 1-minute practice.' },
    { state: 'focus', uiHint: 'Show only next actions and one short practice suggestion.' },
    { state: 'calm', uiHint: 'Full UI with optional focus timers and longer practices.' },
  ],
  quickPracticePrompt: 'Pick a 1-minute reset to lower stress before continuing.',
};

export const zenPractices: ZenPractice[] = [
  {
    id: 'quick-calm',
    title: 'Quick Calm Breath',
    duration: '1m',
    benefit: 'Instant reset',
    evidenceType: 'physiologic-response',
    whatToExpect: 'Simple extended exhale to activate the vagus nerve.',
    steps: [
      'Inhale deeply through nose (4s)',
      'Sigh out through mouth (6s)',
      'Repeat 6 times',
      'Notice the drop in shoulder tension',
    ],
    evidencePoints: [
      'Extended exhalation triggers parasympathetic response',
      'Lowers heart rate within 60 seconds',
    ],
    isThirdParty: false,
    goal: 'Stress',
    style: 'Somatic',
    time: 1,
    isSpiritual: false,
    isMicro: true,
    recommendedFor: ['support', 'focus'],
  },
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
    isMicro: true,
    recommendedFor: ['focus', 'calm'],
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
    recommendedFor: ['calm'],
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
    isMicro: true,
    recommendedFor: ['support', 'focus'],
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
    recommendedFor: ['focus'],
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
    recommendedFor: ['calm'],
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
    recommendedFor: ['calm'],
  },
];

export type ReflectionPrompt = {
  trigger: 'rejection' | 'interview' | 'offer';
  prompt: string;
};

export const reflectionPrompts: ReflectionPrompt[] = [
  // UI: show after milestones like rejection/interview/offer; store privately.
  {
    trigger: 'rejection',
    prompt:
      'What felt outside your control, and what one thing could you try differently next time?',
  },
  {
    trigger: 'rejection',
    prompt: 'Name one skill you showed that you want to keep sharpening.',
  },
  {
    trigger: 'interview',
    prompt: 'Where did you feel most confident in the conversation?',
  },
  {
    trigger: 'interview',
    prompt: 'Which question made you pause? Draft a tighter 2-sentence answer now.',
  },
  {
    trigger: 'offer',
    prompt: 'List the top three signals that make this opportunity feel aligned.',
  },
  {
    trigger: 'offer',
    prompt: 'What boundaries or needs do you want to state before accepting?',
  },
];

export type Assessment = {
  id: string;
  name: string;
  duration: string;
  source: string;
  disclaimer: string;
  resultScale: string;
  suggestedUse: string;
};

export const assessments: Assessment[] = [
  // UI: lightweight, non-diagnostic self-assessments shown under Zen → Assessments.
  {
    id: 'stress-mini',
    name: 'Stress Pulse (1–5)',
    duration: '45s',
    source: 'Proofound prompts (non-diagnostic)',
    disclaimer: 'For personal reflection only; not a medical tool.',
    resultScale: 'Shows a simple stress trend and nudge to a 1-minute practice.',
    suggestedUse: 'Use after a rejection or intense work block to decide if you pause.',
  },
  {
    id: 'control-sense',
    name: 'Sense of Control Quick Check',
    duration: '45s',
    source: 'Proofound prompts (non-diagnostic)',
    disclaimer: 'Private; never used for ranking.',
    resultScale: 'Visualizes change in control sense over 14/30 days.',
    suggestedUse: 'Run weekly to see if workload nudges are helping.',
  },
  {
    id: 'focus-readiness',
    name: 'Focus Readiness (micro)',
    duration: '30s',
    source: 'Proofound prompts (non-diagnostic)',
    disclaimer: 'Private reflection; no medical claims.',
    resultScale: 'Suggests a 1–3 minute practice before deep work.',
    suggestedUse: 'Start of day to pair with a quick practice.',
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
  city?: string;
  cost?: 'free' | 'donation' | 'paid';
  requiresLocationConsent?: boolean;
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
    city: 'Oakland, CA',
    cost: 'donation',
    requiresLocationConsent: false,
  },
  {
    id: 'virtual',
    title: 'Proofound Quiet Hours',
    subtitle: 'Guided deep work with ambient music',
    when: 'Daily · 9:00–11:00am PT',
    location: 'Virtual · Proofound Spaces',
    spotsRemaining: 32,
    host: 'Hosts rotate · RSVP for link',
    city: 'Remote',
    cost: 'free',
    requiresLocationConsent: false,
  },
  {
    id: 'farm',
    title: 'Morning at Tera & Finn’s Farm',
    subtitle: 'Mindful chores, tea, and sunrise reflection',
    when: 'Saturday · 6:30am',
    location: 'Sebastopol regenerative farm',
    spotsRemaining: 3,
    host: 'Carpool list available',
    city: 'Sebastopol, CA',
    cost: 'donation',
    requiresLocationConsent: true,
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

export type ExternalResource = {
  id: string;
  title: string;
  provider: string;
  url: string;
  cost: 'free' | 'paid' | 'freemium';
  tags: string[];
  description: string;
  isExternal: true;
  safetyNote?: string;
};

export const externalResources: ExternalResource[] = [
  // UI: Zen → Explore cards; always label as external and non-diagnostic.
  {
    id: 'headspace-box',
    title: 'Box Breathing (Guided)',
    provider: 'Headspace',
    url: 'https://www.headspace.com/mindfulness/box-breathing',
    cost: 'freemium',
    tags: ['breathwork', 'short', 'stress'],
    description: '90-second guided box breath with visuals. Good before interviews.',
    isExternal: true,
  },
  {
    id: 'wakingup-scan',
    title: 'Body Scan (10m)',
    provider: 'Waking Up',
    url: 'https://dynamic.wakingup.com/body-scan',
    cost: 'freemium',
    tags: ['body', 'awareness', 'stress'],
    description: 'Gentle, secular body scan to lower rumination.',
    isExternal: true,
  },
  {
    id: 'youtube-physio-sigh',
    title: 'Physiological Sigh (1m)',
    provider: 'Huberman Lab',
    url: 'https://www.youtube.com/watch?v=2c9WZCNM1nQ',
    cost: 'free',
    tags: ['breathwork', 'micro', 'stress'],
    description: 'Two quick inhales, slow exhale; proven to drop arousal fast.',
    isExternal: true,
    safetyNote: 'If dizzy, pause and return to normal breathing.',
  },
];

export type BurnoutDefaults = {
  categories: { id: string; label: string; defaultHours?: number }[];
  alertThresholds: { soft: number; hard: number; unit: 'hours_per_week' };
  quietHours: { start: string; end: string; timezoneNote: string };
  shiftWorkerNote: string;
};

export const burnoutDefaults: BurnoutDefaults = {
  // UI: Zen → Schedule; thresholds for gentle alerts and quiet hours.
  categories: [
    { id: 'primary_role', label: 'Primary role', defaultHours: 35 },
    { id: 'side_projects', label: 'Side projects', defaultHours: 5 },
    { id: 'learning', label: 'Learning', defaultHours: 4 },
    { id: 'caregiving', label: 'Caregiving', defaultHours: 6 },
  ],
  alertThresholds: {
    soft: 45,
    hard: 55,
    unit: 'hours_per_week',
  },
  quietHours: {
    start: '22:00',
    end: '07:00',
    timezoneNote: 'Adjusts to user timezone; nudges respect quiet hours.',
  },
  shiftWorkerNote: 'Shift workers can swap quiet hours and set different day/night bands.',
};

export const locationConsentCopy = {
  // UI: Zen → Local; consent prompt + clear/reset language.
  prompt: 'Share your city to see nearby gatherings. You can clear this anytime.',
  clearAction: 'Clear my location',
  fallback: 'No nearby events? Try a virtual option instead.',
};

export const toolkitFilters = [
  'Secular',
  'Spiritual',
  'Somatic',
  'Short',
  'Long',
  'Micro (≤2m)',
  'Stress',
  'Focus',
];
