import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PortfolioReadinessChecklist } from '@/components/profile/editable-profile/PortfolioReadinessChecklist';
import { evaluateIndividualProfileCompletion } from '@/lib/profile/completion-flow';

function buildState(overrides: Parameters<typeof evaluateIndividualProfileCompletion>[0]) {
  return evaluateIndividualProfileCompletion({
    displayName: 'Test User',
    handle: 'test-user',
    headline: 'Builder',
    location: 'Stockholm',
    timezone: 'Europe/Stockholm',
    desiredRolesCount: 1,
    workPreference: 'remote',
    engagementType: 'contract',
    contextCount: 0,
    skillsCount: 0,
    proofCount: 0,
    proofArtifactCount: 0,
    anchoredProofPackCount: 0,
    acceptedVerificationCount: 0,
    publicProofCount: 0,
    publishedPortfolio: false,
    ...overrides,
  });
}

describe('PortfolioReadinessChecklist', () => {
  it('uses action-oriented copy for the missing safe shell step', () => {
    render(
      <PortfolioReadinessChecklist
        completionState={buildState({
          displayName: 'Your Name',
          handle: null,
          headline: null,
        })}
      />
    );

    expect(screen.getByText('Complete your safe shell')).toBeInTheDocument();
    expect(screen.getByText('Safe shell basics')).toBeInTheDocument();
  });

  it('points users to publish once all proof gates are complete', () => {
    render(
      <PortfolioReadinessChecklist
        completionState={buildState({
          contextCount: 1,
          proofCount: 1,
          proofArtifactCount: 1,
          anchoredProofPackCount: 1,
          acceptedVerificationCount: 1,
          publishedPortfolio: false,
        })}
      />
    );

    expect(screen.getByText('Publish one public-safe proof item')).toBeInTheDocument();
    expect(screen.getByText('3/4')).toBeInTheDocument();
  });

  it('keeps the checklist toggle easy to tap on small screens', () => {
    render(<PortfolioReadinessChecklist completionState={buildState({})} />);

    const toggle = screen.getByRole('button', { name: 'Collapse checklist' });

    expect(toggle).toHaveClass('h-11', 'w-11', 'shrink-0');
  });
});
