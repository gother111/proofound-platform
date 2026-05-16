'use client';

import Image from 'next/image';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Blend,
  Briefcase,
  Building2,
  CheckCircle2,
  FileBadge2,
  FileText,
  GaugeCircle,
  HelpCircle,
  Home,
  ImageIcon,
  Link2,
  Mail,
  MapPin,
  Phone,
  Repeat2,
  Shield,
  ShieldCheck,
  SquareStack,
  Target,
  TrendingUp,
  Handshake,
  UsersRound,
  UserRound,
  Video,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  HOMEPAGE_STORY_FRAMES,
  MOBILE_STORY_FRAME_IDS,
  type HomepageStoryFrame,
  type HomepageStoryFrameId,
} from './homepage-story-frames';

interface ScrollytellingSectionProps {
  onIndividualSignup?: () => void;
  onOrganizationSignup?: () => void;
  shouldReduceMotion?: boolean | null;
}

interface StoryState {
  isBlind: boolean;
  isOutcomes: boolean;
  hasArtifacts: boolean;
  hasVerification: boolean;
  isPrivacy: boolean;
  isSystem: boolean;
  isPrecision: boolean;
  isChallenges: boolean;
}

const STORY_TRANSITION = {
  duration: 0.58,
  ease: [0.22, 1, 0.36, 1] as const,
};
const HERO_TO_BLIND_TRANSITION_SECONDS = 2.1;
const DESKTOP_FRAME_HEIGHT_VH = 88;
const DESKTOP_GESTURE_TRANSITION_MS = 1850;
const DESKTOP_GESTURE_MIN_DELTA = 16;
const DESKTOP_TOUCH_GESTURE_MIN_DELTA = 34;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const easeIn = (value: number) => {
  const clamped = clamp01(value);
  return clamped * clamped;
};
const easeOut = (value: number) => {
  const clamped = clamp01(value);
  return clamped * (2 - clamped);
};
const easeInOut = (value: number) => {
  const clamped = clamp01(value);
  return clamped * clamped * (3 - 2 * clamped);
};
const mix = (from: number, to: number, progress: number) => from + (to - from) * progress;
const getFrameScrollProgress = (frameIndex: number) => {
  const frameCount = HOMEPAGE_STORY_FRAMES.length;
  if (frameIndex <= 0) {
    return 0;
  }

  return Math.min(0.995, frameIndex / frameCount + 0.025);
};

const DESKTOP_CARD_FRAME = 'w-[31rem] max-w-[31rem] aspect-[31/42]';
const MOBILE_CARD_FRAME = 'w-full max-w-[14rem] aspect-[31/42]';
const GLASS_SHELL =
  'border border-white/55 bg-white/60 shadow-[0_22px_80px_-44px_rgba(45,51,48,0.4)] backdrop-blur-[24px]';
const STORY_COPY_EXIT_Y = -760;
const STORY_COPY_ENTER_Y = 760;

const proofArtifacts = [
  { label: 'PDF', icon: FileText },
  { label: 'Link', icon: Link2 },
  { label: 'Image', icon: ImageIcon },
  { label: 'Video', icon: Video },
  { label: 'Certificate', icon: FileBadge2 },
];

const profileModules = [
  {
    title: 'Reduced onboarding time by 31%',
    context:
      'Rebuilt the operations handoff across four markets and cut friction inside the first 14 days.',
  },
  {
    title: 'Recovered €420k of working time',
    context:
      'Consolidated fragmented workflows into one evidence-led delivery model with clearer ownership.',
  },
];

const assignmentContextTags = ['Growth-stage', 'B2B SaaS', 'Multi-market', 'Enterprise clients'];

const assignmentValueCreate = [
  { label: 'Onboarding faster', icon: UserRound },
  { label: 'Cleaner handoffs', icon: Repeat2 },
  { label: 'Visible ownership', icon: BadgeCheck },
  { label: 'Faster delivery', icon: GaugeCircle },
] as const;

const assignmentBestFitSignals = [
  {
    label: 'Process architecture',
    chips: ['Process design', 'Scaling workflows', 'Maps complexity', 'Notion / Jira'],
    icon: SquareStack,
  },
  {
    label: 'Stakeholder flow',
    chips: ['Stakeholder alignment', 'Cross-functional', 'Ownership clarity'],
    icon: UsersRound,
  },
  {
    label: 'Vendor operations',
    chips: ['Vendor mgmt', 'Multi-market ops', 'CRM systems'],
    icon: Handshake,
  },
  {
    label: 'Performance rhythm',
    chips: ['KPI thinking', 'Excel', 'Improves speed'],
    icon: GaugeCircle,
  },
] as const;

const assignmentPracticals = [
  { value: 'Hybrid', icon: Home },
  { value: 'Stockholm', icon: MapPin },
  { value: 'Full-time', icon: Briefcase },
] as const;

const assignmentProofSignals = [
  'Workflow up',
  'Less friction',
  'Ownership clear',
  'Team delivery',
] as const;

const preciseMatchMetrics = [
  { value: '3 / 4', label: 'outcomes', icon: BarChart3 },
  { value: '2', label: 'verified', icon: ShieldCheck },
  { value: 'High', label: 'confidence', icon: TrendingUp },
] as const;

const preciseMatchReasons = ['Process design', 'Onboarding gains', 'Multi-market'] as const;

const organizationChallenges = [
  'Too much time reviewing weak applications',
  'Low signal in early screening',
  'Vague job definitions create inconsistent review',
  'Interview time gets spent finding basic evidence',
];

const candidateChallenges = [
  'Real ability gets flattened into bullet points',
  'Proof lives across scattered links and files',
  'Bias and prestige still shape first impressions',
  'People oscillate between oversharing and undershowing',
];

const blindExperienceRows = [
  {
    label: 'B2B platform • 200+ employees',
    sublabel: 'Operations lead · 2022 to present',
    bullets: [
      'Led cross-functional operations improvements',
      'Improved internal systems and workflows',
    ],
  },
  {
    label: 'International supply network',
    sublabel: 'Systems manager · 2019 to 2022',
    bullets: [
      'Managed systems across global operations',
      'Supported process coordination and delivery',
    ],
  },
] as const;

const structuredProfileSummary = [
  {
    label: 'Scale',
    items: [
      { label: 'Team led', value: '12', icon: UsersRound },
      { label: 'Company size', value: '200+', icon: Building2 },
      { label: 'Corporate clients', value: '45', icon: Handshake },
    ],
  },
  {
    label: 'Focus',
    chips: ['Process design', 'People systems', 'Vendor ops'],
  },
  {
    label: 'Context',
    chips: ['B2B SaaS', 'International', 'Growth-stage'],
  },
] as const;

const outcomeExperienceRows = [
  {
    label: 'B2B platform • 200+ employees',
    sublabel: 'Operations lead · 2022 to present',
    bullets: [
      'Led cross-functional operations improvements',
      'Improved internal systems and workflows',
    ],
    outcome: 'Reduced onboarding time by 31%',
    ownership: 'Owned',
    skills: [
      { label: 'Process design', icon: SquareStack },
      { label: 'People systems', icon: UsersRound },
      { label: 'Workflow rebuild', icon: Briefcase },
    ],
    artifacts: [
      { label: 'PDF', icon: FileText },
      { label: 'Link', icon: Link2 },
    ],
  },
  {
    label: 'International supply network',
    sublabel: 'Systems manager · 2019 to 2022',
    bullets: [
      'Managed systems across global operations',
      'Supported process coordination and delivery',
    ],
    outcome: 'Recovered €420k of working time',
    ownership: 'Co-owned',
    skills: [
      { label: 'Vendor ops', icon: Handshake },
      { label: 'Process coordination', icon: SquareStack },
      { label: 'Multi-market', icon: Building2 },
    ],
    artifacts: [
      { label: 'PDF', icon: FileText },
      { label: 'Link', icon: Link2 },
    ],
  },
] as const;

const namedExperienceRows = [
  {
    label: 'Northstar Cloud',
    sublabel: 'Operations lead · 2022 to present',
    bullets: [
      'Led cross-functional operations improvements',
      'Improved internal systems and workflows',
    ],
  },
  {
    label: 'Vector Logistics',
    sublabel: 'Systems manager · 2019 to 2022',
    bullets: [
      'Managed systems across global operations',
      'Supported process coordination and delivery',
    ],
  },
] as const;

function deriveStoryState(frameId: HomepageStoryFrameId): StoryState {
  const frameIndex = HOMEPAGE_STORY_FRAMES.findIndex((frame) => frame.id === frameId);

  return {
    isBlind: frameIndex >= 1,
    isOutcomes: frameIndex >= 2,
    hasArtifacts: frameIndex >= 3,
    hasVerification: frameIndex >= 4,
    isPrivacy: frameIndex === 5,
    isSystem: frameIndex >= 6,
    isPrecision: frameIndex >= 7,
    isChallenges: frameIndex >= 8,
  };
}

function CardFrame({
  compact = false,
  className,
  children,
}: {
  compact?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        GLASS_SHELL,
        'relative overflow-hidden rounded-[2rem]',
        compact ? MOBILE_CARD_FRAME : DESKTOP_CARD_FRAME,
        className
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 16% 12%, rgba(255,255,255,0.96), transparent 42%), linear-gradient(140deg, rgba(255,255,255,0.52), rgba(255,255,255,0.16))',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.86' numOctaves='2'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}

