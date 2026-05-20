import { readFileSync } from 'node:fs';
import path from 'node:path';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EarlyProofSection } from '@/components/landing/sections/EarlyProofSection';

const REPO_ROOT = process.cwd();

const ACTIVE_LANDING_COPY_FILES = [
  'src/components/landing/sections/BuiltForSection.tsx',
  'src/components/landing/sections/ComparisonSection.tsx',
  'src/components/landing/sections/DayOneSurfacesSection.tsx',
  'src/components/landing/sections/EarlyProofSection.tsx',
  'src/components/landing/sections/FinalCTASection.tsx',
  'src/components/landing/sections/FooterSection.tsx',
  'src/components/landing/sections/PracticalTrustSection.tsx',
  'src/components/landing/sections/PrivacySafeReviewSection.tsx',
  'src/components/landing/sections/ScrollytellingSection.tsx',
  'src/components/landing/sections/ThreeStepCorridorSection.tsx',
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
    expect(screen.getByText(/assignment corridor/i)).toBeInTheDocument();

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
    expect(landingCopy).toMatch(/privacy-safe evidence/i);
    expect(landingCopy).not.toMatch(/privacy-safe signal/i);
    expect(landingCopy).not.toMatch(/stronger signal than CVs/i);
    expect(landingCopy).not.toMatch(/higher-signal candidates/i);
    expect(landingCopy).not.toMatch(/Weak signal/i);
    expect(landingCopy).not.toMatch(/Review-fit signal/i);
    expect(landingCopy).not.toMatch(/Verified signal|Outcome signal/i);
    expect(landingCopy).not.toMatch(/trust anchors?|trust signals?|compatibility signals?/i);
  });
});
