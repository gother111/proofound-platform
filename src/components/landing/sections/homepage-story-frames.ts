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
  title: string;
  body: string;
  microcopy?: string;
}

export const HOMEPAGE_STORY_FRAMES: HomepageStoryFrame[] = [
  {
    id: 'hero',
    title: 'Proof behind the claim',
    body: 'Proofound turns real work into structured proof records for privacy-safe hiring review before identity takes over.',
    microcopy: 'Proof portfolios for individuals. Evidence-based review for teams.',
  },
  {
    id: 'blind',
    title: 'Blind by default',
    body: 'Photo, name, contact details, prestige markers, and other identity signals are removed first. The goal is not anonymity for its own sake. It is capability before bias.',
    microcopy: 'Weak evidence should not lead the first review.',
  },
  {
    id: 'outcomes',
    title: 'Real outcomes, not bullet points',
    body: 'Vague summaries and floating skill lists resolve into structured outcomes, work scope, ownership, and context. Skills stop existing as decoration and start living next to real work.',
    microcopy: 'The same object becomes clearer, not busier.',
  },
  {
    id: 'artifacts',
    title: 'Backed with proof artifacts',
    body: 'Each outcome can carry links, files, visuals, repositories, certificates, and case fragments. The Public Page stops asking for belief and starts pointing to proof.',
    microcopy: 'Claims gain artifacts. Review gets clearer.',
  },
  {
    id: 'verification',
    title: 'Verification trust layer',
    body: 'Artifacts alone are not enough. Proofound adds verification states, method markers, and reviewer checks so reviewers can see why a proof item deserves confidence.',
    microcopy: 'Evidence becomes auditable, not merely present.',
  },
  {
    id: 'privacy',
    title: 'Privacy and data safety',
    body: 'Structured proof does not require open exposure. Sensitive context stays protected through controlled visibility, access boundaries, and privacy-safe presentation.',
    microcopy: 'Protection is part of the product, not a footnote.',
  },
  {
    id: 'compatibility',
    title: 'Universal compatibility',
    body: 'The proof-backed profile becomes a proof record inside a wider system. Structured assignments enter from one side, proof enters from the other, and a shared assessment layer makes them comparable.',
    microcopy: 'This is not a prettier CV. It is a compatibility model.',
  },
  {
    id: 'precision',
    title: 'For precise solutions',
    body: 'Once requirements and proof are both structured, fit can be explained with reason codes, readiness states, and gaps that still need human review.',
    microcopy: 'Evidence sharpens. The next review step becomes visible.',
  },
  {
    id: 'challenges',
    title: 'To modern challenges',
    body: 'Organizations waste time reviewing weak submissions. Proof-review participants flatten real ability into bullets or overshare to compensate. Proofound gives both sides a more modern starting point.',
    microcopy: 'Stronger proof solves real problems on both sides.',
  },
];

export const MOBILE_STORY_FRAME_IDS: HomepageStoryFrameId[] = [
  'hero',
  'outcomes',
  'verification',
  'compatibility',
  'challenges',
];