function HeadshotIllustration({ compact = false }: { compact?: boolean }) {
  return (
    <svg viewBox="0 0 96 96" className={cn(compact ? 'h-10 w-10' : 'h-14 w-14')} aria-hidden="true">
      <rect x="0" y="0" width="96" height="96" rx="30" fill="rgba(240,245,240,0.98)" />
      <path
        d="M29 79c3.6-9.7 11-15.2 19-15.2S63.4 69.3 67 79"
        fill="none"
        stroke="rgba(28,77,58,0.78)"
        strokeWidth="5.2"
        strokeLinecap="round"
      />
      <path
        d="M31 42.5c0-10.9 7.8-18.7 17-18.7s17 7.8 17 18.7c0 3.7-0.8 7-2.4 10.3-2.6 5.3-8 9.1-14.6 9.1s-12-3.8-14.6-9.1c-1.6-3.3-2.4-6.6-2.4-10.3Z"
        fill="rgba(248,236,228,0.98)"
        stroke="rgba(28,77,58,0.72)"
        strokeWidth="3"
      />
      <path
        d="M30.5 42.3c0-12.7 7.5-22.1 17.5-22.1 10.8 0 18.8 9.1 18.8 21.9 0 1.8-0.2 3.2-0.5 4.8-1.9-2.8-3.2-5.1-4.1-7.8-4.2 5.7-11.1 9.3-21.9 10.5-4.1 0.5-7.1 1.1-9.4 2.8-0.3-1.6-0.4-3.4-0.4-4.9Z"
        fill="rgba(68,91,82,0.94)"
      />
      <path
        d="M36 81c1.5-6.7 5.1-11.2 12-11.2 7.1 0 10.7 4.5 12 11.2"
        fill="rgba(255,255,255,0.9)"
      />
      <path
        d="M41 68.7 48 75l7-6.3"
        fill="none"
        stroke="rgba(28,77,58,0.62)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M37.5 80.5 44 70.7M58.5 80.5 52 70.7"
        fill="none"
        stroke="rgba(28,77,58,0.66)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HeroResumePaperPile({ compact = false }: { compact?: boolean }) {
  return (
    <div className="absolute -inset-x-[9%] -inset-y-[4%]">
      <Image
        src="/hero-resume-stack/paper-pile.png"
        alt=""
        fill
        sizes={compact ? '12.25rem' : '31rem'}
        fetchPriority="high"
        priority
        className="pointer-events-none select-none object-contain drop-shadow-[0_32px_72px_rgba(55,45,30,0.18)]"
      />
    </div>
  );
}

function HeroResumeSheet({ compact = false }: { compact?: boolean }) {
  return (
    <div className="absolute inset-x-[14%] inset-y-[8%] z-10">
      <Image
        src="/hero-resume-stack/cv-sheet.png"
        alt=""
        fill
        sizes={compact ? '10.5rem' : '22rem'}
        className="pointer-events-none select-none object-contain drop-shadow-[0_18px_40px_rgba(55,45,30,0.14)]"
      />
    </div>
  );
}

function HeroResumeStack({ compact = false }: { compact?: boolean }) {
  return (
    <div
      role="img"
      aria-label="Resume layered over a stack of supporting paper proof"
      className={cn(
        'relative isolate mx-auto',
        compact ? 'w-full max-w-[12.25rem] aspect-[31/42]' : DESKTOP_CARD_FRAME
      )}
    >
      <HeroResumePaperPile compact={compact} />
      <HeroResumeSheet compact={compact} />
    </div>
  );
}

function BlindOutcomeProfileContent({
  outcomeView,
  artifactView,
  verifiedView,
  compact = false,
  isBlindReview,
  blindSectionLabelClass,
}: {
  outcomeView: boolean;
  artifactView: boolean;
  verifiedView: boolean;
  compact?: boolean;
  isBlindReview: boolean;
  blindSectionLabelClass: string;
}) {
  return (
    <motion.div layout className={cn(isBlindReview ? 'space-y-4' : 'space-y-3.5')}>
      <motion.div layout className="relative">
        <AnimatePresence mode="popLayout" initial={false}>
          {outcomeView ? (
            <motion.div
              key="structured-summary"
              layout
              initial={{ opacity: 0, y: 60, filter: 'blur(7px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(7px)' }}
              transition={STORY_TRANSITION}
              className={cn(
                'grid overflow-hidden rounded-[1.35rem] border border-white/62 bg-white/48 shadow-[0_20px_48px_-42px_rgba(45,51,48,0.45)] mt-2',
                compact ? 'grid-cols-1' : 'grid-cols-[1.22fr_1fr_0.95fr]'
              )}
            >
              {structuredProfileSummary.map((group, groupIndex) => (
                <div
                  key={group.label}
                  className={cn(
                    'min-w-0 px-5 py-4',
                    groupIndex > 0
                      ? compact
                        ? 'border-t border-white/50'
                        : 'border-l border-white/50'
                      : ''
                  )}
                >
                  <p className="mb-1.5 text-[0.68rem] font-medium uppercase tracking-[0.32em] text-foreground/42">
                    {group.label}
                  </p>
                  {'items' in group ? (
                    <div className="space-y-1">
                      {group.items.map(({ label, value, icon: Icon }) => (
                        <div
                          key={label}
                          className="grid grid-cols-[1rem_minmax(0,1fr)_auto] items-center gap-1.5"
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-white/55 bg-white/50">
                            <Icon
                              className="h-3.5 w-3.5 text-proofound-forest/78"
                              aria-hidden="true"
                            />
                          </span>
                          <span className="whitespace-nowrap text-[0.74rem] text-foreground/72">
                            {label}
                          </span>
                          <span className="font-display text-[1.05rem] text-proofound-forest">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {group.chips.map((chip) => (
                        <span
                          key={chip}
                          className="rounded-full border border-white/58 bg-white/58 px-3 py-1 text-[0.74rem] text-foreground/68"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="blind-summary"
              layout
              initial={{ opacity: 0, x: -12, filter: 'blur(6px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -22, filter: 'blur(7px)' }}
              transition={STORY_TRANSITION}
              className="space-y-1.5"
            >
              <p
                className={
                  isBlindReview
                    ? blindSectionLabelClass
                    : 'text-[0.68rem] uppercase tracking-[0.24em] text-foreground/45'
                }
              >
                Summary
              </p>
              <p
                className={cn(
                  'text-muted-foreground',
                  isBlindReview
                    ? 'max-w-[17rem] text-[0.9rem] leading-7 text-foreground/78'
                    : 'text-[0.8rem] leading-5'
                )}
              >
                Experienced operations leader with a strong record in team enablement, vendor
                management, and strategic process improvement across growth-stage companies.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div layout className={cn(isBlindReview ? 'space-y-3' : 'space-y-1.5')}>
        {outcomeExperienceRows.map((row, index) => (
          <motion.div
            key={row.label}
            layout
            animate={{ y: 0 }}
            transition={{ ...STORY_TRANSITION, delay: outcomeView ? index * 0.035 : 0 }}
            className={cn(
              'relative flex items-start gap-2 rounded-[1.15rem] border bg-white/48',
              verifiedView ? 'border-emerald-200/55' : 'border-white/55',
              outcomeView ? 'px-3 py-2' : isBlindReview ? 'px-4 py-3' : 'px-3 py-2'
            )}
          >
            <Building2
              className={cn(
                'mt-0.5 shrink-0 text-proofound-forest/70',
                isBlindReview ? 'h-[1.1rem] w-[1.1rem]' : 'h-3.5 w-3.5'
              )}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <div className={cn(isBlindReview ? 'space-y-2' : 'space-y-1')}>
                <AnimatePresence initial={false}>
                  {verifiedView ? (
                    <motion.span
                      key="reference-checked"
                      initial={{ opacity: 0, y: -6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.96 }}
                      transition={{ ...STORY_TRANSITION, delay: 0.06 + index * 0.04 }}
                      className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/85 px-2.5 py-1 text-[0.56rem] font-medium text-emerald-800"
                    >
                      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                      Reference checked
                    </motion.span>
                  ) : null}
                </AnimatePresence>
                <p
                  className={cn(
                    'font-medium text-foreground',
                    verifiedView ? 'pr-28' : '',
                    isBlindReview
                      ? 'text-[0.9rem] font-semibold'
                      : outcomeView
                        ? 'text-[0.74rem] font-semibold'
                        : 'text-[0.9rem]'
                  )}
                >
                  {row.label}
                </p>
                <p
                  className={cn(
                    'text-foreground/58',
                    isBlindReview ? 'text-[0.68rem]' : 'text-[0.58rem]'
                  )}
                >
                  {row.sublabel}
                </p>
              </div>

              <AnimatePresence mode="popLayout" initial={false}>
                {outcomeView ? (
                  <motion.div
                    key="outcome-detail"
                    layout
                    initial={{ opacity: 0, y: 40, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -20, filter: 'blur(6px)' }}
                    transition={{ ...STORY_TRANSITION, delay: index * 0.04 }}
                    className="space-y-2 pt-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <p
                        className={cn(
                          'min-w-0 flex-1 whitespace-nowrap font-display text-[0.82rem] leading-none text-foreground',
                          verifiedView ? 'inline-flex items-center gap-1.5' : ''
                        )}
                      >
                        <AnimatePresence initial={false}>
                          {verifiedView ? (
                            <motion.span
                              key="outcome-verified-check"
                              initial={{ opacity: 0, x: -6, scale: 0.9 }}
                              animate={{ opacity: 1, x: 0, scale: 1 }}
                              exit={{ opacity: 0, x: -4, scale: 0.9 }}
                              transition={{ ...STORY_TRANSITION, delay: 0.1 + index * 0.04 }}
                              className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-emerald-700"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                            </motion.span>
                          ) : null}
                        </AnimatePresence>
                        {row.outcome}
                      </p>
                      <span className="rounded-full border border-proofound-forest/12 bg-proofound-sage/22 px-1.5 py-0.5 text-[0.52rem] font-medium text-proofound-forest/82">
                        {row.ownership}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {row.skills.map(({ label, icon: Icon }) => (
                        <span
                          key={label}
                          className="inline-flex items-center gap-1 rounded-full border border-white/58 bg-white/58 px-1.5 py-0.5 text-[0.5rem] text-foreground/66"
                        >
                          <Icon className="h-2 w-2 text-proofound-forest/70" aria-hidden="true" />
                          {label}
                        </span>
                      ))}
                    </div>
                    <AnimatePresence initial={false}>
                      {artifactView ? (
                        <motion.div
                          key="supporting-artifacts"
                          layout
                          initial={{ opacity: 0, y: -6, filter: 'blur(5px)' }}
                          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                          exit={{ opacity: 0, y: -4, filter: 'blur(5px)' }}
                          transition={{ ...STORY_TRANSITION, delay: 0.08 + index * 0.04 }}
                          className="flex flex-wrap items-center gap-1.5 border-t border-white/45 pt-2"
                        >
                          <span className="mr-0.5 text-[0.56rem] uppercase tracking-[0.18em] text-foreground/38">
                            Artifacts
                          </span>
                          {row.artifacts.map(({ label, icon: Icon }, artifactIndex) => (
                            <span
                              key={`${label}-${artifactIndex}`}
                              className={cn(
                                'inline-flex items-center gap-1 rounded-full bg-proofound-parchment/70 px-1.5 py-0.5 text-[0.5rem] text-foreground/66 transition-colors',
                                verifiedView
                                  ? 'border border-emerald-200/70 px-2 text-emerald-900/72'
                                  : 'border border-white/60'
                              )}
                            >
                              <AnimatePresence initial={false}>
                                {verifiedView ? (
                                  <motion.span
                                    key="artifact-check"
                                    initial={{ opacity: 0, x: -4, scale: 0.9 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: -3, scale: 0.9 }}
                                    transition={{
                                      ...STORY_TRANSITION,
                                      delay: 0.14 + artifactIndex * 0.03,
                                    }}
                                    className="text-emerald-700"
                                  >
                                    <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                                  </motion.span>
                                ) : null}
                              </AnimatePresence>
                              <Icon
                                className="h-3 w-3 text-proofound-forest/70"
                                aria-hidden="true"
                              />
                              {label}
                            </span>
                          ))}
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <motion.ul
                    key="bullet-detail"
                    layout
                    initial={{ opacity: 0, y: 40, filter: 'blur(5px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -20, filter: 'blur(6px)' }}
                    transition={STORY_TRANSITION}
                    className={cn(isBlindReview ? 'space-y-2 pt-1.5' : 'space-y-1 pt-1')}
                  >
                    {row.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className={cn(
                          'whitespace-nowrap text-foreground/72',
                          isBlindReview ? 'text-[0.6rem]' : 'text-[0.58rem]'
                        )}
                      >
                        • {bullet}
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

function StackSheets({
  side,
  visible,
  collapsed,
  compact = false,
  delayedReveal = false,
}: {
  side: 'left' | 'right';
  visible: boolean;
  collapsed: boolean;
  compact?: boolean;
  delayedReveal?: boolean;
}) {
  const direction = side === 'left' ? -1 : 1;
  const offsets = compact ? [16, 32, 48] : [34, 68, 102];

  return (
    <>
      {offsets.map((offset, index) => (
        <motion.div
          key={`${side}-${offset}`}
          initial={delayedReveal ? { opacity: 0, x: 0, y: 0, scale: 0.97, rotate: 0 } : false}
          animate={{
            opacity: visible ? (collapsed ? 0.18 - index * 0.025 : 0.74 - index * 0.12) : 0,
            x: visible ? (collapsed ? direction * (index + 1) * 5 : direction * offset) : 0,
            y: visible ? (collapsed ? offset * 0.12 : offset * 0.32) : 0,
            scale: visible ? 1 - index * 0.026 : 0.982,
            rotate: visible ? (collapsed ? 0 : direction * (index + 1) * 1.9) : 0,
          }}
          transition={{
            ...STORY_TRANSITION,
            delay: delayedReveal ? 0.62 + index * 0.06 : 0,
          }}
          className={cn(
            'absolute inset-0 -z-10 rounded-[2rem] border border-black/8 bg-white/72 shadow-[0_38px_80px_-48px_rgba(45,51,48,0.42),0_0_0_1px_rgba(255,255,255,0.55)_inset] backdrop-blur-[18px]',
            compact ? MOBILE_CARD_FRAME : DESKTOP_CARD_FRAME
          )}
          aria-hidden="true"
        />
      ))}
    </>
  );
}

function ProofPackCard({
  state,
  compact = false,
  privacyExitProgress = 0,
  stabilizeIdentity = false,
}: {
  state: StoryState;
  compact?: boolean;
  privacyExitProgress?: number;
  stabilizeIdentity?: boolean;
}) {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const isBlindReview = state.isBlind && !state.isOutcomes;
  const contentPadding = compact ? 'p-4' : 'p-6';
  const avatarSize = compact
    ? 'h-14 w-14 rounded-2xl'
    : isBlindReview
      ? 'h-[5.9rem] w-[5.9rem] rounded-[1.75rem]'
      : 'h-20 w-20 rounded-[1.8rem]';
  const identityLabelSize = compact ? 'text-lg' : 'text-[2rem]';
  const roleLabelSize = compact ? 'text-[0.6rem]' : 'text-[0.74rem]';
  const roleTracking = compact ? 'tracking-[0.12em]' : 'tracking-[0.14em]';
  const contactTextSize = compact ? 'text-[0.56rem]' : 'text-[0.6rem]';
  const namedCardLayout = compact
    ? 'flex flex-col gap-3'
    : 'grid grid-cols-[minmax(0,1fr)_12.2rem] items-start gap-x-8';
  const namedIdentityLayout = compact
    ? 'flex items-start gap-3'
    : 'grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-4';
  const blindSectionLabelClass = compact
    ? 'text-[0.72rem] uppercase tracking-[0.22em] text-proofound-forest/90'
    : 'text-[0.92rem] font-semibold uppercase tracking-[0.24em] text-proofound-forest/92';
  const isVerifiedProfile = state.hasVerification && state.isBlind && !state.isChallenges;

  return (
    <CardFrame
      compact={compact}
      className={cn(
        isVerifiedProfile
          ? 'border-emerald-300/55 shadow-[0_24px_86px_-42px_rgba(28,77,58,0.48)]'
          : ''
      )}
    >
      <div className={cn('flex h-full flex-col', contentPadding, isBlindReview ? 'pt-7' : '')}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-3">
            {!state.isChallenges ? (
              <div
                className={cn(
                  'min-w-0',
                  state.isBlind
                    ? isBlindReview
                      ? 'flex items-start gap-4'
                      : 'flex items-start gap-4'
                    : 'block'
                )}
              >
                {state.isBlind ? (
                  <motion.div
                    initial={false}
                    animate={{ scale: 0.96 }}
                    transition={STORY_TRANSITION}
                    className={cn(
                      avatarSize,
                      'flex items-center justify-center border border-white/60 bg-white/68 text-proofound-forest shadow-inner'
                    )}
                  >
                    <motion.div
                      key="neutral-avatar"
                      initial={{ opacity: 0, scale: 0.88 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.88 }}
                      transition={STORY_TRANSITION}
                    >
                      <UserRound className={compact ? 'h-6 w-6' : 'h-9 w-9'} aria-hidden="true" />
                    </motion.div>
                  </motion.div>
                ) : null}

                <div className={cn('min-w-0', state.isBlind ? 'flex-1' : '')}>
                  <AnimatePresence mode="wait">
                    {state.isBlind ? (
                      <motion.div
                        key="blind-identity"
                        initial={stabilizeIdentity ? false : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={STORY_TRANSITION}
                        className={cn(
                          'flex items-center',
                          isBlindReview ? 'min-h-[5.9rem]' : 'min-h-[5rem]'
                        )}
                      >
                        <p
                          className={cn(
                            'font-display leading-none text-foreground',
                            compact
                              ? 'text-base'
                              : isBlindReview
                                ? 'whitespace-nowrap text-[1.82rem]'
                                : 'whitespace-nowrap text-[1.75rem]'
                          )}
                        >
                          Senior Operations Professional
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="named-identity"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={STORY_TRANSITION}
                        className={namedCardLayout}
                      >
                        <div className={cn('min-w-0', namedIdentityLayout)}>
                          <motion.div
                            initial={false}
                            animate={{ scale: 1 }}
                            transition={STORY_TRANSITION}
                            className={cn(
                              avatarSize,
                              'flex items-center justify-center border border-white/60 bg-white/68 text-proofound-forest shadow-inner',
                              compact ? '' : 'mt-2'
                            )}
                          >
                            <HeadshotIllustration compact={compact} />
                          </motion.div>

                          <div className="min-w-0 self-center space-y-1">
                            <p
                              className={cn(
                                'font-display leading-none text-foreground',
                                compact ? '' : 'whitespace-nowrap',
                                identityLabelSize
                              )}
                            >
                              Sarah Jenkins
                            </p>
                            <p
                              className={cn(
                                'uppercase whitespace-nowrap text-proofound-forest/76',
                                roleLabelSize,
                                roleTracking
                              )}
                            >
                              Operations Director
                            </p>
                          </div>
                        </div>

                        <div
                          className={cn(
                            'text-foreground/66',
                            compact
                              ? 'space-y-1.5 text-left'
                              : 'translate-x-8 justify-self-end space-y-2 pl-2 pt-4 text-left',
                            contactTextSize
                          )}
                        >
                          <div className="inline-flex items-center gap-2 whitespace-nowrap">
                            <Mail
                              className="h-[0.85rem] w-[0.85rem] text-proofound-forest/75"
                              aria-hidden="true"
                            />
                            sarah@northstar.work
                          </div>
                          <div className="inline-flex items-center gap-2 whitespace-nowrap">
                            <MapPin
                              className="h-[0.85rem] w-[0.85rem] text-proofound-forest/75"
                              aria-hidden="true"
                            />
                            Stockholm, Sweden
                          </div>
                          <div className="inline-flex items-center gap-2 whitespace-nowrap">
                            <Phone
                              className="h-[0.85rem] w-[0.85rem] text-proofound-forest/75"
                              aria-hidden="true"
                            />
                            +46 70 111 22 33
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="max-w-[18rem] space-y-2">
                <p className="text-sm leading-6 text-muted-foreground">
                  The candidate side no longer leads with identity. It shows the friction people
                  carry through the current process.
                </p>
              </div>
            )}
          </div>

          <AnimatePresence>
            {state.hasVerification && !state.isBlind && !state.isChallenges ? (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={STORY_TRANSITION}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/85 px-3 py-1.5 text-xs font-medium text-emerald-800"
              >
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Verified
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {!state.isChallenges && !state.isBlind ? (
            <motion.div
              key={state.isBlind ? 'identity-removed' : 'identity-visible'}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={STORY_TRANSITION}
              className="mt-4"
            >
              {state.isBlind ? (
                <div className="grid gap-2 text-xs text-foreground/58 sm:grid-cols-2">
                  <div className="rounded-full border border-dashed border-border/70 bg-white/35 px-3 py-2">
                    Identity markers removed
                  </div>
                  <div className="rounded-full border border-dashed border-border/70 bg-white/35 px-3 py-2">
                    Prestige shortcuts neutralized
                  </div>
                </div>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="mt-5 flex min-h-0 flex-1 gap-4 overflow-hidden">
          <motion.aside
            initial={false}
            animate={{
              width: state.isOutcomes || state.isChallenges ? 0 : compact ? 84 : 122,
              opacity: state.isOutcomes || state.isChallenges ? 0 : 1,
              marginRight: state.isOutcomes || state.isChallenges ? 0 : compact ? 8 : 10,
            }}
            transition={STORY_TRANSITION}
            className="overflow-hidden"
          >
            <div
              className={cn(
                'h-full border-r border-border/60 pr-3 text-xs text-foreground/68',
                isBlindReview ? 'space-y-4 pr-4' : 'space-y-3'
              )}
            >
              <p
                className={
                  isBlindReview
                    ? blindSectionLabelClass
                    : 'uppercase tracking-[0.24em] text-foreground/42'
                }
              >
                Skills
              </p>
              {['Ops Design', 'People Systems', 'Process Rebuild', 'Privacy Habits'].map(
                (skill) => (
                  <div
                    key={skill}
                    className={cn(
                      'whitespace-nowrap rounded-2xl border border-white/55 bg-white/48 leading-none',
                      isBlindReview
                        ? 'px-3 py-2.5 text-[0.72rem] text-foreground/82'
                        : 'px-2.5 py-1.5 text-[0.66rem]'
                    )}
                  >
                    {skill}
                  </div>
                )
              )}
            </div>
          </motion.aside>

          <div className="min-w-0 flex-1">
            <AnimatePresence mode="wait">
              {state.isChallenges ? (
                <motion.div
                  key="candidate-challenges"
                  initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -16, filter: 'blur(4px)' }}
                  transition={STORY_TRANSITION}
                  className="flex h-full flex-col space-y-3"
                >
                  <div className="space-y-2">
                    <p className="text-[0.68rem] uppercase tracking-[0.24em] text-foreground/45">
                      Candidate-side challenge
                    </p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      The shell stays familiar. The content shifts to the problems candidates face
                      in the current system.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {candidateChallenges.map((challenge) => (
                      <div
                        key={challenge}
                        className="rounded-[1.2rem] border border-white/55 bg-white/48 px-4 py-3 text-sm text-foreground/78"
                      >
                        {challenge}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : state.isBlind && !state.isChallenges ? (
                <BlindOutcomeProfileContent
                  outcomeView={state.isOutcomes}
                  artifactView={state.hasArtifacts}
                  verifiedView={state.hasVerification}
                  compact={compact}
                  isBlindReview={isBlindReview}
                  blindSectionLabelClass={blindSectionLabelClass}
                />
              ) : state.isOutcomes ? (
                <motion.div
                  key="outcomes"
                  initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -16, filter: 'blur(4px)' }}
                  transition={STORY_TRANSITION}
                  className="space-y-3"
                >
                  <div className="space-y-1.5">
                    <p className="text-[0.68rem] uppercase tracking-[0.24em] text-foreground/45">
                      Outcome record
                    </p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Skills now sit inside delivery context, ownership, and measurable results.
                    </p>
                  </div>

                  {profileModules.map((module) => (
                    <div
                      key={module.title}
                      className="space-y-3 rounded-[1.45rem] border border-white/60 bg-white/55 px-4 py-4"
                    >
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">{module.title}</p>
                        <p className="text-xs leading-5 text-foreground/63">{module.context}</p>
                      </div>

                      <div className="flex flex-wrap gap-2 text-[0.68rem] text-foreground/65">
                        <span className="rounded-full border border-border/70 bg-white/60 px-2.5 py-1">
                          Work scope mapped
                        </span>
                        <span className="rounded-full border border-border/70 bg-white/60 px-2.5 py-1">
                          Ownership visible
                        </span>
                      </div>

                      <AnimatePresence>
                        {state.hasArtifacts ? (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            transition={STORY_TRANSITION}
                            className="flex flex-wrap gap-2"
                          >
                            {proofArtifacts.map(({ label, icon: Icon }, index) => (
                              <motion.span
                                key={label}
                                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ ...STORY_TRANSITION, delay: index * 0.04 }}
                                className="inline-flex items-center gap-1.5 rounded-full border border-border/65 bg-proofound-parchment/70 px-2.5 py-1 text-[0.68rem] text-foreground/70"
                              >
                                <Icon
                                  className="h-3.5 w-3.5 text-proofound-forest/75"
                                  aria-hidden="true"
                                />
                                {label}
                              </motion.span>
                            ))}
                          </motion.div>
                        ) : null}
                      </AnimatePresence>

                      <AnimatePresence>
                        {state.hasVerification ? (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            transition={STORY_TRANSITION}
                            className="flex items-center justify-between border-t border-border/55 pt-3 text-[0.72rem] text-foreground/68"
                          >
                            <span className="inline-flex items-center gap-1.5">
                              <BadgeCheck
                                className="h-3.5 w-3.5 text-emerald-600"
                                aria-hidden="true"
                              />
                              Verification method attached
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <CheckCircle2
                                className="h-3.5 w-3.5 text-emerald-600"
                                aria-hidden="true"
                              />
                              Trust status active
                            </span>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="summary"
                  initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -16, filter: 'blur(4px)' }}
                  transition={STORY_TRANSITION}
                  className={cn(isBlindReview ? 'space-y-4' : 'space-y-3')}
                >
                  <div className="space-y-1.5">
                    <p
                      className={
                        isBlindReview
                          ? blindSectionLabelClass
                          : 'text-[0.68rem] uppercase tracking-[0.24em] text-foreground/45'
                      }
                    >
                      Summary
                    </p>
                    <p
                      className={cn(
                        'text-muted-foreground',
                        isBlindReview
                          ? 'max-w-[17rem] text-[0.9rem] leading-7 text-foreground/78'
                          : 'text-[0.8rem] leading-5'
                      )}
                    >
                      Experienced operations leader with a strong record in team enablement, vendor
                      management, and strategic process improvement across growth-stage companies.
                    </p>
                  </div>

                  <div className={cn(isBlindReview ? 'space-y-4' : 'space-y-3')}>
                    {[...(state.isBlind ? blindExperienceRows : namedExperienceRows)].map((row) => (
                      <div
                        key={row.label}
                        className={cn(
                          'flex items-start gap-2.5 rounded-[1.15rem] border border-white/55 bg-white/48',
                          isBlindReview
                            ? 'px-4.5 py-4'
                            : state.isBlind
                              ? 'px-4 py-3'
                              : 'px-3.5 py-2.5'
                        )}
                      >
                        <Building2
                          className={cn(
                            'mt-0.5 text-proofound-forest/70',
                            isBlindReview ? 'h-[1.1rem] w-[1.1rem]' : 'h-3.5 w-3.5'
                          )}
                          aria-hidden="true"
                        />
                        <div className={cn(isBlindReview ? 'space-y-2' : 'space-y-1')}>
                          <p
                            className={cn(
                              'font-medium text-foreground',
                              isBlindReview
                                ? 'text-[0.98rem] font-semibold'
                                : state.isBlind
                                  ? 'text-[0.98rem]'
                                  : 'text-[0.82rem]'
                            )}
                          >
                            {row.label}
                          </p>
                          <p
                            className={cn(
                              'text-foreground/58',
                              isBlindReview ? 'text-[0.72rem]' : 'text-[0.68rem]'
                            )}
                          >
                            {row.sublabel}
                          </p>
                          {'bullets' in row ? (
                            <ul
                              className={cn(isBlindReview ? 'space-y-2 pt-1.5' : 'space-y-1 pt-1')}
                            >
                              {row.bullets.map((bullet) => (
                                <li
                                  key={bullet}
                                  className={cn(
                                    'whitespace-nowrap text-foreground/72',
                                    isBlindReview ? 'text-[0.64rem]' : 'text-[0.62rem]'
                                  )}
                                >
                                  • {bullet}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isVerifiedProfile ? (
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 - clamp01(privacyExitProgress) }}
            exit={{ opacity: 0 }}
            transition={STORY_TRANSITION}
            className="pointer-events-none absolute inset-[1px] z-20 rounded-[1.95rem] border border-emerald-300/70 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.34),0_0_34px_rgba(52,119,84,0.12)]"
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {state.isPrivacy ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 - clamp01(privacyExitProgress) }}
            exit={{ opacity: 0 }}
            transition={STORY_TRANSITION}
            className="absolute inset-0 z-20 overflow-hidden rounded-[2rem] border border-white/70 bg-white/10 backdrop-blur-[1.5px]"
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-[2rem] opacity-80"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.36) 0%, rgba(255,255,255,0.08) 44%, rgba(28,77,58,0.05) 100%)',
              }}
            />
            <motion.div
              aria-hidden="true"
              initial={
                shouldReduceMotion
                  ? false
                  : { opacity: 0, WebkitMaskPosition: '-95% -95%', maskPosition: '-95% -95%' }
              }
              animate={
                shouldReduceMotion
                  ? { opacity: 0.48, WebkitMaskPosition: '50% 50%', maskPosition: '50% 50%' }
                  : {
                      opacity: [0, 1, 0],
                      WebkitMaskPosition: ['-95% -95%', '48% 48%', '190% 190%'],
                      maskPosition: ['-95% -95%', '48% 48%', '190% 190%'],
                    }
              }
              transition={
                shouldReduceMotion ? { duration: 0 } : { duration: 3.35, ease: [0.22, 1, 0.36, 1] }
              }
              className="absolute inset-[-8%] rounded-[2.4rem]"
              style={{
                WebkitMaskImage:
                  'linear-gradient(135deg, transparent 0%, transparent 32%, rgba(0,0,0,0.06) 38%, rgba(0,0,0,0.94) 47%, rgba(0,0,0,0.94) 53%, rgba(0,0,0,0.06) 62%, transparent 68%, transparent 100%)',
                maskImage:
                  'linear-gradient(135deg, transparent 0%, transparent 32%, rgba(0,0,0,0.06) 38%, rgba(0,0,0,0.94) 47%, rgba(0,0,0,0.94) 53%, rgba(0,0,0,0.06) 62%, transparent 68%, transparent 100%)',
                WebkitMaskSize: '220% 220%',
                maskSize: '220% 220%',
                backgroundImage:
                  "radial-gradient(circle at 50% 45%, rgba(255,255,255,0.9), rgba(255,255,255,0.3) 32%, rgba(255,255,255,0) 68%), linear-gradient(135deg, rgba(255,255,255,0.64), rgba(174,207,185,0.24) 42%, rgba(255,255,255,0.15)), url(\"data:image/svg+xml,%3Csvg width='18' height='16' viewBox='0 0 18 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='rgba(255,255,255,0.07)' stroke='rgba(38,86,66,0.5)' stroke-width='0.38'%3E%3Cpath d='M4.5 .8 9 3.4v5.2l-4.5 2.6L0 8.6V3.4L4.5 .8Z'/%3E%3Cpath d='M13.5 .8 18 3.4v5.2l-4.5 2.6L9 8.6V3.4L13.5 .8Z'/%3E%3Cpath d='M9 8.8l4.5 2.6v5.2L9 19.2l-4.5-2.6v-5.2L9 8.8Z'/%3E%3C/g%3E%3C/svg%3E\")",
                backgroundSize: '130% 130%, 100% 100%, 18px 16px',
                backgroundPosition: 'center, center, center',
                filter:
                  'drop-shadow(0 0 5px rgba(255,255,255,0.86)) drop-shadow(0 0 22px rgba(74,119,92,0.26))',
              }}
            />
            <div className="absolute left-1/2 top-1/2 h-[6.2rem] w-[6.2rem] -translate-x-1/2 -translate-y-1/2">
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={
                  shouldReduceMotion ? { duration: 0 } : { ...STORY_TRANSITION, delay: 0.15 }
                }
                className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[2rem] border border-white/78 bg-white/38 shadow-[0_24px_70px_-32px_rgba(28,77,58,0.6),0_0_0_1px_rgba(255,255,255,0.45)_inset] backdrop-blur-[18px]"
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-0 rounded-[2rem]"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(255,255,255,0.62), rgba(255,255,255,0.16) 46%, rgba(28,77,58,0.08))',
                  }}
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-[0.45rem] rounded-[1.55rem] border border-white/42"
                />
                <motion.div
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 8, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.94 }}
                  transition={
                    shouldReduceMotion ? { duration: 0 } : { ...STORY_TRANSITION, delay: 0.24 }
                  }
                  className="relative z-10 flex items-center justify-center"
                >
                  <Shield
                    className="h-14 w-14 text-proofound-forest/88 drop-shadow-[0_8px_18px_rgba(28,77,58,0.24)]"
                    aria-hidden="true"
                  />
                </motion.div>
              </motion.div>
            </div>
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-[2rem] border border-white/45"
              style={{
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.58), inset 0 -1px 0 rgba(28,77,58,0.08)',
              }}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </CardFrame>
  );
}

function AssignmentCard({ state, compact = false }: { state: StoryState; compact?: boolean }) {
  const contentPadding = compact ? 'p-3' : 'p-4';

  if (state.isChallenges) {
    return (
      <CardFrame compact={compact}>
        <div className={cn('flex h-full flex-col', contentPadding)}>
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-white/70 px-3 py-1 text-[0.68rem] uppercase tracking-[0.22em] text-foreground/70">
              <Briefcase className="h-3.5 w-3.5 text-proofound-terracotta" aria-hidden="true" />
              Organization-side challenge
            </div>
            <p className={cn('font-display text-foreground', compact ? 'text-xl' : 'text-[2rem]')}>
              Modern hiring pressure
            </p>
          </div>

          <motion.div
            key="assignment-challenges"
            initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -16, filter: 'blur(4px)' }}
            transition={STORY_TRANSITION}
            className="mt-5 space-y-3"
          >
            {organizationChallenges.map((challenge) => (
              <div
                key={challenge}
                className="rounded-[1.2rem] border border-white/55 bg-white/52 px-4 py-3 text-sm text-foreground/78"
              >
                {challenge}
              </div>
            ))}
          </motion.div>
        </div>
      </CardFrame>
    );
  }

  return (
    <CardFrame compact={compact}>
      <div className={cn('flex h-full flex-col', contentPadding)}>
        <div className={cn('flex items-start', compact ? 'gap-3' : 'gap-4')}>
          <div
            className={cn(
              'flex shrink-0 items-center justify-center border border-proofound-forest/22 bg-white/44 text-proofound-forest shadow-inner',
              compact ? 'h-12 w-12 rounded-[1.1rem]' : 'h-[3.85rem] w-[3.85rem] rounded-[1.2rem]'
            )}
          >
            <Building2 className={compact ? 'h-6 w-6' : 'h-8 w-8'} aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <div className={cn('flex flex-wrap items-center gap-1.5', compact ? 'mb-2' : 'mb-3')}>
              {assignmentPracticals.map(({ value, icon: Icon }, index) => (
                <span
                  key={value}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border border-border/55 bg-white/52 text-foreground/72',
                    compact ? 'px-2 py-0.5 text-[0.52rem]' : 'px-2 py-0.5 text-[0.55rem]',
                    index > 1 && compact ? 'hidden' : ''
                  )}
                >
                  <Icon className={compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} aria-hidden="true" />
                  {value}
                </span>
              ))}
            </div>

            <p
              className={cn(
                'font-display leading-[0.95] text-foreground',
                compact ? 'text-[1.35rem]' : 'text-[2.2rem]'
              )}
            >
              Senior Operations Lead
            </p>
            <p
              className={cn(
                'mt-2 text-foreground/62',
                compact ? 'line-clamp-2 text-[0.62rem] leading-4' : 'text-[0.72rem] leading-4'
              )}
            >
              Build clearer operating systems for a growth-stage B2B SaaS team.
            </p>
          </div>
        </div>

        <div className={cn('flex flex-wrap', compact ? 'mt-3 gap-1.5' : 'mt-3 gap-1.5')}>
          {assignmentContextTags.map((tag) => (
            <span
              key={tag}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border border-proofound-forest/12 bg-white/44 text-foreground/72',
                compact ? 'px-2 py-0.5 text-[0.52rem]' : 'px-2.5 py-0.5 text-[0.56rem]'
              )}
            >
              <span className="h-1 w-1 rounded-full bg-proofound-forest/48" aria-hidden="true" />
              {tag}
            </span>
          ))}
        </div>

        <div className={cn('border-t border-border/45', compact ? 'mt-3 pt-3' : 'mt-3 pt-3')}>
          <p
            className={cn(
              'font-medium uppercase text-proofound-forest/82',
              compact ? 'text-[0.52rem] tracking-[0.22em]' : 'text-[0.58rem] tracking-[0.28em]'
            )}
          >
            Role mission
          </p>
          <div className={cn('mt-2.5 flex items-center', compact ? 'gap-3' : 'gap-4')}>
            <div
              className={cn(
                'flex shrink-0 items-center justify-center rounded-full bg-proofound-sage/18 text-proofound-forest',
                compact ? 'h-10 w-10' : 'h-14 w-14'
              )}
            >
              <Target className={compact ? 'h-5 w-5' : 'h-8 w-8'} aria-hidden="true" />
            </div>
            <p
              className={cn(
                'font-display leading-[1.04] text-foreground',
                compact ? 'text-[1.16rem]' : 'text-[1.65rem]'
              )}
            >
              Create operating clarity as the company scales.
            </p>
          </div>
        </div>

        <div className={cn('border-t border-border/45', compact ? 'mt-3 pt-3' : 'mt-3 pt-3')}>
          <p
            className={cn(
              'font-medium uppercase text-proofound-forest/82',
              compact ? 'text-[0.52rem] tracking-[0.22em]' : 'text-[0.58rem] tracking-[0.28em]'
            )}
          >
            Value to create
          </p>
          <div className={cn('mt-2.5 grid gap-1.5', compact ? 'grid-cols-1' : 'grid-cols-4')}>
            {assignmentValueCreate.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className={cn(
                  'flex items-center gap-2 rounded-[1rem] border border-border/45 bg-white/38 text-foreground/76',
                  compact ? 'px-2.5 py-1.5 text-[0.58rem]' : 'px-2 py-2 text-[0.56rem]'
                )}
              >
                <span
                  className={cn(
                    'flex shrink-0 items-center justify-center rounded-full bg-proofound-sage/22 text-proofound-forest',
                    compact ? 'h-6 w-6' : 'h-7 w-7'
                  )}
                >
                  <Icon className={compact ? 'h-3.5 w-3.5' : 'h-3.5 w-3.5'} aria-hidden="true" />
                </span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {!compact ? (
          <div className="mt-3 border-t border-border/45 pt-3">
            <p className="text-[0.58rem] font-medium uppercase tracking-[0.28em] text-proofound-forest/82">
              Best-fit signal
            </p>
            <div className="mt-2.5 grid grid-cols-4 divide-x divide-border/45">
              {assignmentBestFitSignals.map(({ label, chips, icon: Icon }) => (
                <div key={label} className="min-w-0 px-1.5 first:pl-0 last:pr-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-proofound-sage/20 text-proofound-forest">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="mt-1.5 h-px w-6 bg-proofound-forest/54" aria-hidden="true" />
                  <p className="mt-1.5 min-h-[1.75rem] text-[0.62rem] font-semibold leading-3 text-foreground">
                    {label}
                  </p>
                  <div className="mt-1.5 space-y-1">
                    {chips.map((chip) => (
                      <span
                        key={chip}
                        className="block truncate rounded-full border border-border/45 bg-white/38 px-1.5 py-0.5 text-center text-[0.48rem] text-foreground/68"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className={cn('mt-auto border-t border-border/45', compact ? 'pt-2' : 'pt-2')}>
          <p
            className={cn(
              'font-medium uppercase text-proofound-forest/82',
              compact ? 'text-[0.52rem] tracking-[0.22em]' : 'text-[0.58rem] tracking-[0.28em]'
            )}
          >
            Strong proof
          </p>
          <div
            className={cn(
              'mt-2 grid overflow-hidden rounded-[1rem] border border-border/45 bg-white/36',
              compact
                ? 'grid-cols-1 divide-y divide-border/35'
                : 'grid-cols-4 divide-x divide-border/35'
            )}
          >
            {assignmentProofSignals.map((signal, index) => (
              <div
                key={signal}
                className={cn(
                  'flex items-center gap-1.5 text-foreground/74',
                  compact ? 'px-2 py-1 text-[0.55rem]' : 'px-2 py-1.5 text-[0.54rem]',
                  compact && index > 1 ? 'hidden' : ''
                )}
              >
                <CheckCircle2
                  className={cn(
                    'shrink-0 text-proofound-forest',
                    compact ? 'h-3 w-3' : 'h-3.5 w-3.5'
                  )}
                  aria-hidden="true"
                />
                <span className="truncate">{signal}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CardFrame>
  );
}

function AssessmentCard({ state, compact = false }: { state: StoryState; compact?: boolean }) {
  if (state.isPrecision) {
    return (
      <div
        className={cn(
          GLASS_SHELL,
          'overflow-hidden border-white/68 bg-white/70 text-center shadow-[0_24px_70px_-46px_rgba(45,51,48,0.42)]',
          compact
            ? 'w-full max-w-[11rem] rounded-[1.35rem] p-3'
            : 'w-full max-w-[19rem] rounded-[1.85rem] p-4'
        )}
      >
        <div className="flex justify-center">
          <div
            className={cn(
              'inline-flex items-center gap-2 rounded-full border border-proofound-forest/10 bg-proofound-sage/18 font-medium uppercase text-proofound-forest/78',
              compact
                ? 'px-3 py-1 text-[0.56rem] tracking-[0.18em]'
                : 'px-3.5 py-1.5 text-[0.68rem] tracking-[0.24em]'
            )}
          >
            <Blend className={compact ? 'h-3.5 w-3.5' : 'h-5 w-5'} aria-hidden="true" />
            Strong fit
          </div>
        </div>

        <div className={compact ? 'mt-4 space-y-2' : 'mt-4 space-y-2.5'}>
          <p
            className={cn(
              'font-display leading-[0.92] text-foreground',
              compact ? 'text-[1.7rem]' : 'whitespace-nowrap text-[2.35rem]'
            )}
          >
            Strong match
          </p>
          <p
            className={cn(
              'mx-auto text-muted-foreground',
              compact
                ? 'max-w-[8.5rem] text-[0.72rem] leading-4'
                : 'max-w-[13rem] text-[0.92rem] leading-5'
            )}
          >
            Proof and outcomes align with the role.
          </p>
        </div>

        <div className={cn('grid gap-2', compact ? 'mt-4 grid-cols-1' : 'mt-4 grid-cols-3')}>
          {preciseMatchMetrics.map(({ value, label, icon: Icon }) => (
            <div
              key={label}
              className={cn(
                'rounded-[1.05rem] border border-border/50 bg-white/36',
                compact ? 'flex items-center justify-between px-2.5 py-2 text-left' : 'px-2 py-2.5'
              )}
            >
              <div
                className={cn(
                  'flex shrink-0 items-center justify-center rounded-full bg-proofound-sage/18 text-proofound-forest/78',
                  compact ? 'h-7 w-7' : 'mx-auto h-8 w-8'
                )}
              >
                <Icon className={compact ? 'h-4 w-4' : 'h-4.5 w-4.5'} aria-hidden="true" />
              </div>
              <div className={compact ? 'text-right' : 'mt-2'}>
                <p
                  className={cn(
                    'font-semibold leading-none text-foreground',
                    compact ? 'text-sm' : 'text-lg'
                  )}
                >
                  {value}
                </p>
                <p
                  className={cn(
                    'text-muted-foreground',
                    compact ? 'text-[0.58rem]' : 'mt-1 text-[0.64rem] leading-3'
                  )}
                >
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className={cn('text-left', compact ? 'mt-4' : 'mt-4')}>
          <p className={cn('font-display text-foreground', compact ? 'text-lg' : 'text-[1.12rem]')}>
            Why
          </p>
          <div className={cn('mt-2 flex flex-wrap gap-1.5')}>
            {preciseMatchReasons.map((reason) => (
              <span
                key={reason}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full bg-proofound-sage/16 text-foreground/72',
                  compact ? 'px-2 py-1 text-[0.55rem]' : 'px-2 py-1 text-[0.58rem]'
                )}
              >
                <CheckCircle2
                  className={cn(
                    'shrink-0 text-proofound-forest/78',
                    compact ? 'h-3 w-3' : 'h-3.5 w-3.5'
                  )}
                  aria-hidden="true"
                />
                {reason}
              </span>
            ))}
          </div>
        </div>

        <div
          className={cn(
            'mt-4 flex items-center gap-2 rounded-[1rem] border border-border/50 bg-proofound-parchment/36 text-left text-muted-foreground',
            compact ? 'px-2.5 py-2 text-[0.58rem]' : 'px-3 py-2.5 text-[0.7rem]'
          )}
        >
          <HelpCircle
            className={cn('shrink-0 text-foreground/52', compact ? 'h-4 w-4' : 'h-5 w-5')}
            aria-hidden="true"
          />
          <span>Needs review: Vendor ops</span>
        </div>
      </div>
    );
  }

  const rows = state.isPrecision
    ? [
        { label: 'Evidence fit', value: 'High' },
        { label: 'Verification depth', value: 'Strong' },
        { label: 'Scope match', value: 'Clear' },
        { label: 'Decision clarity', value: '87%' },
      ]
    : [
        { label: 'Outcome evidence', value: 'Mapped' },
        { label: 'Verification', value: 'Attached' },
        { label: 'Privacy posture', value: 'Controlled' },
      ];

  return (
    <div
      className={cn(
        GLASS_SHELL,
        'overflow-hidden rounded-[1.65rem] p-4',
        compact ? 'w-full max-w-[10.5rem]' : 'w-full max-w-[15.5rem]'
      )}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-white/65 px-3 py-1 text-[0.62rem] uppercase tracking-[0.22em] text-foreground/68">
            <SquareStack className="h-3.5 w-3.5 text-proofound-forest/80" aria-hidden="true" />
            {state.isPrecision ? 'Best match' : 'Assessment matrix'}
          </div>
          <p className={cn('font-display text-foreground', compact ? 'text-lg' : 'text-[1.45rem]')}>
            {state.isPrecision ? 'Fit summary' : 'Shared language'}
          </p>
        </div>

        <div className={cn(state.isPrecision ? 'grid grid-cols-2 gap-3' : 'space-y-3')}>
          {rows.map((row) => (
            <div
              key={row.label}
              className="rounded-[1rem] border border-white/58 bg-white/52 px-3 py-3"
            >
              <p className="text-[0.62rem] uppercase tracking-[0.22em] text-foreground/45">
                {row.label}
              </p>
              <p className="mt-1 text-sm text-foreground/82">{row.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroDesktopCopy({
  frame,
  onIndividualSignup,
  onOrganizationSignup,
  reduceMotion,
}: {
  frame: HomepageStoryFrame;
  onIndividualSignup?: () => void;
  onOrganizationSignup?: () => void;
  reduceMotion: boolean;
}) {
  return (
    <div className="relative z-10 flex max-w-[58rem] flex-col justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={frame.id}
          initial={reduceMotion ? { y: 0 } : { y: STORY_COPY_ENTER_Y }}
          animate={{ y: 0 }}
          exit={reduceMotion ? { y: 0 } : { y: STORY_COPY_EXIT_Y }}
          transition={reduceMotion ? { duration: 0 } : STORY_TRANSITION}
          className="space-y-8"
        >
          <h1 className="max-w-none font-display text-[7.4rem] font-semibold leading-[0.82] text-foreground xl:text-[9.35rem]">
            <span className="block">Proof behind</span>
            <span className="block">the claim</span>
          </h1>

          <div className="max-w-[34rem] space-y-5">
            <p className="text-[1.06rem] leading-8 text-foreground/74 xl:text-[1.18rem]">
              {frame.body}
            </p>
            {frame.microcopy ? (
              <p className="text-sm leading-6 text-foreground/70">{frame.microcopy}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-4 pt-2 sm:flex-row">
            <button
              type="button"
              onClick={onOrganizationSignup}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-proofound-forest px-7 py-4 text-base font-medium text-white shadow-[0_14px_30px_-18px_rgba(28,77,58,0.52)] transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:bg-proofound-forest/92 hover:shadow-[0_20px_38px_-24px_rgba(28,77,58,0.58)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest/35 focus-visible:ring-offset-4 focus-visible:ring-offset-proofound-parchment active:translate-y-0"
            >
              Request a pilot
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onIndividualSignup}
              className="inline-flex items-center justify-center rounded-full border border-border/80 bg-white/72 px-7 py-4 text-base font-medium text-foreground shadow-[0_12px_28px_-24px_rgba(45,51,48,0.36)] transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_34px_-26px_rgba(45,51,48,0.42)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest/35 focus-visible:ring-offset-4 focus-visible:ring-offset-proofound-parchment active:translate-y-0"
            >
              Create your proof portfolio
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function HeroToBlindBackground({
  progress,
  target,
  motionKey,
  reduceMotion,
}: {
  progress: number;
  target: number;
  motionKey: number;
  reduceMotion: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playbackFrameRef = useRef<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [loadedVideoKey, setLoadedVideoKey] = useState(0);
  const [videoActive, setVideoActive] = useState(false);
  const clampedProgress = clamp01(progress);
  const clampedTarget = clamp01(target);
  const backgroundImageSizes = '(min-width: 1024px) 50vw, 100vw';

  useEffect(() => {
    const video = videoRef.current;
    if (!video || duration == null || loadedVideoKey !== motionKey) {
      return;
    }

    const safeDuration = Math.max(0.001, duration - 0.04);

    if (playbackFrameRef.current != null) {
      window.cancelAnimationFrame(playbackFrameRef.current);
      playbackFrameRef.current = null;
    }

    if (motionKey === 0) {
      video.currentTime = 0.001;
      void video.pause();
      setVideoActive(false);
      return;
    }

    if (reduceMotion) {
      video.currentTime = safeDuration * clampedTarget;
      void video.pause();
      setVideoActive(false);
      return;
    }

    setVideoActive(true);

    void video.pause();
    const startTime = clamp01(video.currentTime / safeDuration) * safeDuration || 0.001;
    const targetTime = clampedTarget === 1 ? safeDuration : 0.001;
    const startedAt = performance.now();
    const durationMs = HERO_TO_BLIND_TRANSITION_SECONDS * 1000;

    if (clampedTarget === 1) {
      const rate = (safeDuration - startTime) / (durationMs / 1000);
      video.playbackRate = rate > 0.1 ? rate : 1;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }

      const stepPlaybackForward = () => {
        if (video.currentTime >= targetTime - 0.05) {
          video.pause();
          video.currentTime = targetTime;
          setVideoActive(false);
          playbackFrameRef.current = null;
        } else {
          playbackFrameRef.current = window.requestAnimationFrame(stepPlaybackForward);
        }
      };
      playbackFrameRef.current = window.requestAnimationFrame(stepPlaybackForward);
    } else {
      let lastSeekTime = video.currentTime;
      const stepPlaybackBackward = (timestamp: number) => {
        const elapsed = clamp01((timestamp - startedAt) / durationMs);
        const eased = easeInOut(elapsed);
        const nextTime = mix(startTime, targetTime, eased);

        if (Math.abs(nextTime - lastSeekTime) > 0.04 || elapsed === 1) {
          video.currentTime = nextTime;
          lastSeekTime = nextTime;
        }

        if (elapsed < 1) {
          playbackFrameRef.current = window.requestAnimationFrame(stepPlaybackBackward);
          return;
        }

        video.currentTime = targetTime;
        setVideoActive(false);
        playbackFrameRef.current = null;
      };
      playbackFrameRef.current = window.requestAnimationFrame(stepPlaybackBackward);
    }
  }, [clampedTarget, duration, loadedVideoKey, motionKey, reduceMotion]);

  useEffect(() => {
    return () => {
      if (playbackFrameRef.current != null) {
        window.cancelAnimationFrame(playbackFrameRef.current);
      }
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#e9e1d5]" />

      {reduceMotion ? (
        <Image
          src={
            clampedTarget === 1
              ? '/hero-transition-video/hero-bg-last.png'
              : '/hero-transition-video/hero-bg-first.png'
          }
          alt=""
          fill
          sizes={backgroundImageSizes}
          priority
          className="object-cover object-center opacity-[0.96]"
        />
      ) : (
        <>
          <Image
            src="/hero-transition-video/hero-bg-first.png"
            alt=""
            fill
            sizes={backgroundImageSizes}
            priority
            className="object-cover object-center"
            style={{ opacity: 1 - clampedProgress }}
          />
          <Image
            src="/hero-transition-video/hero-bg-last.png"
            alt=""
            fill
            sizes={backgroundImageSizes}
            priority
            className="object-cover object-center"
            style={{ opacity: clampedProgress }}
          />
          <video
            key={motionKey}
            ref={videoRef}
            muted
            playsInline
            preload="auto"
            onLoadedMetadata={(event) => {
              const nextDuration = event.currentTarget.duration;
              setDuration(Number.isFinite(nextDuration) ? nextDuration : null);
              setLoadedVideoKey(motionKey);
              const metadataDuration = Number.isFinite(nextDuration) ? nextDuration : 0;
              event.currentTarget.currentTime =
                clampedTarget === 1 ? 0.001 : Math.max(0, metadataDuration - 0.04);
              void event.currentTarget.pause();
            }}
            className={cn(
              'absolute inset-0 h-full w-full scale-[1.02] object-cover object-center transition-opacity duration-150',
              videoActive ? 'opacity-100' : 'opacity-0'
            )}
          >
            <source src="/hero-transition-video/hero-to-blind-browser.m4v" type="video/mp4" />
            <source src="/hero-transition-video/hero-to-blind.mp4" type="video/mp4" />
          </video>
        </>
      )}

      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(247,242,234,0.64) 0%, rgba(247,242,234,0.34) 31%, rgba(247,242,234,0.12) 56%, rgba(31,39,31,0.06) 100%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 24% 28%, rgba(255,255,255,0.12), transparent 32%), radial-gradient(circle at 78% 66%, rgba(22,31,24,0.1), transparent 34%)',
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[28vh]"
        style={{
          background:
            'linear-gradient(180deg, rgba(244,239,231,0) 0%, rgba(235,230,220,0.08) 44%, rgba(60,72,60,0.14) 100%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.055] mix-blend-soft-light"
        style={{
          backgroundImage: 'url("/noise.png")',
          backgroundSize: '240px 240px',
        }}
      />
    </div>
  );
}

function StandardDesktopCopy({
  frame,
  reduceMotion,
}: {
  frame: HomepageStoryFrame;
  reduceMotion: boolean;
}) {
  return (
    <div className="relative flex max-w-[33rem] flex-col justify-center gap-8">
      <AnimatePresence mode="wait">
        <motion.div
          key={frame.id}
          initial={reduceMotion ? { y: 0 } : { y: STORY_COPY_ENTER_Y }}
          animate={{ y: 0 }}
          exit={reduceMotion ? { y: 0 } : { y: STORY_COPY_EXIT_Y }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-6"
        >
          <StoryEyebrow frame={frame} />
          <h2 className="max-w-[13ch] font-display text-5xl leading-[0.96] text-foreground md:text-[4.2rem]">
            {frame.title}
          </h2>
          <p className="max-w-[33rem] text-lg leading-8 text-muted-foreground md:text-[1.16rem]">
            {frame.body}
          </p>
          {frame.microcopy ? (
            <p className="max-w-[24rem] text-sm leading-6 text-foreground/60">{frame.microcopy}</p>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

const ORGANIZER_BOX_WIDTH_PX = 770;
const ORGANIZER_BACK_HEIGHT_PX = Math.round((ORGANIZER_BOX_WIDTH_PX * 796) / 1448);
const ORGANIZER_FRONT_HEIGHT_PX = Math.round((ORGANIZER_BOX_WIDTH_PX * 289) / 1448);
const ORGANIZER_BOTTOM_PX = -32;
const STORY_VISUAL_FRAME_HEIGHT_PX = 672;
const STORY_RESUME_TOP_PX = STORY_VISUAL_FRAME_HEIGHT_PX * 0.08;
const STORY_RESUME_HEIGHT_PX = STORY_VISUAL_FRAME_HEIGHT_PX * 0.84;
const ORGANIZER_POCKET_LINE_PX =
  STORY_VISUAL_FRAME_HEIGHT_PX - ORGANIZER_BOTTOM_PX - ORGANIZER_FRONT_HEIGHT_PX;
const OUTCOME_CARD_WIDTH_PX = 144;
const OUTCOME_CARD_HEIGHT_PX = 291;

const outcomeCardLayers = [
  {
    src: '/hero-resume-stack/outcome-card-01.png',
    left: 157,
    top: 290,
    width: OUTCOME_CARD_WIDTH_PX,
    height: OUTCOME_CARD_HEIGHT_PX,
    zIndex: 12,
  },
  {
    src: '/hero-resume-stack/outcome-card-02.png',
    left: 313,
    top: 289,
    width: OUTCOME_CARD_WIDTH_PX,
    height: OUTCOME_CARD_HEIGHT_PX,
    zIndex: 13,
  },
  {
    src: '/hero-resume-stack/outcome-card-03.png',
    left: 469,
    top: 289,
    width: OUTCOME_CARD_WIDTH_PX,
    height: OUTCOME_CARD_HEIGHT_PX,
    zIndex: 14,
  },
] as const;

const compatibilityRoleStack = [
  {
    src: '/compatibility-transition-assets/role-senior-project-lead.png',
    alt: 'Senior Project Lead role sheet',
    width: 400,
    left: 310,
    top: 58,
    zIndex: 1,
  },
  {
    src: '/compatibility-transition-assets/role-operations-manager.png',
    alt: 'Operations Manager role sheet',
    width: 420,
    left: 170,
    top: 228,
    zIndex: 2,
  },
  {
    src: '/compatibility-transition-assets/role-product-operations-lead.png',
    alt: 'Product Operations Lead role sheet',
    width: 490,
    left: 86,
    top: 404,
    zIndex: 3,
  },
] as const;

const compatibilityProfileStack = [
  {
    src: '/compatibility-transition-assets/profile-program-manager.png',
    alt: 'Program Manager proof profile card',
    width: 310,
    right: 225,
    top: 60,
    zIndex: 1,
  },
  {
    src: '/compatibility-transition-assets/profile-people-operations-strategist.png',
    alt: 'People Operations Strategist proof profile card',
    width: 330,
    right: 125,
    top: 242,
    zIndex: 2,
  },
  {
    src: '/compatibility-transition-assets/profile-delivery-operations-lead.png',
    alt: 'Delivery Operations Lead proof profile card',
    width: 360,
    right: 40,
    top: 428,
    zIndex: 3,
  },
] as const;

function StoryEyebrow({
  frame,
  centered = false,
}: {
  frame: HomepageStoryFrame;
  centered?: boolean;
}) {
  void frame;
  void centered;
  return null;
}

function OrganizerBoxVisual({ slideY = 0, className }: { slideY?: number; className?: string }) {
  return (
    <>
      <motion.div
        className={cn('absolute left-1/2 z-0', className)}
        style={{
          width: ORGANIZER_BOX_WIDTH_PX,
          height: ORGANIZER_BACK_HEIGHT_PX,
          x: '-50%',
          y: slideY,
          bottom: ORGANIZER_BOTTOM_PX + ORGANIZER_FRONT_HEIGHT_PX,
        }}
      >
        <Image
          src="/hero-resume-stack/organizer-back.png"
          alt=""
          width={1448}
          height={796}
          sizes="770px"
          className="pointer-events-none h-full w-full select-none object-fill drop-shadow-[0_34px_80px_rgba(55,45,30,0.18)]"
        />
      </motion.div>

      <motion.div
        className={cn('absolute left-1/2 z-20', className)}
        style={{
          width: ORGANIZER_BOX_WIDTH_PX,
          height: ORGANIZER_FRONT_HEIGHT_PX,
          x: '-50%',
          y: slideY,
          bottom: ORGANIZER_BOTTOM_PX,
        }}
      >
        <Image
          src="/hero-resume-stack/organizer-front.png"
          alt=""
          width={1448}
          height={289}
          sizes="770px"
          className="pointer-events-none h-full w-full select-none object-fill drop-shadow-[0_18px_34px_rgba(34,38,30,0.18)]"
        />
      </motion.div>
    </>
  );
}

function Candidate24Sheet({
  y = 0,
  opacity = 1,
  clipBottom = 0,
  initial = false,
  animate,
  transition,
}: {
  y?: number;
  opacity?: number;
  clipBottom?: number;
  initial?: React.ComponentProps<typeof motion.div>['initial'];
  animate?: React.ComponentProps<typeof motion.div>['animate'];
  transition?: React.ComponentProps<typeof motion.div>['transition'];
}) {
  return (
    <motion.div
      className="absolute inset-x-[14%] inset-y-[8%] z-10"
      initial={initial}
      animate={animate}
      transition={transition}
      style={{
        y,
        opacity,
        clipPath: `inset(0px 0px ${clipBottom}px 0px)`,
      }}
    >
      <Image
        src="/hero-resume-stack/candidate-24-sheet.png"
        alt=""
        fill
        sizes="22rem"
        className="pointer-events-none select-none object-contain drop-shadow-[0_18px_40px_rgba(55,45,30,0.14)]"
      />
    </motion.div>
  );
}

function OutcomeOrganizerLayers({
  reduceMotion,
  proofsView = false,
  verificationView = false,
  privacyView = false,
  entryDelay = 0,
}: {
  reduceMotion: boolean;
  proofsView?: boolean;
  verificationView?: boolean;
  privacyView?: boolean;
  entryDelay?: number;
}) {
  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: 1.12, ease: STORY_TRANSITION.ease, delay: entryDelay + 0.26 };

  return (
    <motion.div
      aria-label="Structured outcome cards arranged inside the organizer"
      role="img"
      className="absolute inset-y-0 left-1/2 z-10"
      style={{
        width: ORGANIZER_BOX_WIDTH_PX,
        x: '-50%',
        clipPath: `inset(0px 0px ${ORGANIZER_BOTTOM_PX + ORGANIZER_FRONT_HEIGHT_PX}px 0px)`,
      }}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.24, delay: entryDelay + 0.18 }}
    >
      <AnimatePresence>
        {privacyView && (
          <motion.div
            className="absolute left-1/2 top-[-10px] z-[7]"
            initial={reduceMotion ? false : { y: -100, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: -100, opacity: 0, x: '-50%' }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 0.95, ease: STORY_TRANSITION.ease, delay: entryDelay + 0.1 }
            }
          >
            <Image
              src="/hero-resume-stack/confidential-card.png"
              alt="Confidential Card"
              width={800}
              height={800}
              sizes="310px"
              className="pointer-events-none h-auto w-[310px] max-w-none select-none drop-shadow-[0_15px_30px_rgba(55,45,30,0.1)]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="absolute left-1/2 top-[116px] z-[8]"
        initial={reduceMotion ? false : { y: 404, opacity: 0, x: '-50%' }}
        animate={{ y: proofsView ? -30 : 0, opacity: 1, x: '-50%' }}
        transition={transition}
      >
        <Image
          src="/hero-resume-stack/outcome-summary-folder.png"
          alt=""
          width={1916}
          height={821}
          sizes="534px"
          className="pointer-events-none h-auto w-[534px] max-w-none select-none drop-shadow-[0_20px_38px_rgba(55,45,30,0.14)]"
        />
      </motion.div>

      {outcomeCardLayers.map((card, index) => (
        <motion.div
          key={card.src}
          className="absolute"
          initial={reduceMotion ? false : { y: 390, opacity: 0 }}
          animate={{ y: proofsView ? -60 : 0, opacity: 1 }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  duration: 1.08,
                  ease: STORY_TRANSITION.ease,
                  delay: entryDelay + 0.38 + index * 0.08,
                }
          }
          style={{
            left: card.left,
            top: card.top,
            width: card.width,
            height: card.height,
            zIndex: card.zIndex,
          }}
        >
          <Image
            src={card.src}
            alt=""
            fill
            sizes={`${card.width}px`}
            className="pointer-events-none select-none object-contain drop-shadow-[0_20px_34px_rgba(55,45,30,0.16)]"
          />
          <AnimatePresence>
            {verificationView && (
              <motion.div
                className="absolute right-[4px] top-[30px] z-20"
                initial={reduceMotion ? false : { y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 24, opacity: 0 }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: 0.8, ease: STORY_TRANSITION.ease, delay: 0.2 + index * 0.1 }
                }
              >
                <Image
                  src="/hero-resume-stack/verification-badge.png"
                  alt="Verified"
                  width={200}
                  height={200}
                  sizes="84px"
                  className="pointer-events-none h-auto w-[84px] max-w-none select-none drop-shadow-md"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}

      <AnimatePresence>
        {proofsView && (
          <motion.div
            className="absolute left-1/2 z-[15]"
            initial={reduceMotion ? false : { y: 390, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: 390, opacity: 0, x: '-50%' }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 1.08, ease: STORY_TRANSITION.ease, delay: entryDelay + 0.1 }
            }
            style={{ top: 310 }}
          >
            <Image
              src="/hero-resume-stack/proof-row-2.png"
              alt="Proof documents background row"
              width={1600}
              height={400}
              sizes="496px"
              className="pointer-events-none h-auto w-[496px] max-w-none select-none drop-shadow-[0_15px_25px_rgba(55,45,30,0.12)]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {proofsView && (
          <motion.div
            className="absolute left-1/2 z-[16]"
            initial={reduceMotion ? false : { y: 390, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: 390, opacity: 0, x: '-50%' }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 1.08, ease: STORY_TRANSITION.ease, delay: entryDelay + 0.18 }
            }
            style={{ top: 410 }}
          >
            <Image
              src="/hero-resume-stack/proof-row-1.png"
              alt="Proof documents foreground row"
              width={1600}
              height={400}
              sizes="528px"
              className="pointer-events-none h-auto w-[528px] max-w-none select-none drop-shadow-[0_20px_34px_rgba(55,45,30,0.16)]"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FinalOrganizerVisual({
  outcomeView = false,
  proofsView = false,
  verificationView = false,
  privacyView = false,
  reduceMotion = false,
}: {
  outcomeView?: boolean;
  proofsView?: boolean;
  verificationView?: boolean;
  privacyView?: boolean;
  reduceMotion?: boolean;
}) {
  const candidateExitY = ORGANIZER_BACK_HEIGHT_PX + ORGANIZER_FRONT_HEIGHT_PX + 72;
  const outcomeEntryDelay =
    outcomeView && !proofsView && !verificationView && !privacyView ? 1.0 : 0;
  const candidateClipBottom = Math.max(
    0,
    STORY_RESUME_TOP_PX + STORY_RESUME_HEIGHT_PX + candidateExitY - ORGANIZER_POCKET_LINE_PX
  );

  return (
    <div className={cn('relative isolate', DESKTOP_CARD_FRAME)}>
      <AnimatePresence initial={false}>
        {!outcomeView ? (
          <Candidate24Sheet key="candidate-blind-sheet" />
        ) : (
          <Candidate24Sheet
            key="candidate-blind-sheet-exit"
            initial={
              reduceMotion ? false : { y: 0, opacity: 1, clipPath: 'inset(0px 0px 0px 0px)' }
            }
            animate={{
              y: reduceMotion ? candidateExitY : candidateExitY,
              opacity: reduceMotion ? 0 : 1,
              clipPath: `inset(0px 0px ${candidateClipBottom}px 0px)`,
            }}
            transition={
              reduceMotion ? { duration: 0 } : { duration: 1.08, ease: STORY_TRANSITION.ease }
            }
          />
        )}
      </AnimatePresence>
      {outcomeView ? (
        <OutcomeOrganizerLayers
          reduceMotion={reduceMotion}
          proofsView={proofsView}
          verificationView={verificationView}
          privacyView={privacyView}
          entryDelay={outcomeEntryDelay}
        />
      ) : null}
      <OrganizerBoxVisual />
    </div>
  );
}

function HeroToBlindDesktopScene({
  heroFrame,
  blindFrame,
  transitionProgress,
  onIndividualSignup,
  onOrganizationSignup,
  reduceMotion,
}: {
  heroFrame: HomepageStoryFrame;
  blindFrame: HomepageStoryFrame;
  transitionProgress: number;
  onIndividualSignup?: () => void;
  onOrganizationSignup?: () => void;
  reduceMotion: boolean;
}) {
  const progress = clamp01(transitionProgress);
  const [sheetSwapProgress, setSheetSwapProgress] = useState(reduceMotion ? 1 : 0);
  const sheetSwapProgressRef = useRef(reduceMotion ? 1 : 0);
  const heroTravel = 860;
  const blindEntry = 860;
  const heroOffsetY = mix(0, -heroTravel, progress);
  const blindOffsetY = mix(blindEntry, 0, progress);
  const pileOffsetY = mix(0, -heroTravel, progress);
  const heroExitOpacity = 1;
  const pileExitOpacity = mix(1, 0, easeIn(clamp01((progress - 0.56) / 0.18)));
  const blindCopyOpacity = 1;
  const organizerProgress = easeInOut(progress);
  const organizerSlideY = mix(1400, 0, organizerProgress);
  const effectiveSheetSwapProgress = reduceMotion ? (progress >= 0.995 ? 1 : 0) : sheetSwapProgress;
  const outgoingSheetProgress = easeInOut(clamp01(effectiveSheetSwapProgress / 0.58));
  const incomingSheetProgress = easeInOut(clamp01((effectiveSheetSwapProgress - 0.68) / 0.32));
  const originalResumeSettleY = mix(
    0,
    ORGANIZER_BACK_HEIGHT_PX + ORGANIZER_FRONT_HEIGHT_PX + 72,
    outgoingSheetProgress
  );
  const replacementResumeY = mix(460, 0, incomingSheetProgress);
  const originalResumeOpacity = outgoingSheetProgress < 0.995 ? 1 : 0;
  const replacementResumeOpacity = incomingSheetProgress > 0 ? 1 : 0;
  const originalResumeClipBottom = Math.max(
    0,
    STORY_RESUME_TOP_PX + STORY_RESUME_HEIGHT_PX + originalResumeSettleY - ORGANIZER_POCKET_LINE_PX
  );
  const replacementResumeClipBottom = Math.max(
    0,
    STORY_RESUME_TOP_PX + STORY_RESUME_HEIGHT_PX + replacementResumeY - ORGANIZER_POCKET_LINE_PX
  );

  useEffect(() => {
    if (reduceMotion) {
      sheetSwapProgressRef.current = 1;
      setSheetSwapProgress(1);
      return;
    }

    if (progress < 0.995) {
      sheetSwapProgressRef.current = 0;
      setSheetSwapProgress(0);
      return;
    }

    const controls = animate(sheetSwapProgressRef.current, 1, {
      duration: 2.25,
      delay: 0.18,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (value) => {
        sheetSwapProgressRef.current = value;
        setSheetSwapProgress(value);
      },
    });

    return () => controls.stop();
  }, [progress, reduceMotion]);

  return (
    <div className="relative min-h-[45rem]">
      <div className="grid min-h-[45rem] grid-cols-[minmax(0,1fr)_31rem] items-center gap-0 overflow-visible">
        <div className="relative h-[42rem] overflow-hidden pr-10">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
            <motion.div
              className="space-y-8 will-change-transform"
              style={{ y: heroOffsetY, opacity: heroExitOpacity }}
            >
              <h1 className="max-w-none font-display text-[7.4rem] font-semibold leading-[0.82] text-foreground xl:text-[9.35rem]">
                <span className="block">Proof behind</span>
                <span className="block">the claim</span>
              </h1>

              <div className="max-w-[34rem] space-y-5">
                <p className="text-[1.06rem] leading-8 text-foreground/74 xl:text-[1.18rem]">
                  {heroFrame.body}
                </p>
                {heroFrame.microcopy ? (
                  <p className="text-sm leading-6 text-foreground/70">{heroFrame.microcopy}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-4 pt-2 sm:flex-row">
                <button
                  type="button"
                  onClick={onOrganizationSignup}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-proofound-forest px-7 py-4 text-base font-medium text-white shadow-[0_14px_30px_-18px_rgba(28,77,58,0.52)] transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:bg-proofound-forest/92 hover:shadow-[0_20px_38px_-24px_rgba(28,77,58,0.58)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest/35 focus-visible:ring-offset-4 focus-visible:ring-offset-proofound-parchment active:translate-y-0"
                >
                  Request a pilot
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={onIndividualSignup}
                  className="inline-flex items-center justify-center rounded-full border border-border/80 bg-white/72 px-7 py-4 text-base font-medium text-foreground shadow-[0_12px_28px_-24px_rgba(45,51,48,0.36)] transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_34px_-26px_rgba(45,51,48,0.42)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest/35 focus-visible:ring-offset-4 focus-visible:ring-offset-proofound-parchment active:translate-y-0"
                >
                  Create your proof portfolio
                </button>
              </div>
            </motion.div>
          </div>

          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
            <motion.div
              className="max-w-[33rem] space-y-7 will-change-transform"
              style={{ y: blindOffsetY, opacity: blindCopyOpacity }}
            >
              <StoryEyebrow frame={blindFrame} />
              <h2 className="max-w-[13ch] font-display text-5xl leading-[0.94] text-foreground md:text-[4.2rem]">
                {blindFrame.title}
              </h2>
              <p className="max-w-[33rem] text-lg leading-8 text-muted-foreground md:text-[1.16rem]">
                {blindFrame.body}
              </p>
              {blindFrame.microcopy ? (
                <p className="max-w-[24rem] text-sm leading-6 text-foreground/60">
                  {blindFrame.microcopy}
                </p>
              ) : null}
            </motion.div>
          </div>
        </div>

        <motion.div
          className="relative z-20 flex justify-end will-change-transform"
          initial={false}
          animate={{ x: -28, y: -22, scale: 1.08 }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  duration: 0.95,
                  ease: [0.22, 1, 0.36, 1],
                }
          }
        >
          <div className={cn('relative isolate', DESKTOP_CARD_FRAME)}>
            <motion.div
              style={{ y: pileOffsetY, opacity: pileExitOpacity }}
              className="absolute inset-0"
            >
              <HeroResumePaperPile />
            </motion.div>
            <motion.div
              className="absolute inset-0 z-10"
              style={{
                y: originalResumeSettleY,
                opacity: originalResumeOpacity,
                clipPath: `inset(0px 0px ${originalResumeClipBottom}px 0px)`,
              }}
            >
              <HeroResumeSheet />
            </motion.div>

            <Candidate24Sheet
              y={replacementResumeY}
              opacity={replacementResumeOpacity}
              clipBottom={replacementResumeClipBottom}
            />

            <OrganizerBoxVisual slideY={organizerSlideY} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function SystemCenterCopy({
  frame,
  state,
  reduceMotion,
  compact = false,
  enterFromPrivacy = false,
}: {
  frame: HomepageStoryFrame;
  state: StoryState;
  reduceMotion: boolean;
  compact?: boolean;
  enterFromPrivacy?: boolean;
}) {
  const isPrecision = state.isPrecision && !state.isChallenges;
  const isCompatibility = frame.id === 'compatibility';
  const privacyFrame = HOMEPAGE_STORY_FRAMES.find((storyFrame) => storyFrame.id === 'privacy');

  return (
    <motion.div
      initial={enterFromPrivacy && !reduceMotion ? { x: compact ? -120 : -430 } : false}
      animate={{ x: 0 }}
      transition={reduceMotion ? { duration: 0 } : { ...STORY_TRANSITION, duration: 1.08 }}
      className={cn(
        'relative z-20 flex flex-col items-center text-center',
        compact
          ? 'max-w-[12rem] gap-4'
          : isPrecision || isCompatibility
            ? 'max-w-[28rem] gap-5'
            : 'max-w-[18rem] gap-5'
      )}
    >
      <AnimatePresence mode="wait">
        {enterFromPrivacy && privacyFrame ? (
          <motion.div
            key="privacy-to-compatibility-copy"
            initial={reduceMotion ? false : { y: 0 }}
            animate={{ y: 0 }}
            exit={reduceMotion ? { y: 0 } : { y: STORY_COPY_EXIT_Y }}
            transition={reduceMotion ? { duration: 0 } : STORY_TRANSITION}
            className="relative min-h-[20rem] w-full"
          >
            <motion.div
              initial={false}
              animate={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4, filter: 'blur(4px)' }}
              transition={
                reduceMotion ? { duration: 0 } : { duration: 0.62, ease: [0.22, 1, 0.36, 1] }
              }
              className="absolute inset-x-0 top-0 mx-auto max-w-[18rem] space-y-4 text-left"
            >
              <StoryEyebrow frame={privacyFrame} />
              <h2
                className={cn(
                  'font-display text-foreground',
                  compact ? 'text-[2rem] leading-[0.96]' : 'text-[3.72rem] leading-[0.9]'
                )}
              >
                {privacyFrame.title}
              </h2>
              <p
                className={cn(
                  'text-foreground/70',
                  compact ? 'text-sm leading-6' : 'text-[1rem] leading-7'
                )}
              >
                {privacyFrame.body}
              </p>
            </motion.div>

            <motion.div
              initial={reduceMotion ? { y: 0 } : { y: STORY_COPY_ENTER_Y }}
              animate={{ y: 0 }}
              transition={reduceMotion ? { duration: 0 } : { ...STORY_TRANSITION, delay: 0.24 }}
              className="absolute inset-x-0 top-0 mx-auto max-w-[18rem] space-y-4"
            >
              <StoryEyebrow frame={frame} centered />
              <h2
                className={cn(
                  'font-display text-foreground',
                  compact ? 'text-[2rem] leading-[0.96]' : 'text-[3.72rem] leading-[0.9]'
                )}
              >
                {frame.title}
              </h2>
              <p
                className={cn(
                  'text-foreground/70',
                  compact ? 'text-sm leading-6' : 'text-[1rem] leading-7'
                )}
              >
                {frame.body}
              </p>
              {frame.microcopy ? (
                <p className="mx-auto max-w-[17rem] text-[0.78rem] leading-5 text-foreground/52">
                  {frame.microcopy}
                </p>
              ) : null}
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key={frame.id}
            initial={reduceMotion ? { y: 0 } : { y: STORY_COPY_ENTER_Y }}
            animate={{ y: 0 }}
            exit={reduceMotion ? { y: 0 } : { y: STORY_COPY_EXIT_Y }}
            transition={reduceMotion ? { duration: 0 } : STORY_TRANSITION}
            className={cn('space-y-4', isCompatibility ? 'max-w-[22rem]' : 'max-w-[18rem]')}
          >
            <StoryEyebrow frame={frame} centered />
            <h2
              className={cn(
                'font-display text-foreground',
                compact ? 'text-[2rem] leading-[0.96]' : 'text-[3.72rem] leading-[0.92]'
              )}
            >
              {frame.title}
            </h2>
            <p
              className={cn(
                'text-foreground/70',
                compact ? 'text-sm leading-6' : 'text-[1rem] leading-7'
              )}
            >
              {frame.body}
            </p>
            {frame.microcopy ? (
              <p className="mx-auto max-w-[17rem] text-[0.78rem] leading-5 text-foreground/52">
                {frame.microcopy}
              </p>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isPrecision && (
          <motion.div
            key="precision-card"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
            transition={reduceMotion ? { duration: 0 } : STORY_TRANSITION}
            className="mt-8 flex w-full justify-center"
          >
            <Image
              src="/hero-resume-stack/precision-card.png"
              alt="Precision Solutions Card"
              width={800}
              height={600}
              className="h-auto w-[28rem] drop-shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CompatibilitySideStacks({
  progress,
  exitProgress = 0,
  challengeExitProgress = 0,
  reduceMotion,
}: {
  progress: number;
  exitProgress?: number;
  challengeExitProgress?: number;
  reduceMotion: boolean;
}) {
  const stackProgress = reduceMotion ? (progress >= 1 ? 1 : 0) : easeOut((progress - 0.7) / 0.3);
  const leftX = mix(-1000, -170, stackProgress);
  const rightX = mix(1000, 120, stackProgress);
  const challengeExit = clamp01(challengeExitProgress);
  const stackOpacity = mix(1, 0, challengeExit);
  const frontCardLift = -116;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 overflow-visible">
      <motion.div
        className="absolute inset-y-0 left-0 w-[45rem] origin-left will-change-transform"
        style={{ x: leftX, opacity: stackOpacity, scale: 0.94 }}
      >
        {compatibilityRoleStack.map((card, idx) => {
          const isFront = idx === 2;
          const cardExitY = isFront
            ? mix(0, frontCardLift, exitProgress)
            : mix(0, -1000, exitProgress);
          const cardOpacity =
            (isFront ? 1 : mix(1, 0, clamp01(exitProgress * 2.5))) * (1 - challengeExit);
          const cardScale = isFront ? mix(1, 1.15, exitProgress) : 1;

          return (
            <motion.div
              key={card.src}
              className="absolute will-change-transform"
              style={{
                left: card.left,
                top: card.top,
                width: card.width,
                zIndex: card.zIndex,
                y: cardExitY,
                opacity: cardOpacity,
                scale: cardScale,
              }}
            >
              <Image
                src={card.src}
                alt=""
                width={1448}
                height={1086}
                sizes={`${card.width}px`}
                className="pointer-events-none h-auto w-full max-w-none select-none drop-shadow-[0_28px_48px_rgba(55,45,30,0.22)]"
              />
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div
        className="absolute inset-y-0 right-0 w-[50rem] origin-right will-change-transform"
        style={{ x: rightX, opacity: stackOpacity, scale: 0.94 }}
      >
        {compatibilityProfileStack.map((card, idx) => {
          const isFront = idx === 2;
          const cardExitY = isFront
            ? mix(0, frontCardLift, exitProgress)
            : mix(0, -1000, exitProgress);
          const cardOpacity =
            (isFront ? 1 : mix(1, 0, clamp01(exitProgress * 2.5))) * (1 - challengeExit);
          const cardScale = isFront ? mix(1, 1.15, exitProgress) : 1;

          return (
            <motion.div
              key={card.src}
              className="absolute will-change-transform"
              style={{
                right: card.right,
                top: card.top,
                width: card.width,
                zIndex: card.zIndex,
                y: cardExitY,
                opacity: cardOpacity,
                scale: cardScale,
              }}
            >
              <Image
                src={card.src}
                alt=""
                width={760}
                height={600}
                sizes={`${card.width}px`}
                className="pointer-events-none h-auto w-full max-w-none select-none drop-shadow-[0_28px_48px_rgba(55,45,30,0.24)]"
              />
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

function ModernChallengesSidePanels({
  reduceMotion,
  animateIn = false,
}: {
  reduceMotion: boolean;
  animateIn?: boolean;
}) {
  const panelTransition = reduceMotion ? { duration: 0 } : { ...STORY_TRANSITION, duration: 0.95 };

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-1/2 z-0 flex w-[min(92vw,72rem)] -translate-x-1/2 -translate-y-1/2 items-center justify-between gap-[24rem]"
    >
      <motion.div
        initial={animateIn && !reduceMotion ? { opacity: 0, x: -34, scale: 0.98 } : false}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={panelTransition}
        className="w-[min(24vw,23rem)] min-w-[17rem]"
      >
        <Image
          src="/challenges/hiring-teams-challenges.png"
          alt=""
          width={493}
          height={915}
          sizes="(min-width: 1280px) 23rem, 24vw"
          className="pointer-events-none h-auto w-full select-none object-contain drop-shadow-[0_30px_60px_rgba(55,45,30,0.16)]"
        />
      </motion.div>

      <motion.div
        initial={animateIn && !reduceMotion ? { opacity: 0, x: 34, scale: 0.98 } : false}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={panelTransition}
        className="w-[min(24vw,23rem)] min-w-[17rem]"
      >
        <Image
          src="/challenges/job-seekers-challenges.png"
          alt=""
          width={494}
          height={911}
          sizes="(min-width: 1280px) 23rem, 24vw"
          className="pointer-events-none h-auto w-full select-none object-contain drop-shadow-[0_30px_60px_rgba(55,45,30,0.16)]"
        />
      </motion.div>
    </div>
  );
}

function EarlyOrganizerStoryScene({
  frame,
  reduceMotion,
  privacyToCompatProgress = 0,
  compatToPrecisionProgress = 0,
  precisionToChallengesProgress = 0,
}: {
  frame: HomepageStoryFrame;
  reduceMotion: boolean;
  privacyToCompatProgress?: number;
  compatToPrecisionProgress?: number;
  precisionToChallengesProgress?: number;
}) {
  const state = deriveStoryState(frame.id);
  const isTransitioning = privacyToCompatProgress > 0;

  const privacyFrame = useMemo(() => HOMEPAGE_STORY_FRAMES.find((f) => f.id === 'privacy'), []);
  const compatibilityFrame = useMemo(
    () => HOMEPAGE_STORY_FRAMES.find((f) => f.id === 'compatibility'),
    []
  );
  const precisionFrame = useMemo(() => HOMEPAGE_STORY_FRAMES.find((f) => f.id === 'precision'), []);
  const challengesFrame = useMemo(
    () => HOMEPAGE_STORY_FRAMES.find((f) => f.id === 'challenges'),
    []
  );

  const slideLeftX = mix(0, -600, clamp01(privacyToCompatProgress / 0.8));
  const slideRightX = mix(0, 1000, clamp01(privacyToCompatProgress / 0.8));
  const overallOpacity = mix(1, 0, clamp01(privacyToCompatProgress / 0.8));

  const compatOpacity = easeIn(clamp01((privacyToCompatProgress - 0.6) / 0.4));
  const compatScale = mix(0.8, 1, easeOut(clamp01((privacyToCompatProgress - 0.6) / 0.4)));

  const precisionToChallenges = clamp01(precisionToChallengesProgress);
  const compatExitY = mix(0, -800, compatToPrecisionProgress);
  const compatExitOpacity = mix(1, 0, clamp01(compatToPrecisionProgress * 2));

  const precisionProgress = clamp01((compatToPrecisionProgress - 0.4) / 0.6);
  const precisionOpacity = easeIn(precisionProgress);
  const precisionScale = mix(0.9, 1, easeOut(precisionProgress));
  const precisionBaseY = mix(74, -34, easeOut(precisionProgress));
  const precisionExitY = mix(0, -960, easeInOut(precisionToChallenges));
  const challengesEntryY = mix(940, 0, easeInOut(precisionToChallenges));
  const showChallenges = precisionToChallenges > 0 || frame.id === 'challenges';

  return (
    <div className="relative min-h-[45rem]">
      {(isTransitioning || frame.id === 'compatibility' || frame.id === 'precision') && (
        <CompatibilitySideStacks
          progress={privacyToCompatProgress}
          exitProgress={compatToPrecisionProgress}
          challengeExitProgress={precisionToChallengesProgress}
          reduceMotion={reduceMotion}
        />
      )}

      <div className="grid min-h-[45rem] grid-cols-[minmax(0,1fr)_31rem] items-center gap-0 overflow-visible">
        <motion.div style={{ x: slideLeftX, opacity: overallOpacity }}>
          <StandardDesktopCopy
            frame={
              (frame.id === 'compatibility' || frame.id === 'precision') && privacyFrame
                ? privacyFrame
                : frame
            }
            reduceMotion={reduceMotion}
          />
        </motion.div>

        <motion.div
          className="relative z-20 flex justify-end will-change-transform"
          initial={false}
          animate={{ x: -28, y: -22, scale: 1.08 }}
          style={{ x: slideRightX, opacity: overallOpacity }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  duration: 0.95,
                  ease: [0.22, 1, 0.36, 1],
                }
          }
        >
          <FinalOrganizerVisual
            outcomeView={
              state.isOutcomes || frame.id === 'compatibility' || frame.id === 'precision'
            }
            proofsView={
              state.hasArtifacts || frame.id === 'compatibility' || frame.id === 'precision'
            }
            verificationView={
              state.hasVerification || frame.id === 'compatibility' || frame.id === 'precision'
            }
            privacyView={
              state.isPrivacy ||
              state.isSystem ||
              state.isPrecision ||
              state.isChallenges ||
              frame.id === 'compatibility' ||
              frame.id === 'precision'
            }
            reduceMotion={reduceMotion}
          />
        </motion.div>
      </div>

      {(isTransitioning || frame.id === 'compatibility' || frame.id === 'precision') &&
        compatibilityFrame && (
          <motion.div
            className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
            style={{
              opacity: mix(compatOpacity, 0, clamp01(compatToPrecisionProgress * 2.5)),
              scale: compatScale,
              y: mix(-150, -1000, compatToPrecisionProgress),
            }}
          >
            <div className="pointer-events-auto rounded-[2rem] border border-white/40 bg-[#f5f0e7]/46 px-8 py-7 shadow-[0_22px_70px_-48px_rgba(45,51,48,0.38)] backdrop-blur-[10px]">
              <SystemCenterCopy
                frame={compatibilityFrame}
                state={deriveStoryState('compatibility')}
                reduceMotion={reduceMotion}
              />
            </div>
          </motion.div>
        )}

      {(compatToPrecisionProgress > 0 || frame.id === 'precision' || showChallenges) &&
        precisionFrame && (
          <motion.div
            className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
            style={{
              opacity: precisionToChallenges >= 0.995 ? 0 : precisionOpacity,
              scale: precisionScale,
              y: precisionBaseY + precisionExitY,
            }}
          >
            <div className="pointer-events-auto">
              <SystemCenterCopy
                frame={precisionFrame}
                state={deriveStoryState('precision')}
                reduceMotion={reduceMotion}
              />
            </div>
          </motion.div>
        )}

      {showChallenges && challengesFrame && (
        <motion.div
          className="absolute inset-0 z-40 flex items-center justify-center overflow-hidden pointer-events-none"
          style={{ y: challengesEntryY, opacity: 1 }}
        >
          <div className="relative mx-auto flex min-h-[45rem] w-full items-center justify-center overflow-visible">
            <ModernChallengesSidePanels reduceMotion={reduceMotion} />

            <div className="relative z-10">
              <SystemCenterCopy
                frame={challengesFrame}
                state={deriveStoryState('challenges')}
                reduceMotion={reduceMotion}
              />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function DesktopScene({
  frame,
  heroToBlindProgress,
  privacyToCompatProgress,
  compatToPrecisionProgress,
  precisionToChallengesProgress,
  onIndividualSignup,
  onOrganizationSignup,
  reduceMotion,
}: {
  frame: HomepageStoryFrame;
  heroToBlindProgress: number;
  privacyToCompatProgress: number;
  compatToPrecisionProgress: number;
  precisionToChallengesProgress: number;
  onIndividualSignup?: () => void;
  onOrganizationSignup?: () => void;
  reduceMotion: boolean;
}) {
  const state = deriveStoryState(frame.id);
  const blindFrame = HOMEPAGE_STORY_FRAMES.find((storyFrame) => storyFrame.id === 'blind');

  if ((frame.id === 'hero' || frame.id === 'blind') && blindFrame) {
    return (
      <HeroToBlindDesktopScene
        heroFrame={HOMEPAGE_STORY_FRAMES[0]}
        blindFrame={blindFrame}
        transitionProgress={heroToBlindProgress}
        onIndividualSignup={onIndividualSignup}
        onOrganizationSignup={onOrganizationSignup}
        reduceMotion={reduceMotion}
      />
    );
  }

  if (
    frame.id === 'outcomes' ||
    frame.id === 'artifacts' ||
    frame.id === 'verification' ||
    frame.id === 'privacy' ||
    frame.id === 'compatibility' ||
    frame.id === 'precision' ||
    frame.id === 'challenges'
  ) {
    return (
      <EarlyOrganizerStoryScene
        frame={frame}
        reduceMotion={reduceMotion}
        privacyToCompatProgress={privacyToCompatProgress}
        compatToPrecisionProgress={compatToPrecisionProgress}
        precisionToChallengesProgress={precisionToChallengesProgress}
      />
    );
  }

  if (!state.isSystem) {
    return (
      <div className="relative min-h-[45rem]">
        <div className="grid min-h-[45rem] grid-cols-[minmax(0,1fr)_31rem] items-center gap-0 overflow-visible">
          {frame.id === 'hero' ? (
            <HeroDesktopCopy
              frame={frame}
              onIndividualSignup={onIndividualSignup}
              onOrganizationSignup={onOrganizationSignup}
              reduceMotion={reduceMotion}
            />
          ) : (
            <StandardDesktopCopy frame={frame} reduceMotion={reduceMotion} />
          )}

          <motion.div
            className="relative z-20 flex justify-end will-change-transform"
            initial={false}
            animate={
              frame.id === 'hero' ? { x: -216, y: 138, scale: 1.1 } : { x: -18, y: 0, scale: 1 }
            }
            layout
            transition={
              reduceMotion
                ? { duration: 0 }
                : {
                    duration: 0.95,
                    ease: [0.22, 1, 0.36, 1],
                  }
            }
          >
            {frame.id === 'hero' ? <HeroResumeStack /> : <ProofPackCard state={state} />}
          </motion.div>
        </div>
      </div>
    );
  }

  if (state.isChallenges) {
    return (
      <div className="relative mx-auto flex min-h-[45rem] w-full items-center justify-center overflow-visible">
        <ModernChallengesSidePanels reduceMotion={reduceMotion} animateIn />

        <div className="relative z-10">
          <SystemCenterCopy frame={frame} state={state} reduceMotion={reduceMotion} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex min-h-[45rem] w-full items-center justify-center">
      <div className="grid w-full grid-cols-[31rem_minmax(16rem,20rem)_31rem] items-center justify-between gap-8 overflow-visible">
        <motion.div
          initial={false}
          animate={{ opacity: state.isPrecision ? 0 : 1, x: 0 }}
          transition={
            reduceMotion ? { duration: 0 } : { ...STORY_TRANSITION, duration: 1.12, delay: 0.04 }
          }
          className="relative isolate overflow-visible"
        >
          <StackSheets side="left" visible collapsed={state.isPrecision || state.isChallenges} />
          <AssignmentCard state={state} />
        </motion.div>

        <SystemCenterCopy frame={frame} state={state} reduceMotion={reduceMotion} />

        <motion.div
          initial={false}
          animate={{ opacity: state.isPrecision ? 0 : 1, x: -18 }}
          transition={
            reduceMotion ? { duration: 0 } : { ...STORY_TRANSITION, duration: 1.0, delay: 0.08 }
          }
          className="relative isolate overflow-visible"
        >
          <StackSheets side="right" visible collapsed={state.isPrecision || state.isChallenges} />
          <ProofPackCard state={state} stabilizeIdentity />
        </motion.div>
      </div>
    </div>
  );
}

function MobileSystemVisual({ frame }: { frame: HomepageStoryFrame }) {
  const isChallenges = frame.id === 'challenges';

  if (isChallenges) {
    return (
      <div className="mx-auto w-full max-w-[17.5rem] overflow-hidden rounded-[1.45rem] border border-white/62 bg-white/46 p-3 shadow-[0_18px_50px_-38px_rgba(45,51,48,0.35)]">
        <div className="grid grid-cols-[minmax(0,1fr)_5.8rem_minmax(0,1fr)] items-stretch gap-2">
          <div className="rounded-[1.1rem] border border-white/62 bg-white/58 p-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-proofound-terracotta/12 text-proofound-terracotta">
              <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <p className="mt-2 text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-foreground/52">
              Teams
            </p>
            <p className="mt-1 text-[0.68rem] leading-4 text-foreground/76">
              Too many weak applications.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center rounded-[1.2rem] border border-proofound-forest/12 bg-proofound-sage/14 px-2 py-3 text-center">
            <SquareStack className="h-5 w-5 text-proofound-forest/78" aria-hidden="true" />
            <p className="mt-2 font-display text-[1.12rem] leading-[0.95] text-foreground">
              Better starting point
            </p>
            <p className="mt-2 text-[0.54rem] leading-3 text-muted-foreground">
              Less noise before review.
            </p>
          </div>

          <div className="rounded-[1.1rem] border border-white/62 bg-white/58 p-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-proofound-sage/20 text-proofound-forest">
              <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <p className="mt-2 text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-foreground/52">
              People
            </p>
            <p className="mt-1 text-[0.68rem] leading-4 text-foreground/76">
              Real ability flattened.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[17.5rem] overflow-hidden rounded-[1.45rem] border border-white/62 bg-white/46 p-3 shadow-[0_18px_50px_-38px_rgba(45,51,48,0.35)]">
      <div className="grid grid-cols-[minmax(0,1fr)_5.8rem_minmax(0,1fr)] items-stretch gap-2">
        <div className="rounded-[1.1rem] border border-white/62 bg-white/58 p-2">
          <Briefcase className="h-4 w-4 text-proofound-forest/76" aria-hidden="true" />
          <p className="mt-2 text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-foreground/52">
            Assignment
          </p>
          <p className="mt-1 text-[0.68rem] leading-4 text-foreground/76">
            Scope, context, outcomes.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-[1.2rem] border border-proofound-forest/12 bg-proofound-sage/14 px-2 py-3 text-center">
          <Blend className="h-5 w-5 text-proofound-forest/78" aria-hidden="true" />
          <p className="mt-2 font-display text-[1.12rem] leading-[0.95] text-foreground">
            Shared language
          </p>
          <p className="mt-2 text-[0.54rem] leading-3 text-muted-foreground">
            Compare work to proof.
          </p>
        </div>

        <div className="rounded-[1.1rem] border border-white/62 bg-white/58 p-2">
          <ShieldCheck className="h-4 w-4 text-proofound-forest/76" aria-hidden="true" />
          <p className="mt-2 text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-foreground/52">
            Proof pack
          </p>
          <p className="mt-1 text-[0.68rem] leading-4 text-foreground/76">Artifacts and trust.</p>
        </div>
      </div>
    </div>
  );
}

function MobileProofSignalVisual({ frame }: { frame: HomepageStoryFrame }) {
  const state = deriveStoryState(frame.id);
  const isVerified = state.hasVerification;

  return (
    <div className="mx-auto w-full max-w-[15.5rem] rounded-[1.45rem] border border-white/62 bg-white/54 p-4 shadow-[0_18px_50px_-38px_rgba(45,51,48,0.34)]">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border bg-white/70',
            isVerified
              ? 'border-emerald-200 text-emerald-700'
              : 'border-white/70 text-proofound-forest'
          )}
        >
          {isVerified ? (
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          ) : (
            <UserRound className="h-5 w-5" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-display text-[1rem] leading-tight text-foreground">
            Senior Operations Professional
          </p>
          <p className="mt-1 text-[0.6rem] uppercase tracking-[0.18em] text-foreground/45">
            {isVerified ? 'Verified signal' : 'Outcome signal'}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-[1.1rem] border border-border/45 bg-proofound-parchment/38 p-3">
        <p className="text-[0.56rem] font-semibold uppercase tracking-[0.24em] text-foreground/46">
          Proof snapshot
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[
            { label: 'Team', value: '12', icon: UsersRound },
            { label: 'Scale', value: '200+', icon: Building2 },
            { label: 'Outcome', value: '31%', icon: TrendingUp },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="rounded-[0.85rem] border border-white/58 bg-white/54 px-2 py-2"
            >
              <Icon className="mx-auto h-3.5 w-3.5 text-proofound-forest/72" aria-hidden="true" />
              <p className="mt-1 font-display text-sm leading-none text-foreground">{value}</p>
              <p className="mt-1 text-[0.5rem] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {(isVerified
          ? ['Reference checked', 'Artifacts attached', 'Trust active']
          : ['Work scope', 'Ownership', 'Context']
        ).map((chip) => (
          <span
            key={chip}
            className={cn(
              'rounded-full border px-2 py-1 text-[0.55rem]',
              isVerified
                ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900/72'
                : 'border-border/55 bg-white/48 text-foreground/66'
            )}
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}

function MobileStoryVisual({
  frame,
  reduceMotion,
}: {
  frame: HomepageStoryFrame;
  reduceMotion: boolean;
}) {
  const state = deriveStoryState(frame.id);

  if (frame.id === 'hero') {
    return <HeroResumeStack compact />;
  }

  if (state.isSystem) {
    return <MobileSystemVisual frame={frame} />;
  }

  return <MobileProofSignalVisual frame={frame} />;
}

function MobileStoryCard({
  frame,
  onIndividualSignup,
  onOrganizationSignup,
  reduceMotion,
}: {
  frame: HomepageStoryFrame;
  onIndividualSignup?: () => void;
  onOrganizationSignup?: () => void;
  reduceMotion: boolean;
}) {
  const isHero = frame.id === 'hero';

  return (
    <article
      className={cn(
        'space-y-4 rounded-[1.55rem] border border-border/70 bg-white/70 shadow-[0_18px_60px_-40px_rgba(45,51,48,0.35)] backdrop-blur-md sm:space-y-5 sm:rounded-[2rem]',
        isHero ? 'p-4 sm:p-5' : 'p-4 sm:p-5'
      )}
    >
      <div className="space-y-3">
        {isHero ? (
          <h1 className="font-display text-[2rem] leading-[0.94] text-foreground sm:text-4xl">
            Proof behind the claim
          </h1>
        ) : (
          <h2 className="font-display text-[1.8rem] leading-tight text-foreground sm:text-3xl">
            {frame.title}
          </h2>
        )}
        <p className="text-[0.96rem] leading-7 text-muted-foreground sm:text-base">{frame.body}</p>
      </div>

      <div
        className={cn(
          'rounded-[1.35rem] border border-white/60 bg-proofound-parchment/55 px-3 sm:rounded-[1.7rem]',
          isHero ? 'py-3' : 'py-5'
        )}
      >
        <MobileStoryVisual frame={frame} reduceMotion={reduceMotion} />
      </div>

      {isHero ? (
        <div className="grid gap-3">
          <button
            type="button"
            onClick={onOrganizationSignup}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-proofound-forest px-5 py-3.5 text-sm font-medium text-white shadow-[0_14px_30px_-22px_rgba(28,77,58,0.56)] transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:bg-proofound-forest/92 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest/35 focus-visible:ring-offset-4 focus-visible:ring-offset-white active:translate-y-0"
          >
            Request a pilot
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onIndividualSignup}
            className="inline-flex items-center justify-center rounded-full border border-border/80 bg-white/75 px-5 py-3.5 text-sm font-medium text-foreground shadow-[0_12px_26px_-24px_rgba(45,51,48,0.34)] transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest/35 focus-visible:ring-offset-4 focus-visible:ring-offset-white active:translate-y-0"
          >
            Create your proof portfolio
          </button>
        </div>
      ) : null}
    </article>
  );
}

function PrivacyToCompatBackground({
  progress,
  target,
  motionKey,
  reduceMotion,
}: {
  progress: number;
  target: number;
  motionKey: number;
  reduceMotion: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playbackFrameRef = useRef<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [loadedVideoKey, setLoadedVideoKey] = useState(0);
  const [videoActive, setVideoActive] = useState(false);
  const clampedProgress = clamp01(progress);
  const clampedTarget = clamp01(target);
  const shouldMountVideo =
    !reduceMotion && (motionKey > 0 || clampedTarget === 1 || clampedProgress > 0.001);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || duration == null || loadedVideoKey !== motionKey) {
      return;
    }

    const safeDuration = Math.max(0.001, duration - 0.04);

    if (playbackFrameRef.current != null) {
      window.cancelAnimationFrame(playbackFrameRef.current);
      playbackFrameRef.current = null;
    }

    if (motionKey === 0) {
      video.currentTime = 0.001;
      void video.pause();
      setVideoActive(false);
      return;
    }

    if (reduceMotion) {
      video.currentTime = safeDuration * clampedTarget;
      void video.pause();
      setVideoActive(false);
      return;
    }

    setVideoActive(true);

    const startTime = clamp01(video.currentTime / safeDuration) * safeDuration || 0.001;
    const targetTime = clampedTarget === 1 ? safeDuration : 0.001;
    const startedAt = performance.now();
    const durationMs = 3 * 1000;

    if (clampedTarget === 1) {
      const rate = (safeDuration - startTime) / (durationMs / 1000);
      video.playbackRate = rate > 0.1 ? rate : 1;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }

      const stepPlaybackForward = () => {
        if (video.currentTime >= targetTime - 0.05) {
          video.pause();
          video.currentTime = targetTime;
          setVideoActive(false);
          playbackFrameRef.current = null;
        } else {
          playbackFrameRef.current = window.requestAnimationFrame(stepPlaybackForward);
        }
      };
      playbackFrameRef.current = window.requestAnimationFrame(stepPlaybackForward);
    } else {
      let lastSeekTime = video.currentTime;
      const stepPlaybackBackward = (timestamp: number) => {
        const elapsed = clamp01((timestamp - startedAt) / durationMs);
        const eased = easeInOut(elapsed);
        const nextTime = mix(startTime, targetTime, eased);

        if (Math.abs(nextTime - lastSeekTime) > 0.04 || elapsed === 1) {
          video.currentTime = nextTime;
          lastSeekTime = nextTime;
        }

        if (elapsed < 1) {
          playbackFrameRef.current = window.requestAnimationFrame(stepPlaybackBackward);
          return;
        }

        video.currentTime = targetTime;
        setVideoActive(false);
        playbackFrameRef.current = null;
      };
      playbackFrameRef.current = window.requestAnimationFrame(stepPlaybackBackward);
    }
  }, [clampedTarget, duration, loadedVideoKey, motionKey, reduceMotion]);

  useEffect(() => {
    return () => {
      if (playbackFrameRef.current != null) {
        window.cancelAnimationFrame(playbackFrameRef.current);
      }
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {shouldMountVideo ? (
        <video
          key={motionKey}
          ref={videoRef}
          muted
          playsInline
          preload="auto"
          onLoadedMetadata={(event) => {
            const nextDuration = event.currentTarget.duration;
            setDuration(Number.isFinite(nextDuration) ? nextDuration : null);
            setLoadedVideoKey(motionKey);
            const metadataDuration = Number.isFinite(nextDuration) ? nextDuration : 0;
            event.currentTarget.currentTime =
              clampedTarget === 1 ? 0.001 : Math.max(0, metadataDuration - 0.04);
            void event.currentTarget.pause();
          }}
          className={cn(
            'absolute inset-0 h-full w-full scale-[1.02] object-cover object-center transition-opacity duration-150',
            videoActive || clampedTarget === 1 ? 'opacity-100 z-10' : 'opacity-0 z-0'
          )}
        >
          <source src="/hero-transition-video/privacy-to-compatibility.m4v" type="video/mp4" />
          <source src="/hero-transition-video/privacy-to-compatibility.mp4" type="video/mp4" />
        </video>
      ) : null}
    </div>
  );
}

function StoryProgressIndicator({ activeIndex }: { activeIndex: number }) {
  const totalFrames = HOMEPAGE_STORY_FRAMES.length;
  const clampedIndex = Math.min(totalFrames - 1, Math.max(0, activeIndex));
  const nextFrame = HOMEPAGE_STORY_FRAMES[Math.min(totalFrames - 1, clampedIndex + 1)];
  const currentLabel = String(clampedIndex + 1).padStart(2, '0');
  const totalLabel = String(totalFrames).padStart(2, '0');

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute bottom-8 left-1/2 z-30 hidden -translate-x-1/2 items-center gap-4 rounded-full border border-white/80 bg-[#f6f2ea]/94 px-4 py-2.5 text-foreground/80 shadow-[0_22px_54px_-30px_rgba(45,51,48,0.56)] backdrop-blur-[18px] lg:flex"
    >
      <span className="tabular-nums text-[0.68rem] font-medium uppercase tracking-[0.24em] text-foreground/70">
        {currentLabel} / {totalLabel}
      </span>

      <div className="flex items-center gap-1.5">
        {HOMEPAGE_STORY_FRAMES.map((frame, index) => (
          <span
            key={frame.id}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              index === clampedIndex
                ? 'w-8 bg-proofound-forest/90'
                : index < clampedIndex
                  ? 'w-3 bg-proofound-forest/45'
                  : 'w-3 bg-foreground/24'
            )}
          />
        ))}
      </div>

      <span className="max-w-[13rem] truncate text-[0.72rem] font-medium text-foreground/80">
        {clampedIndex < totalFrames - 1 ? nextFrame.title : 'Build hiring on stronger proof'}
      </span>
    </div>
  );
}

function StoryBackdrop({
  heroToBlindProgress,
  heroToBlindTarget,
  heroToBlindMotionKey,
  privacyToCompatProgress,
  privacyToCompatTarget,
  privacyToCompatMotionKey,
  reduceMotion,
}: {
  heroToBlindProgress: number;
  heroToBlindTarget: number;
  heroToBlindMotionKey: number;
  privacyToCompatProgress: number;
  privacyToCompatTarget: number;
  privacyToCompatMotionKey: number;
  reduceMotion: boolean;
}) {
  return (
    <>
      <HeroToBlindBackground
        progress={heroToBlindProgress}
        target={heroToBlindTarget}
        motionKey={heroToBlindMotionKey}
        reduceMotion={reduceMotion}
      />
      <PrivacyToCompatBackground
        progress={privacyToCompatProgress}
        target={privacyToCompatTarget}
        motionKey={privacyToCompatMotionKey}
        reduceMotion={reduceMotion}
      />
    </>
  );
}

export function ScrollytellingSection({
  onIndividualSignup,
  onOrganizationSignup,
  shouldReduceMotion,
}: ScrollytellingSectionProps) {
  const systemReduceMotion = useReducedMotion() ?? false;
  const reduceMotion = Boolean(shouldReduceMotion || systemReduceMotion);
  const storyRef = useRef<HTMLElement>(null);
  const desktopRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [heroToBlindProgress, setHeroToBlindProgress] = useState(0);
  const [heroToBlindTarget, setHeroToBlindTarget] = useState(0);
  const [heroToBlindMotionKey, setHeroToBlindMotionKey] = useState(0);
  const heroToBlindTargetRef = useRef(0);
  const heroToBlindAnimationRef = useRef<number | null>(null);
  const heroToBlindProgressRef = useRef(0);
  const heroToBlindScrollPositionRef = useRef(0);

  const [privacyToCompatProgress, setPrivacyToCompatProgress] = useState(0);
  const [privacyToCompatTarget, setPrivacyToCompatTarget] = useState(0);
  const [privacyToCompatMotionKey, setPrivacyToCompatMotionKey] = useState(0);
  const privacyToCompatTargetRef = useRef(0);
  const privacyToCompatAnimationRef = useRef<number | null>(null);
  const privacyToCompatProgressRef = useRef(0);

  const [compatToPrecisionProgress, setCompatToPrecisionProgress] = useState(0);
  const [compatToPrecisionTarget, setCompatToPrecisionTarget] = useState(0);
  const [compatToPrecisionMotionKey, setCompatToPrecisionMotionKey] = useState(0);
  const compatToPrecisionTargetRef = useRef(0);
  const compatToPrecisionAnimationRef = useRef<number | null>(null);
  const compatToPrecisionProgressRef = useRef(0);

  const [precisionToChallengesProgress, setPrecisionToChallengesProgress] = useState(0);
  const precisionToChallengesTargetRef = useRef(0);
  const precisionToChallengesAnimationRef = useRef<number | null>(null);
  const precisionToChallengesProgressRef = useRef(0);

  const activeIndexRef = useRef(0);
  const gestureAnimationRef = useRef<number | null>(null);
  const gestureLockedRef = useRef(false);
  const touchStartYRef = useRef<number | null>(null);
  const touchGestureConsumedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (heroToBlindAnimationRef.current != null) {
        window.cancelAnimationFrame(heroToBlindAnimationRef.current);
      }
      if (privacyToCompatAnimationRef.current != null) {
        window.cancelAnimationFrame(privacyToCompatAnimationRef.current);
      }
      if (compatToPrecisionAnimationRef.current != null) {
        window.cancelAnimationFrame(compatToPrecisionAnimationRef.current);
      }
      if (precisionToChallengesAnimationRef.current != null) {
        window.cancelAnimationFrame(precisionToChallengesAnimationRef.current);
      }
      if (gestureAnimationRef.current != null) {
        window.cancelAnimationFrame(gestureAnimationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let scheduledFrame: number | null = null;

    const updateStoryProgress = () => {
      scheduledFrame = null;
      const section = storyRef.current;
      if (!section) {
        return;
      }

      const scrollTop = window.scrollY || window.pageYOffset;
      const sectionTop = section.getBoundingClientRect().top + scrollTop;
      const scrollRange = Math.max(1, section.offsetHeight - window.innerHeight);
      const latest = clamp01((scrollTop - sectionTop) / scrollRange);

      if (scrollTop <= 2) {
        heroToBlindTargetRef.current = 0;
        privacyToCompatTargetRef.current = 0;
        compatToPrecisionTargetRef.current = 0;
        precisionToChallengesTargetRef.current = 0;
        heroToBlindProgressRef.current = 0;
        privacyToCompatProgressRef.current = 0;
        compatToPrecisionProgressRef.current = 0;
        precisionToChallengesProgressRef.current = 0;
        heroToBlindScrollPositionRef.current = 0;
        activeIndexRef.current = 0;
        setActiveIndex(0);
        setHeroToBlindTarget(0);
        setPrivacyToCompatTarget(0);
        setCompatToPrecisionTarget(0);
        setHeroToBlindProgress(0);
        setPrivacyToCompatProgress(0);
        setCompatToPrecisionProgress(0);
        setPrecisionToChallengesProgress(0);
        return;
      }

      const frameCount = HOMEPAGE_STORY_FRAMES.length;
      const nextPosition = latest * frameCount;
      const nextIndex = Math.min(frameCount - 1, Math.max(0, Math.floor(nextPosition)));
      activeIndexRef.current = nextIndex;
      setActiveIndex((current) => (current === nextIndex ? current : nextIndex));

      const previousPosition = heroToBlindScrollPositionRef.current;
      heroToBlindScrollPositionRef.current = nextPosition;
      const jumpedAcrossFrames = Math.abs(nextPosition - previousPosition) > 0.72;

      const isScrollingDown = nextPosition > previousPosition + 0.003;
      const isScrollingUp = nextPosition < previousPosition - 0.003;
      const nextTarget =
        isScrollingDown && nextPosition >= 0.08
          ? 1
          : isScrollingUp && nextPosition <= 0.98
            ? 0
            : heroToBlindTargetRef.current;

      if (nextTarget !== heroToBlindTargetRef.current) {
        heroToBlindTargetRef.current = nextTarget;
        setHeroToBlindTarget(nextTarget);
        setHeroToBlindMotionKey((current) => current + 1);
        if (heroToBlindAnimationRef.current != null) {
          window.cancelAnimationFrame(heroToBlindAnimationRef.current);
        }

        if (reduceMotion || jumpedAcrossFrames) {
          heroToBlindProgressRef.current = nextTarget;
          setHeroToBlindProgress(nextTarget);
        } else {
          const startProgress = heroToBlindProgressRef.current;
          const startedAt = performance.now();
          const durationMs = HERO_TO_BLIND_TRANSITION_SECONDS * 1000;

          const stepHeroToBlind = (timestamp: number) => {
            const elapsed = clamp01((timestamp - startedAt) / durationMs);
            const eased = easeInOut(elapsed);
            const nextProgress = startProgress + (nextTarget - startProgress) * eased;

            heroToBlindProgressRef.current = nextProgress;
            setHeroToBlindProgress(nextProgress);

            if (elapsed < 1) {
              heroToBlindAnimationRef.current = window.requestAnimationFrame(stepHeroToBlind);
              return;
            }

            heroToBlindProgressRef.current = nextTarget;
            setHeroToBlindProgress(nextTarget);
            heroToBlindAnimationRef.current = null;
          };

          heroToBlindAnimationRef.current = window.requestAnimationFrame(stepHeroToBlind);
        }
      }

      const nextPrivacyTarget =
        isScrollingDown && nextPosition >= 6.02
          ? 1
          : isScrollingUp && nextPosition <= 5.98
            ? 0
            : privacyToCompatTargetRef.current;

      if (nextPrivacyTarget !== privacyToCompatTargetRef.current) {
        privacyToCompatTargetRef.current = nextPrivacyTarget;
        setPrivacyToCompatTarget(nextPrivacyTarget);
        setPrivacyToCompatMotionKey((current) => current + 1);
        if (privacyToCompatAnimationRef.current != null) {
          window.cancelAnimationFrame(privacyToCompatAnimationRef.current);
        }

        if (reduceMotion || jumpedAcrossFrames) {
          privacyToCompatProgressRef.current = nextPrivacyTarget;
          setPrivacyToCompatProgress(nextPrivacyTarget);
        } else {
          const startPrivacyProgress = privacyToCompatProgressRef.current;
          const privacyStartedAt = performance.now();
          const privacyDurationMs = 2 * 1000;

          const stepPrivacyToCompat = (timestamp: number) => {
            const elapsed = clamp01((timestamp - privacyStartedAt) / privacyDurationMs);
            const eased = easeInOut(elapsed);
            const nextProgress =
              startPrivacyProgress + (nextPrivacyTarget - startPrivacyProgress) * eased;

            privacyToCompatProgressRef.current = nextProgress;
            setPrivacyToCompatProgress(nextProgress);

            if (elapsed < 1) {
              privacyToCompatAnimationRef.current =
                window.requestAnimationFrame(stepPrivacyToCompat);
              return;
            }

            privacyToCompatProgressRef.current = nextPrivacyTarget;
            setPrivacyToCompatProgress(nextPrivacyTarget);
            privacyToCompatAnimationRef.current = null;
          };

          privacyToCompatAnimationRef.current = window.requestAnimationFrame(stepPrivacyToCompat);
        }
      }

      const nextCompatToPrecisionTarget =
        isScrollingDown && nextPosition >= 7.02
          ? 1
          : isScrollingUp && nextPosition <= 6.98
            ? 0
            : compatToPrecisionTargetRef.current;

      if (nextCompatToPrecisionTarget !== compatToPrecisionTargetRef.current) {
        compatToPrecisionTargetRef.current = nextCompatToPrecisionTarget;
        setCompatToPrecisionTarget(nextCompatToPrecisionTarget);
        setCompatToPrecisionMotionKey((current) => current + 1);
        if (compatToPrecisionAnimationRef.current != null) {
          window.cancelAnimationFrame(compatToPrecisionAnimationRef.current);
        }

        if (reduceMotion || jumpedAcrossFrames) {
          compatToPrecisionProgressRef.current = nextCompatToPrecisionTarget;
          setCompatToPrecisionProgress(nextCompatToPrecisionTarget);
        } else {
          const startProgress = compatToPrecisionProgressRef.current;
          const startedAt = performance.now();
          const durationMs = 1.8 * 1000;

          const stepCompatToPrecision = (timestamp: number) => {
            const elapsed = clamp01((timestamp - startedAt) / durationMs);
            const eased = easeInOut(elapsed);
            const nextProgress =
              startProgress + (nextCompatToPrecisionTarget - startProgress) * eased;

            compatToPrecisionProgressRef.current = nextProgress;
            setCompatToPrecisionProgress(nextProgress);

            if (elapsed < 1) {
              compatToPrecisionAnimationRef.current =
                window.requestAnimationFrame(stepCompatToPrecision);
              return;
            }

            compatToPrecisionProgressRef.current = nextCompatToPrecisionTarget;
            setCompatToPrecisionProgress(nextCompatToPrecisionTarget);
            compatToPrecisionAnimationRef.current = null;
          };

          compatToPrecisionAnimationRef.current =
            window.requestAnimationFrame(stepCompatToPrecision);
        }
      }

      const nextPrecisionToChallengesTarget =
        isScrollingDown && nextPosition >= 8.02
          ? 1
          : isScrollingUp && nextPosition <= 7.98
            ? 0
            : precisionToChallengesTargetRef.current;

      if (nextPrecisionToChallengesTarget !== precisionToChallengesTargetRef.current) {
        precisionToChallengesTargetRef.current = nextPrecisionToChallengesTarget;
        if (precisionToChallengesAnimationRef.current != null) {
          window.cancelAnimationFrame(precisionToChallengesAnimationRef.current);
        }

        if (reduceMotion || jumpedAcrossFrames) {
          precisionToChallengesProgressRef.current = nextPrecisionToChallengesTarget;
          setPrecisionToChallengesProgress(nextPrecisionToChallengesTarget);
        } else {
          const startProgress = precisionToChallengesProgressRef.current;
          const startedAt = performance.now();
          const durationMs = 1.72 * 1000;

          const stepPrecisionToChallenges = (timestamp: number) => {
            const elapsed = clamp01((timestamp - startedAt) / durationMs);
            const eased = easeInOut(elapsed);
            const nextProgress =
              startProgress + (nextPrecisionToChallengesTarget - startProgress) * eased;

            precisionToChallengesProgressRef.current = nextProgress;
            setPrecisionToChallengesProgress(nextProgress);

            if (elapsed < 1) {
              precisionToChallengesAnimationRef.current =
                window.requestAnimationFrame(stepPrecisionToChallenges);
              return;
            }

            precisionToChallengesProgressRef.current = nextPrecisionToChallengesTarget;
            setPrecisionToChallengesProgress(nextPrecisionToChallengesTarget);
            precisionToChallengesAnimationRef.current = null;
          };

          precisionToChallengesAnimationRef.current =
            window.requestAnimationFrame(stepPrecisionToChallenges);
        }
      }
    };

    const scheduleUpdate = () => {
      if (scheduledFrame != null) {
        return;
      }
      scheduledFrame = window.requestAnimationFrame(updateStoryProgress);
    };

    updateStoryProgress();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);

    return () => {
      if (scheduledFrame != null) {
        window.cancelAnimationFrame(scheduledFrame);
      }
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }

    const getDesktopStoryRange = () => {
      const section = storyRef.current;
      const desktopTrack = desktopRef.current;
      if (!section || !desktopTrack || window.innerWidth < 1024) {
        return null;
      }

      const scrollTop = window.scrollY || window.pageYOffset;
      const sectionTop = section.getBoundingClientRect().top + scrollTop;
      const sectionBottom = sectionTop + desktopTrack.offsetHeight;
      const maxScrollTop = sectionBottom - window.innerHeight;

      return {
        sectionTop,
        maxScrollTop,
        range: Math.max(1, maxScrollTop - sectionTop),
        scrollTop,
      };
    };

    const isInsideDesktopStory = () => {
      const range = getDesktopStoryRange();
      if (!range) {
        return null;
      }

      if (range.scrollTop < range.sectionTop - 2 || range.scrollTop > range.maxScrollTop + 2) {
        return null;
      }

      return range;
    };

    const animateToFrame = (targetIndex: number) => {
      const range = getDesktopStoryRange();
      if (!range) {
        return;
      }

      const targetProgress = getFrameScrollProgress(targetIndex);
      const targetTop = range.sectionTop + range.range * targetProgress;
      const startTop = range.scrollTop;
      const distance = targetTop - startTop;

      if (Math.abs(distance) < 2) {
        activeIndexRef.current = targetIndex;
        setActiveIndex(targetIndex);
        return;
      }

      gestureLockedRef.current = true;
      if (gestureAnimationRef.current != null) {
        window.cancelAnimationFrame(gestureAnimationRef.current);
      }

      const startedAt = performance.now();

      const stepGesture = (timestamp: number) => {
        const elapsed = clamp01((timestamp - startedAt) / DESKTOP_GESTURE_TRANSITION_MS);
        const eased = easeInOut(elapsed);
        window.scrollTo(0, startTop + distance * eased);

        if (elapsed < 1) {
          gestureAnimationRef.current = window.requestAnimationFrame(stepGesture);
          return;
        }

        window.scrollTo(0, targetTop);
        activeIndexRef.current = targetIndex;
        setActiveIndex(targetIndex);
        gestureLockedRef.current = false;
        gestureAnimationRef.current = null;
      };

      gestureAnimationRef.current = window.requestAnimationFrame(stepGesture);
    };

    const requestStep = (direction: 1 | -1) => {
      const range = isInsideDesktopStory();
      if (!range) {
        return false;
      }

      if (gestureLockedRef.current) {
        return true;
      }

      const currentIndex = activeIndexRef.current;
      const targetIndex = Math.min(
        HOMEPAGE_STORY_FRAMES.length - 1,
        Math.max(0, currentIndex + direction)
      );

      if (targetIndex === currentIndex) {
        return false;
      }

      animateToFrame(targetIndex);
      return true;
    };

    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < DESKTOP_GESTURE_MIN_DELTA) {
        return;
      }

      const consumed = requestStep(event.deltaY > 0 ? 1 : -1);
      if (consumed) {
        event.preventDefault();
      }
    };

    const handleTouchStart = (event: TouchEvent) => {
      touchStartYRef.current = event.touches[0]?.clientY ?? null;
      touchGestureConsumedRef.current = false;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const startY = touchStartYRef.current;
      const currentY = event.touches[0]?.clientY;
      if (startY == null || currentY == null) {
        return;
      }

      const deltaY = startY - currentY;
      if (Math.abs(deltaY) < DESKTOP_TOUCH_GESTURE_MIN_DELTA) {
        return;
      }

      const consumed = touchGestureConsumedRef.current || requestStep(deltaY > 0 ? 1 : -1);
      if (consumed) {
        touchGestureConsumedRef.current = true;
        event.preventDefault();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [reduceMotion]);

  const activeFrame = HOMEPAGE_STORY_FRAMES[activeIndex];
  const mobileFrames = useMemo(
    () =>
      MOBILE_STORY_FRAME_IDS.map((frameId) =>
        HOMEPAGE_STORY_FRAMES.find((frame) => frame.id === frameId)
      ).filter((frame): frame is HomepageStoryFrame => Boolean(frame)),
    []
  );

  return (
    <section
      id="story"
      ref={storyRef}
      className="relative scroll-mt-24"
      data-testid="landing-story-section"
    >
      <div className="px-4 pb-10 pt-24 md:px-8 lg:hidden">
        <div className="mx-auto max-w-2xl space-y-6" data-testid="landing-mobile-story">
          {mobileFrames.map((frame) => {
            return (
              <MobileStoryCard
                key={frame.id}
                frame={frame}
                onIndividualSignup={onIndividualSignup}
                onOrganizationSignup={onOrganizationSignup}
                reduceMotion={reduceMotion}
              />
            );
          })}
        </div>
      </div>

      <div
        ref={desktopRef}
        className="relative hidden lg:block"
        style={{ height: `${HOMEPAGE_STORY_FRAMES.length * DESKTOP_FRAME_HEIGHT_VH}vh` }}
        data-testid="landing-story-desktop-track"
      >
        <div className="sticky top-0 flex h-screen items-center overflow-hidden px-8 py-20 xl:px-14">
          <StoryBackdrop
            heroToBlindProgress={heroToBlindProgress}
            heroToBlindTarget={heroToBlindTarget}
            heroToBlindMotionKey={heroToBlindMotionKey}
            privacyToCompatProgress={privacyToCompatProgress}
            privacyToCompatTarget={privacyToCompatTarget}
            privacyToCompatMotionKey={privacyToCompatMotionKey}
            reduceMotion={reduceMotion}
          />

          <div className="relative z-10 mx-auto w-full max-w-[96rem]">
            <DesktopScene
              frame={activeFrame}
              heroToBlindProgress={heroToBlindProgress}
              privacyToCompatProgress={privacyToCompatProgress}
              compatToPrecisionProgress={compatToPrecisionProgress}
              precisionToChallengesProgress={precisionToChallengesProgress}
              onIndividualSignup={onIndividualSignup}
              onOrganizationSignup={onOrganizationSignup}
              reduceMotion={reduceMotion}
            />
          </div>

          <StoryProgressIndicator activeIndex={activeIndex} />
        </div>
      </div>
    </section>
  );
}
