export type HomepageStoryFrameId =
  | 'hero'
  | 'blind'
  | 'outcomes'
  | 'artifacts'
  | 'verification'
  | 'privacy'
  | 'compatibility'
  | 'precision'
  | 'challenges';

export interface HomepageStoryFrame {
  id: HomepageStoryFrameId;
  step: string;
  eyebrow: string;
  title: string;
  body: string;
  microcopy?: string;
}

export const HOMEPAGE_STORY_FRAMES: HomepageStoryFrame[] = [
  {
    id: 'hero',
    step: '01',
    eyebrow: 'A familiar object',
    title: 'Proof behind the claim',
    body: 'A hiring signal you can trust.',
    microcopy: 'Faster shortlists. Stronger evidence. Fairer review.',
  },
  {
    id: 'blind',
    step: '02',
    eyebrow: 'Bias-aware review',
    title: 'Blind by default',
    body: 'Photo, name, contact details, prestige markers, and other identity signals are removed first. The goal is not anonymity for its own sake. It is capability before bias.',
    microcopy: 'Weak signal should leave before judgment begins.',
  },
  {
    id: 'outcomes',
    step: '03',
    eyebrow: 'Stronger signal',
    title: 'Real outcomes, not bullet points',
    body: 'Vague summaries and floating skill lists resolve into structured outcomes, work scope, ownership, and context. Skills stop existing as decoration and start living next to real work.',
    microcopy: 'The same object becomes clearer, not busier.',
  },
  {
    id: 'artifacts',
    step: '04',
    eyebrow: 'Evidence attached',
    title: 'Backed with proof artifacts',
    body: 'Each outcome can carry links, files, visuals, repositories, certificates, and case fragments. The profile stops asking for belief and starts pointing to proof.',
    microcopy: 'Claims gain artifacts. Signal gains weight.',
  },
  {
    id: 'verification',
    step: '05',
    eyebrow: 'Trust made legible',
    title: 'Verification trust layer',
    body: 'Artifacts alone are not enough. Proofound adds verification states, method markers, and trust signals so reviewers can see why a proof item deserves confidence.',
    microcopy: 'Evidence becomes auditable, not merely present.',
  },
  {
    id: 'privacy',
    step: '06',
    eyebrow: 'Safety by design',
    title: 'Privacy and data safety',
    body: 'Structured proof does not require open exposure. Sensitive context stays protected through controlled visibility, access boundaries, and privacy-safe presentation.',
    microcopy: 'Protection is part of the product, not a footnote.',
  },
  {
    id: 'compatibility',
    step: '07',
    eyebrow: 'System view',
    title: 'Universal compatibility',
    body: 'The proof-backed profile becomes a Proof Pack inside a wider system. Structured assignments enter from one side, proof enters from the other, and a shared assessment layer makes them comparable.',
    microcopy: 'This is not a prettier CV. It is a compatibility model.',
  },
  {
    id: 'precision',
    step: '08',
    eyebrow: 'Ambiguity narrows',
    title: 'For precise solutions',
    body: 'Once requirements and proof are both structured, broad possibility can collapse into a more precise fit. Better matching becomes explainable instead of impressionistic.',
    microcopy: 'Signal sharpens. Fit becomes visible.',
  },
  {
    id: 'challenges',
    step: '09',
    eyebrow: 'Why it matters now',
    title: 'To modern challenges',
    body: 'Organizations waste time reviewing weak applications. Candidates flatten real ability into bullets or overshare to compensate. Proofound gives both sides a more modern starting point.',
    microcopy: 'A stronger hiring signal solves real problems on both sides.',
  },
];

export const MOBILE_STORY_FRAME_IDS: HomepageStoryFrameId[] = [
  'hero',
  'outcomes',
  'verification',
  'compatibility',
  'challenges',
];
