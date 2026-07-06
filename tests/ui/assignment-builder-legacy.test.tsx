import React, { useEffect } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createAssignment } from '@/actions/assignment';
import { AssignmentBuilder } from '@/components/matching/AssignmentBuilder';
import { dispatchClientDiagnostic } from '@/lib/client-diagnostics';

const { pushMock, toastErrorMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: toastErrorMock,
  },
}));

vi.mock('@/actions/assignment', async () => {
  const actual =
    await vi.importActual<typeof import('@/actions/assignment')>('@/actions/assignment');

  return {
    ...actual,
    createAssignment: vi.fn(),
  };
});

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientDiagnostic: vi.fn(),
  dispatchClientErrorDiagnostic: vi.fn(),
}));

vi.mock('@/components/matching/assignment-steps', () => ({
  Step1BusinessValue: ({ form, onNext }: any) => {
    useEffect(() => {
      form.reset({
        role: 'Proof review lead',
        businessValue: 'Improve assignment review quality with proof-backed decisions.',
        status: 'active',
        currency: 'USD',
        locationMode: 'hybrid',
        compMin: 0,
        compMax: 0,
        weights: {
          skills: 0.4,
          values: 0.2,
          experience: 0.2,
          location: 0.1,
          availability: 0.1,
        },
        mustHaveSkills: [],
        niceToHaveSkills: [],
        valuesRequired: [],
        causeTags: [],
      });
    }, [form]);

    return (
      <div>
        <p>Business value step</p>
        <button type="button" onClick={onNext}>
          next-step-1
        </button>
      </div>
    );
  },
  Step2TargetOutcomes: ({ onNext }: any) => (
    <div>
      <p>Outcomes step</p>
      <button type="button" onClick={onNext}>
        next-step-2
      </button>
    </div>
  ),
  Step3WeightMatrix: ({ onNext }: any) => (
    <div>
      <p>Weights step</p>
      <button type="button" onClick={onNext}>
        next-step-3
      </button>
    </div>
  ),
  Step4Practicals: ({ onNext }: any) => (
    <div>
      <p>Practicals step</p>
      <button type="button" onClick={onNext}>
        next-step-4
      </button>
    </div>
  ),
  Step5ExpertiseMapping: ({ onSubmit }: any) => {
    return (
      <button type="button" onClick={() => void onSubmit()}>
        Publish assignment
      </button>
    );
  },
}));

const createAssignmentMock = vi.mocked(createAssignment);
const dispatchClientDiagnosticMock = vi.mocked(dispatchClientDiagnostic);

describe('legacy AssignmentBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.scrollTo = vi.fn();
  });

  it('keeps returned publish failures safe and retryable', async () => {
    const rawFailure = 'database insert failed: assignments policy detail';
    createAssignmentMock.mockResolvedValueOnce({
      error: rawFailure,
      details: { table: 'assignments' },
    } as any);

    render(<AssignmentBuilder orgId="org-1" orgSlug="acme" />);

    fireEvent.click(screen.getByRole('button', { name: /next-step-1/i }));
    expect(await screen.findByText('Outcomes step')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /next-step-2/i }));
    expect(await screen.findByText('Weights step')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /next-step-3/i }));
    expect(await screen.findByText('Practicals step')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /next-step-4/i }));
    fireEvent.click(await screen.findByRole('button', { name: /publish assignment/i }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        'Assignment was not published. Your draft is still on this page; review it and try again.'
      );
    });
    expect(JSON.stringify(toastErrorMock.mock.calls)).not.toContain(rawFailure);
    expect(dispatchClientDiagnosticMock).toHaveBeenCalledWith(
      'assignment_builder.legacy.create_rejected',
      {
        hasReturnedError: true,
        detailType: 'object',
      }
    );
    expect(pushMock).not.toHaveBeenCalled();
  });
});
