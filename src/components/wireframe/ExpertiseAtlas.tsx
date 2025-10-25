'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { ModeSwitcher } from '@/components/wireframe/expertise/ModeSwitcher';
import { IndividualAtlasView } from '@/components/wireframe/expertise/IndividualAtlasView';
import { OrganizationAtlasView } from '@/components/wireframe/expertise/OrganizationAtlasView';
import { EvidenceChip } from '@/components/wireframe/expertise/EvidenceChip';
import { EvidenceType } from '@/components/wireframe/expertise/types';

const EVIDENCE_TYPES: EvidenceType[] = [
  'self-claim',
  'peer',
  'artifact',
  'assessment',
  'certification',
  'impact',
  'external',
];

type Mode = 'individual' | 'organization';

export function ExpertiseAtlasWireframe() {
  const [mode, setMode] = useState<Mode>('individual');

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F7F6F1] text-[#2D3330] dark:bg-[#2A2520] dark:text-[#E8E6DD]">
      <BackgroundAnimation />
      <div className="relative z-10 mx-auto max-w-[1440px] px-6 py-12 lg:px-10">
        <header className="space-y-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <h1 className="text-4xl font-medium tracking-tight md:text-5xl">Expertise Atlas</h1>
              <p className="text-sm leading-relaxed text-[#2D3330]/70 dark:text-[#E8E6DD]/70">
                Map capabilities with proof. Switch between individual narratives and organizational
                atlases to see how evidence-backed skills, maturity levels, and branches connect.
              </p>
            </div>
            <ModeSwitcher mode={mode} onChange={setMode} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <ExplainerCard
              accent="from-[#1C4D3A]/10"
              title="Six branches"
              description="Universal, functional, tools, languages, methods, and domain branches reduce bias by separating capability types."
            />
            <ExplainerCard
              accent="from-[#C76B4A]/10"
              title="Evidence-first"
              description="Every capability traces evidence issuance, weight, and recency across peer, artifact, certification, and impact signals."
            />
            <ExplainerCard
              accent="from-[#5F8C6F]/10"
              title="Explainable levels"
              description="Levels built on the Dreyfus model with optional SFIA/ESCO/O*NET mapping keep human judgement transparent."
            />
          </div>

          <EvidenceLegend />
        </header>

        <motion.section
          key={mode}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
          className="mt-10 rounded-[2.5rem] border border-[#E8E6DD] bg-white/90 p-8 shadow-xl backdrop-blur dark:border-[#4A4540] dark:bg-[#322C27]/90"
        >
          {mode === 'individual' ? <IndividualAtlasView /> : <OrganizationAtlasView />}
        </motion.section>
      </div>
    </div>
  );
}

function ExplainerCard({
  accent,
  title,
  description,
}: {
  accent: string;
  title: string;
  description: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-[#E8E6DD] bg-gradient-to-br ${accent} to-white/70 p-6 backdrop-blur dark:border-[#4A4540] dark:bg-[#3A3530]/80`}
    >
      <h3 className="text-lg font-semibold text-[#2D3330] dark:text-[#E8E6DD]">{title}</h3>
      <p className="mt-2 text-sm text-[#2D3330]/70 dark:text-[#E8E6DD]/70">{description}</p>
    </div>
  );
}

function EvidenceLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#E8E6DD] bg-white/80 px-4 py-3 text-xs text-[#2D3330]/70 backdrop-blur dark:border-[#4A4540] dark:bg-[#342E29]/80 dark:text-[#E8E6DD]/70">
      <span className="font-medium uppercase tracking-[0.2em] text-[#4A5943] dark:text-[#D4C4A8]">
        Evidence types
      </span>
      {EVIDENCE_TYPES.map((type) => (
        <EvidenceChip key={type} type={type} compact />
      ))}
    </div>
  );
}

function BackgroundAnimation() {
  return (
    <div className="pointer-events-none absolute inset-0 opacity-30 dark:opacity-20">
      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="atlas-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1C4D3A" stopOpacity="0.12" />
            <stop offset="50%" stopColor="#C76B4A" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#5F8C6F" stopOpacity="0.12" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#atlas-bg)" />
      </svg>
      <motion.div
        className="absolute left-1/5 top-24 h-[340px] w-[340px] rounded-full bg-[#1C4D3A]"
        initial={{ opacity: 0.05, scale: 1 }}
        animate={{ opacity: [0.05, 0.12, 0.05], scale: [1, 1.1, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute right-32 top-1/3 h-[280px] w-[280px] rounded-full bg-[#C76B4A]"
        initial={{ opacity: 0.04, scale: 1 }}
        animate={{ opacity: [0.04, 0.1, 0.04], scale: [1, 1.08, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-24 left-1/3 h-[360px] w-[360px] rounded-full bg-[#5F8C6F]"
        initial={{ opacity: 0.04, scale: 1 }}
        animate={{ opacity: [0.04, 0.1, 0.04], scale: [1, 1.12, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
