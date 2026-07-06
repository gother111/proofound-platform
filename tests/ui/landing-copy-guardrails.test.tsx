import { readFileSync } from 'node:fs';
import path from 'node:path';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EarlyProofSection } from '@/components/landing/sections/EarlyProofSection';

const REPO_ROOT = process.cwd();

const ACTIVE_LANDING_COPY_FILES = [
  'src/app/page.tsx',
  'src/components/landing/sections/BuiltForSection.tsx',
  'src/components/landing/sections/ComparisonSection.tsx',
  'src/components/landing/sections/DayOneSurfacesSection.tsx',
  'src/components/landing/sections/EarlyProofSection.tsx',
  'src/components/landing/sections/FinalCTASection.tsx',
  'src/components/landing/sections/FooterSection.tsx',
  'src/components/landing/sections/HiringTeamsSection.tsx',
  'src/components/landing/sections/PracticalTrustSection.tsx',
  'src/components/landing/sections/PrivacySafeReviewSection.tsx',
  'src/components/landing/sections/ScrollytellingSection.tsx',
  'src/components/landing/sections/ThreeStepCorridorSection.tsx',
  'src/components/landing/sections/hero-variants/HeroManifesto.tsx',
  'src/components/landing/sections/homepage-story-frames.ts',
  'src/lib/seo/json-ld.ts',
];

describe('landing copy guardrails', () => {
  it('keeps the early-proof section inside the narrow MVP story', () => {
    render(<EarlyProofSection />);

    expect(screen.getAllByText(/stronger evidence than CVs/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/public page proof snapshot/i)).toBeInTheDocument();
    expect(screen.getByText(/org trust page/i)).toBeInTheDocument();
    expect(screen.getByText(/privacy-safe proof/i)).toBeInTheDocument();
    expect(screen.getByText(/assignment flow/i)).toBeInTheDocument();

    expect(screen.queryByText(/pricing/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/manifesto/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/protocol/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ecosystem/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/placeholder/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/future pilot/i)).not.toBeInTheDocument();
  });

  it('keeps active public landing copy on evidence rather than vague signal language', () => {
    const landingCopy = ACTIVE_LANDING_COPY_FILES.map((relativePath) =>
      readFileSync(path.join(REPO_ROOT, relativePath), 'utf8')
    ).join('\n');

    expect(landingCopy).toMatch(/stronger evidence than CVs/i);
    expect(landingCopy).toMatch(/privacy-safe proof/i);
    expect(landingCopy).toMatch(/Run assignment review from validated proof/i);
    expect(landingCopy).toMatch(/structured proof review/i);
    expect(landingCopy).toMatch(/Build proof-first review/i);
    expect(landingCopy).toMatch(/Evidence-based assignment review/i);
    expect(landingCopy).toMatch(/proof-backed\s+submissions/i);
    expect(landingCopy).toMatch(/clearer-evidence submissions/i);
    expect(landingCopy).toMatch(/before proof submissions start/i);
    expect(landingCopy).toMatch(/before submissions open/i);
    expect(landingCopy).toMatch(/Too many weak submissions/i);
    expect(landingCopy).toMatch(/organizations review assignment submissions/i);
    expect(landingCopy).toMatch(
      /Proof-review participants flatten real ability into bullets or overshare to compensate/i
    );
    expect(landingCopy).toMatch(/Proof-review participants flatten real ability/i);
    expect(landingCopy).toMatch(/proof-review participant side no longer leads with identity/i);
    expect(landingCopy).toMatch(/Participant-side challenge/i);
    expect(landingCopy).toMatch(/problems proof-review\s+participants face/i);
    expect(landingCopy).not.toMatch(/privacy-safe signal/i);
    expect(landingCopy).not.toMatch(/stronger signal than CVs/i);
    expect(landingCopy).not.toMatch(/weak CV signal/i);
    expect(landingCopy).not.toMatch(/structured hiring signal/i);
    expect(landingCopy).not.toMatch(/higher-signal candidates/i);
    expect(landingCopy).not.toMatch(/Weak signal/i);
    expect(landingCopy).not.toMatch(/Review-fit signal/i);
    expect(landingCopy).not.toMatch(/Verified signal|Outcome signal/i);
    expect(landingCopy).not.toMatch(/trust anchors?|trust signals?|compatibility signals?/i);
    expect(landingCopy).not.toMatch(/Hire and collaborate/i);
    expect(landingCopy).not.toMatch(/Streamline hiring without sifting through CV noise/i);
    expect(landingCopy).not.toMatch(/Explore evidence-based hiring/i);
    expect(landingCopy).not.toMatch(/Evidence-based hiring for a world/i);
    expect(landingCopy).not.toMatch(/Review proof-backed candidates/i);
    expect(landingCopy).not.toMatch(/clearer-evidence candidates/i);
    expect(landingCopy).not.toMatch(/candidate side no longer leads with identity/i);
    expect(landingCopy).not.toMatch(/Candidate-side challenge/i);
    expect(landingCopy).not.toMatch(/problems candidates face/i);
    expect(landingCopy).not.toMatch(/Candidates add context/i);
    expect(landingCopy).not.toMatch(/Candidates flatten real ability/i);
    expect(landingCopy).not.toMatch(/organizations find talent/i);
    expect(landingCopy).not.toMatch(/talent feed/i);
    expect(landingCopy).not.toMatch(/before applications start/i);
    expect(landingCopy).not.toMatch(/before applications open/i);
    expect(landingCopy).not.toMatch(/weak applications/i);
  });
});
