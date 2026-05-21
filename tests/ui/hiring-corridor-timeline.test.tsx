import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HiringCorridorTimeline } from '@/components/interviews/HiringCorridorTimeline';
import type { HiringCorridorSnapshot } from '@/lib/hiring-corridor/snapshot';

const corridor: HiringCorridorSnapshot = {
  currentStep: 'interviews',
  privacyStage: 'stage4_interview_coordination',
  decisionState: null,
  engagementVerification: null,
  subjectLabel: 'Proof-review participant',
  summary: 'Interview coordination is active for this proof-review participant.',
  nextAction: {
    id: 'prepare_for_interview',
    label: 'Prepare for interview',
    description:
      'The interview is scheduled. Keep coordination details visible and record the outcome after the call.',
  },
  steps: [
    { id: 'shortlisted', label: 'Shortlisted', status: 'complete', timestamp: null },
    { id: 'intro_requested', label: 'Intro requested', status: 'complete', timestamp: null },
    { id: 'intro_accepted', label: 'Intro accepted', status: 'complete', timestamp: null },
    { id: 'reveal_requested', label: 'Reveal requested', status: 'complete', timestamp: null },
    { id: 'reveal_approved', label: 'Reveal approved', status: 'complete', timestamp: null },
    { id: 'interviews', label: 'Interviews', status: 'current', timestamp: null },
    { id: 'decision', label: 'Decision', status: 'upcoming', timestamp: null },
    {
      id: 'engagement_recorded',
      label: 'Engagement recorded',
      status: 'upcoming',
      timestamp: null,
    },
    {
      id: 'engagement_verified',
      label: 'Engagement verified',
      status: 'upcoming',
      timestamp: null,
    },
  ],
};

describe('HiringCorridorTimeline', () => {
  it('keeps mobile corridor progress compact while preserving the full desktop timeline', () => {
    const { container } = render(<HiringCorridorTimeline corridor={corridor} />);

    expect(screen.getByText('Corridor step')).toBeInTheDocument();
    expect(
      screen.getByText('Interview coordination is active for this proof-review participant.')
    ).toBeInTheDocument();
    expect(screen.getByText('Interviews · step 6 of 9')).toBeInTheDocument();
    expect(
      screen.queryByText('Interview coordination is active for this candidate.')
    ).not.toBeInTheDocument();
    expect(screen.getByText('Current next action')).toBeInTheDocument();
    expect(screen.getByText('Prepare for interview')).toBeInTheDocument();

    const desktopStepList = container.querySelector('.hidden.flex-wrap');
    expect(desktopStepList).toHaveClass('md:flex');
    expect(desktopStepList).toHaveTextContent('Shortlisted');
    expect(desktopStepList).toHaveTextContent('Engagement verified');
  });
});
