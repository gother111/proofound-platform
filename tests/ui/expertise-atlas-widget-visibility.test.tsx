import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
  }),
}));

vi.mock('@/components/expertise/CVJDAutoSuggest', () => ({
  CVJDAutoSuggest: () => null,
}));

vi.mock('@/components/skill-gaps/SkillGapsClient', () => ({
  SkillGapsClient: () => null,
}));

vi.mock('@/app/app/i/expertise/components/EmptyState', () => ({
  EmptyState: () => <div data-testid="empty-state" />,
}));

vi.mock('@/app/app/i/expertise/components/L1Grid', () => ({
  L1Grid: () => <div data-testid="l1-grid" />,
}));

vi.mock('@/app/app/i/expertise/components/L2Modal', () => ({
  L2Modal: () => null,
}));

vi.mock('@/app/app/i/expertise/components/L4Card', () => ({
  L4Card: () => null,
}));

vi.mock('@/app/app/i/expertise/components/AddSkillDrawer', () => ({
  AddSkillDrawer: () => null,
}));

vi.mock('@/app/app/i/expertise/components/EditSkillWindow', () => ({
  EditSkillWindow: () => null,
}));

vi.mock('@/app/app/i/expertise/components/DashboardFilters', () => ({
  DashboardFilters: () => <div data-testid="dashboard-filters" />,
}));

vi.mock('@/app/app/i/expertise/components/SkillsSideSheet', () => ({
  SkillsSideSheet: () => null,
}));

vi.mock('@/app/app/i/expertise/components/AboutSection', () => ({
  AboutSection: () => <div data-testid="about-section" />,
}));

vi.mock('@/app/app/i/expertise/widgets/CredibilityPie', () => ({
  CredibilityPie: () => <div data-testid="credibility-widget" />,
}));

vi.mock('@/app/app/i/expertise/widgets/RelevanceBars', () => ({
  RelevanceBars: () => <div data-testid="relevance-widget" />,
}));

vi.mock('@/app/app/i/expertise/widgets/SkillWheel', () => ({
  SkillWheel: () => <div data-testid="skill-wheel-widget" />,
}));

vi.mock('@/app/app/i/expertise/widgets/VerificationSourcesPie', () => ({
  VerificationSourcesPie: () => <div data-testid="verification-widget" />,
}));

vi.mock('@/app/app/i/expertise/widgets/RecencyScatter', () => ({
  RecencyScatter: () => <div data-testid="scatter-widget" />,
}));

vi.mock('@/app/app/i/expertise/widgets/CoverageHeatmap', () => ({
  CoverageHeatmap: () => <div data-testid="coverage-widget" />,
}));

vi.mock('@/app/app/i/expertise/widgets/NextBestActions', () => ({
  NextBestActions: () => <div data-testid="next-actions-widget" />,
}));

vi.mock('@/app/app/i/expertise/utils/normalizeSkill', () => ({
  normalizeSkillForClient: (skill: unknown) => skill,
}));

import { ExpertiseAtlasClient } from '@/app/app/i/expertise/ExpertiseAtlasClient';

function createBaseProps() {
  return {
    initialSkills: [
      {
        id: 'skill-1',
        proof_count: 0,
        verification_count: 0,
        lastUsedAt: new Date().toISOString(),
        taxonomy: {
          cat_id: 1,
          subcat_id: 10,
          l3_id: 100,
          name_i18n: { en: 'Skill One' },
          slug: 'skill-one',
        },
        level: 3,
        relevance: 'current',
      },
    ],
    domains: [{ catId: 1, nameI18n: { en: 'Universal Capabilities' }, skillCount: 1 }],
    taxonomyReady: true,
    initialTab: 'atlas' as const,
  };
}

describe('Expertise Atlas dashboard widget visibility', () => {
  it('hides verification and next-actions cards when those datasets are empty', () => {
    render(
      <ExpertiseAtlasClient
        {...createBaseProps()}
        widgetData={{
          credibility: { verified: 0, proofOnly: 0, claimOnly: 1 },
          relevance: { obsolete: 0, current: 1, emerging: 0 },
          skillWheel: [{ domain: 'Universal Capabilities', count: 1, weightedCount: 1 }],
          verificationSources: { self: 0, peer: 0, manager: 0, external: 0 },
          scatter: [{ id: 'skill-1', name: 'Skill One', level: 3, monthsSinceLastUsed: 1 }],
          coverage: [{ l1: 1, l2: 10, count: 1, avgLevel: 3, l2Name: 'Core' }],
          nextBestActions: [],
        }}
      />
    );

    expect(screen.queryByTestId('verification-widget')).not.toBeInTheDocument();
    expect(screen.queryByTestId('next-actions-widget')).not.toBeInTheDocument();
    expect(screen.getByTestId('credibility-widget')).toBeInTheDocument();
    expect(screen.getByTestId('coverage-widget')).toBeInTheDocument();
  });

  it('shows verification and next-actions cards when they have data', () => {
    render(
      <ExpertiseAtlasClient
        {...createBaseProps()}
        widgetData={{
          credibility: { verified: 1, proofOnly: 0, claimOnly: 0 },
          relevance: { obsolete: 0, current: 1, emerging: 0 },
          skillWheel: [{ domain: 'Universal Capabilities', count: 1, weightedCount: 1.5 }],
          verificationSources: { self: 0, peer: 1, manager: 0, external: 0 },
          scatter: [{ id: 'skill-1', name: 'Skill One', level: 4, monthsSinceLastUsed: 1 }],
          coverage: [{ l1: 1, l2: 10, count: 1, avgLevel: 4, l2Name: 'Core' }],
          nextBestActions: [
            {
              skillId: 'skill-1',
              skillName: 'Skill One',
              action: 'Request verification',
              reason: 'Unverified',
              priority: 1,
            },
          ],
        }}
      />
    );

    expect(screen.getByTestId('verification-widget')).toBeInTheDocument();
    expect(screen.getByTestId('next-actions-widget')).toBeInTheDocument();
  });
});
