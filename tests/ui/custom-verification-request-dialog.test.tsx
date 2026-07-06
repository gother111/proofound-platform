import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CustomVerificationRequestDialog } from '@/app/app/i/verifications/components/CustomVerificationRequestDialog';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';

const successToast = vi.fn();
const errorToast = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => successToast(...args),
    error: (...args: unknown[]) => errorToast(...args),
  },
}));

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientErrorDiagnostic: vi.fn(),
}));

const dispatchClientErrorDiagnosticMock = vi.mocked(dispatchClientErrorDiagnostic);

describe('CustomVerificationRequestDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes('/api/verification/requests/custom/artifacts')) {
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

      if (url.includes('/api/verification/requests/email-hint')) {
        return {
          ok: true,
          json: async () => ({ kind: 'verifier_email_ready' }),
        } as Response;
      }

      if (url.includes('/api/verification/requests/custom')) {
        return {
          ok: true,
          json: async () => ({ request: { id: 'request-1' } }),
        } as Response;
      }

      throw new Error(`Unexpected fetch call: ${url} (${init?.method || 'GET'})`);
    }) as any;
  });

  it('shows a retryable artifact load failure instead of the empty artifact state', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'artifact loader unavailable' }),
      })
      .mockResolvedValueOnce({
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
      });

    global.fetch = fetchMock as any;

    render(<CustomVerificationRequestDialog open onOpenChange={vi.fn()} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Verification artifacts could not load'
    );
    expect(screen.getByText(/Your verification drafts are still safe/i)).toBeInTheDocument();
    expect(
      screen.queryByText('No unverified artifacts are currently available.')
    ).not.toBeInTheDocument();
    expect(errorToast).toHaveBeenCalledWith(
      'Could not load unverified artifacts. Please try again.'
    );

    fireEvent.click(screen.getByRole('button', { name: /Retry artifacts/i }));

    expect(await screen.findByText('TypeScript')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('loads artifacts, shows email hint, and submits selected artifacts', async () => {
    const onCreated = vi.fn();
    render(<CustomVerificationRequestDialog open onOpenChange={vi.fn()} onCreated={onCreated} />);

    await screen.findByText('TypeScript');

    fireEvent.change(screen.getByLabelText(/Verifier email address/i), {
      target: { value: 'mentor@example.com' },
    });

    await waitFor(() => {
      expect(screen.getByText("We'll send the request to this email address")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Send request/i }));

    await waitFor(() => {
      expect(successToast).toHaveBeenCalled();
    });

    const submitCall = (global.fetch as any).mock.calls.find(
      (call: unknown[]) =>
        String(call[0]).includes('/api/verification/requests/custom') &&
        (call[1] as RequestInit | undefined)?.method === 'POST'
    );

    expect(submitCall).toBeTruthy();
    const body = JSON.parse((submitCall[1] as RequestInit).body as string);

    expect(body.verifierEmail).toBe('mentor@example.com');
    expect(body.relationship).toBe('peer');
    expect(body.artifacts).toEqual([{ type: 'skill', id: 'skill-1' }]);
    expect(onCreated).toHaveBeenCalledTimes(1);
  });

  it('keeps failed custom request sends safe and visible without clearing selections', async () => {
    const rawFailure = 'Verification delivery is temporarily unavailable.';

    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes('/api/verification/requests/custom/artifacts')) {
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

      if (url.includes('/api/verification/requests/email-hint')) {
        return {
          ok: true,
          json: async () => ({ kind: 'verifier_email_ready' }),
        } as Response;
      }

      if (url.includes('/api/verification/requests/custom') && init?.method === 'POST') {
        return {
          ok: false,
          status: 503,
          json: async () => ({ error: rawFailure }),
        } as Response;
      }

      throw new Error(`Unexpected fetch call: ${url} (${init?.method || 'GET'})`);
    }) as any;

    render(<CustomVerificationRequestDialog open onOpenChange={vi.fn()} />);

    await screen.findByText('TypeScript');

    fireEvent.change(screen.getByLabelText(/Verifier email address/i), {
      target: { value: 'mentor@example.com' },
    });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Send request/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Request could not be sent');
    expect(alert).toHaveTextContent(
      'Custom verification request could not be sent. Your selections are unchanged; please try again.'
    );
    expect(alert).not.toHaveTextContent(rawFailure);
    expect(document.body.textContent ?? '').not.toContain(rawFailure);
    expect(errorToast).toHaveBeenCalledWith(
      'Custom verification request could not be sent. Your selections are unchanged; please try again.'
    );
    expect(JSON.stringify(errorToast.mock.calls)).not.toContain(rawFailure);
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'verifications.custom_dialog.send_failed',
      expect.any(Error)
    );
    expect((dispatchClientErrorDiagnosticMock.mock.calls[0]?.[1] as Error).message).toBe(
      rawFailure
    );
    expect(screen.getByDisplayValue('mentor@example.com')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeChecked();
    expect(screen.getByText('1 selected')).toBeInTheDocument();
  });
});
