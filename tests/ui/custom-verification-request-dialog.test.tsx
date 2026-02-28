import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CustomVerificationRequestDialog } from '@/app/app/i/verifications/components/CustomVerificationRequestDialog';

const successToast = vi.fn();
const errorToast = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => successToast(...args),
    error: (...args: unknown[]) => errorToast(...args),
  },
}));

describe('CustomVerificationRequestDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes('/api/expertise/verifications/custom/artifacts')) {
        return {
          ok: true,
          json: async () => ({
            artifacts: {
              skill: [{ id: 'skill-1', type: 'skill', label: 'TypeScript' }],
              experience: [],
              education: [],
              impact_story: [],
              project: [],
              volunteering: [],
            },
            total: 1,
          }),
        } as Response;
      }

      if (url.includes('/api/expertise/verifications/email-hint')) {
        return {
          ok: true,
          json: async () => ({ kind: 'proofound_user' }),
        } as Response;
      }

      if (url.includes('/api/expertise/verifications/custom/request')) {
        return {
          ok: true,
          json: async () => ({ request: { id: 'request-1' } }),
        } as Response;
      }

      throw new Error(`Unexpected fetch call: ${url} (${init?.method || 'GET'})`);
    }) as any;
  });

  it('loads artifacts, shows email hint, and submits selected artifacts', async () => {
    const onCreated = vi.fn();
    render(<CustomVerificationRequestDialog open onOpenChange={vi.fn()} onCreated={onCreated} />);

    await screen.findByText('TypeScript');

    fireEvent.change(screen.getByLabelText(/Verifier email address/i), {
      target: { value: 'mentor@example.com' },
    });

    await waitFor(() => {
      expect(screen.getByText('Proofound user')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Send request/i }));

    await waitFor(() => {
      expect(successToast).toHaveBeenCalled();
    });

    const submitCall = (global.fetch as any).mock.calls.find((call: unknown[]) =>
      String(call[0]).includes('/api/expertise/verifications/custom/request')
    );

    expect(submitCall).toBeTruthy();
    const body = JSON.parse((submitCall[1] as RequestInit).body as string);

    expect(body.verifierEmail).toBe('mentor@example.com');
    expect(body.relationship).toBe('peer');
    expect(body.artifacts).toEqual([{ type: 'skill', id: 'skill-1' }]);
    expect(onCreated).toHaveBeenCalledTimes(1);
  });
});
