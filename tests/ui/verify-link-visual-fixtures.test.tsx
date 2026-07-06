import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import VerifyCustomRequestPage from '@/app/verify/custom/[token]/page';
import VerifySkillPage from '@/app/verify/[token]/page';
import { apiFetch } from '@/lib/api/fetch';
import { VISUAL_VERIFY_TOKENS } from '@/lib/verification/visual-link-fixtures';

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: vi.fn(),
}));

const routerPush = vi.fn();
let routeParams: Record<string, string> = {};

vi.mock('next/navigation', () => ({
  useParams: () => routeParams,
  useRouter: () => ({
    push: routerPush,
  }),
}));

const apiFetchMock = vi.mocked(apiFetch);

describe('verification link visual fixtures', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeParams = {};
    vi.stubEnv('NEXT_PUBLIC_USE_MOCK_SUPABASE', 'true');
    vi.stubEnv('NEXT_PUBLIC_PROOFOUND_VISUAL_FIXTURES', 'true');
    vi.stubEnv('PROOFOUND_VISUAL_FIXTURES', 'true');
    vi.stubEnv('VERCEL_ENV', 'development');
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('renders the filled skill-observed verifier state without calling the guarded public API', async () => {
    routeParams = { token: VISUAL_VERIFY_TOKENS.skillObserved };

    render(<VerifySkillPage />);

    await waitFor(() => {
      expect(
        screen.getAllByText(/Evidence operations and privacy-safe proof review/i).length
      ).toBeGreaterThan(0);
    });

    expect(screen.getByText(/Privacy-safe proof review checklist/i)).toBeInTheDocument();
    expect(screen.getByText(/Record bounded observations/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /No/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Partly/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Yes/i })).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Partly/i }));

    await waitFor(() => {
      expect(screen.getByText(/Partial Response Recorded/i)).toBeInTheDocument();
    });
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('shows progress only on the selected bounded-attestation action', async () => {
    routeParams = { token: 'skill-response-token' };
    vi.stubEnv('NEXT_PUBLIC_PROOFOUND_VISUAL_FIXTURES', 'false');
    vi.stubEnv('PROOFOUND_VISUAL_FIXTURES', 'false');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          verification: {
            id: 'request-1',
            verification_type: 'skill',
            skill_name: 'TypeScript migration',
            skill_code: 'typescript',
            requester_name: 'Mika Andersson',
            requester_email: 'mika@example.com',
            verifier_source: 'peer',
            verifier_relationship: 'peer',
            request_kind: 'human_observed_attestation',
            attestation_request: {
              skillIds: ['skill-1'],
              skillLabels: ['TypeScript migration'],
            },
            status: 'pending',
            created_at: '2026-03-01T10:00:00.000Z',
            expires_at: '2026-03-15T10:00:00.000Z',
          },
        }),
      }))
    );

    let resolveSubmit: (response: Response) => void = () => {};
    apiFetchMock.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolveSubmit = resolve;
      })
    );

    render(<VerifySkillPage />);

    await screen.findByText('TypeScript migration');

    fireEvent.click(screen.getByRole('button', { name: /Partly/i }));

    await waitFor(() => {
      expect(document.querySelectorAll('.animate-spin')).toHaveLength(1);
    });
    expect(screen.getByRole('button', { name: /No/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Partly/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Yes/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /No/i }).querySelector('.animate-spin')).toBeNull();
    expect(
      screen.getByRole('button', { name: /Partly/i }).querySelector('.animate-spin')
    ).not.toBeNull();
    expect(screen.getByRole('button', { name: /Yes/i }).querySelector('.animate-spin')).toBeNull();

    resolveSubmit({ ok: true, json: async () => ({}) } as Response);

    await waitFor(() => {
      expect(screen.getByText(/Partial Response Recorded/i)).toBeInTheDocument();
    });
  });

  it('renders the filled custom verifier bundle and records a local visual response', async () => {
    routeParams = { token: VISUAL_VERIFY_TOKENS.customBundle };

    render(<VerifyCustomRequestPage />);

    await waitFor(() => {
      expect(screen.getAllByText(/Elena Proof Reviewer/i).length).toBeGreaterThan(0);
    });

    expect(
      screen.getByText(
        /Led a privacy-safe evidence review workflow for a high-trust pilot corridor/i
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(/The redesign made the review packet easier to inspect/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Decline/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Verify Artifacts/i })).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Verify Artifacts/i }));

    await waitFor(() => {
      expect(screen.getByText(/Thank You/i)).toBeInTheDocument();
    });
    expect(apiFetchMock).not.toHaveBeenCalled();
  });

  it('shows progress only on the selected custom verification action', async () => {
    routeParams = { token: 'custom-response-token' };
    vi.stubEnv('NEXT_PUBLIC_PROOFOUND_VISUAL_FIXTURES', 'false');
    vi.stubEnv('PROOFOUND_VISUAL_FIXTURES', 'false');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          request: {
            id: 'custom-request-1',
            requester_name: 'Elena Proof',
            relationship: 'peer',
            request_kind: 'generic_verification',
            status: 'pending',
            created_at: '2026-03-01T10:00:00.000Z',
            expires_at: '2026-03-15T10:00:00.000Z',
            items: [
              {
                id: 'item-1',
                artifact_type: 'project',
                artifact_id: 'project-1',
                display_label: 'Launch proof packet',
                claim_template: 'Can you verify this project?',
                claim_label: 'Verify the launch proof packet.',
                support_label: 'Direct review',
                status: 'pending',
              },
            ],
          },
        }),
      }))
    );

    let resolveSubmit: (response: Response) => void = () => {};
    apiFetchMock.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolveSubmit = resolve;
      })
    );

    render(<VerifyCustomRequestPage />);

    await screen.findByText('Verify the launch proof packet.');

    fireEvent.click(screen.getByRole('button', { name: /Verify Artifacts/i }));

    await waitFor(() => {
      expect(document.querySelectorAll('.animate-spin')).toHaveLength(1);
    });
    expect(screen.getByRole('button', { name: /Decline/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Verify Artifacts/i })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /Decline/i }).querySelector('.animate-spin')
    ).toBeNull();
    expect(
      screen.getByRole('button', { name: /Verify Artifacts/i }).querySelector('.animate-spin')
    ).not.toBeNull();

    resolveSubmit({ ok: true, json: async () => ({}) } as Response);

    await waitFor(() => {
      expect(screen.getByText(/Thank You/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/selected artifacts in this request/i)).toBeInTheDocument();
  });

  it('shows neutral invalid-link copy for failed skill verification links', async () => {
    routeParams = { token: 'not-a-real-token' };
    vi.stubEnv('NEXT_PUBLIC_USE_MOCK_SUPABASE', 'false');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 503,
        json: async () => ({ error: 'Service temporarily unavailable' }),
      }))
    );

    render(<VerifySkillPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /unable to load request/i })).toBeInTheDocument();
    });

    expect(
      screen.getByText(/This verification link is invalid, expired, or no longer available/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'No verification response was recorded from this page.'
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Ask the requester to send a fresh verification link'
    );
    expect(screen.queryByText(/Service temporarily unavailable/i)).not.toBeInTheDocument();
  });

  it('shows neutral invalid-link copy for failed custom verification links', async () => {
    routeParams = { token: 'not-a-real-token' };
    vi.stubEnv('NEXT_PUBLIC_USE_MOCK_SUPABASE', 'false');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 503,
        json: async () => ({ error: 'Service temporarily unavailable' }),
      }))
    );

    render(<VerifyCustomRequestPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /unable to load request/i })).toBeInTheDocument();
    });

    expect(
      screen.getByText(/This verification link is invalid, expired, or no longer available/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'No verification response was recorded from this page.'
    );
    expect(screen.getByRole('button', { name: /return home/i })).toBeInTheDocument();
    expect(screen.queryByText(/Service temporarily unavailable/i)).not.toBeInTheDocument();
  });

  it('gives expired skill verification links a safe recovery action', async () => {
    routeParams = { token: 'expired-skill-token' };
    vi.stubEnv('NEXT_PUBLIC_PROOFOUND_VISUAL_FIXTURES', 'false');
    vi.stubEnv('PROOFOUND_VISUAL_FIXTURES', 'false');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          verification: {
            id: 'request-expired-1',
            verification_type: 'skill',
            skill_name: 'Privacy-safe evidence review',
            skill_code: 'privacy_review',
            requester_name: 'Mika Andersson',
            requester_email: 'mika@example.com',
            verifier_source: 'peer',
            verifier_relationship: 'peer',
            status: 'expired',
            created_at: '2026-03-01T10:00:00.000Z',
            expires_at: '2026-03-15T10:00:00.000Z',
          },
        }),
      }))
    );

    render(<VerifySkillPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /request expired/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('status')).toHaveTextContent(
      'No verification response was recorded from this page.'
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'Ask the requester to send a fresh verification link'
    );

    fireEvent.click(screen.getByRole('button', { name: /return home/i }));
    expect(routerPush).toHaveBeenCalledWith('/');
  });

  it('gives already-completed custom verification links a safe recovery action', async () => {
    routeParams = { token: 'accepted-custom-token' };
    vi.stubEnv('NEXT_PUBLIC_PROOFOUND_VISUAL_FIXTURES', 'false');
    vi.stubEnv('PROOFOUND_VISUAL_FIXTURES', 'false');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          request: {
            id: 'custom-accepted-1',
            requester_name: 'Elena Proof',
            relationship: 'peer',
            request_kind: 'generic_verification',
            status: 'accepted',
            created_at: '2026-03-01T10:00:00.000Z',
            expires_at: '2026-03-15T10:00:00.000Z',
            responded_at: '2026-03-02T10:00:00.000Z',
            response_message: 'Looks accurate.',
            items: [],
          },
        }),
      }))
    );

    render(<VerifyCustomRequestPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /already verified/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('status')).toHaveTextContent(
      'No new verification response was recorded from this page.'
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'ask the requester to send a fresh verification request'
    );

    fireEvent.click(screen.getByRole('button', { name: /return home/i }));
    expect(routerPush).toHaveBeenCalledWith('/');
  });

  it('keeps visual skill tokens on the guarded public API path in plain mock mode', async () => {
    routeParams = { token: VISUAL_VERIFY_TOKENS.skillObserved };
    vi.stubEnv('NEXT_PUBLIC_PROOFOUND_VISUAL_FIXTURES', 'false');
    vi.stubEnv('PROOFOUND_VISUAL_FIXTURES', 'false');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Invalid token' }),
      }))
    );

    render(<VerifySkillPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/verify/${VISUAL_VERIFY_TOKENS.skillObserved}`
      );
    });

    expect(screen.getByRole('heading', { name: /unable to load request/i })).toBeInTheDocument();
  });

  it('keeps failed skill verification responses inline and retryable', async () => {
    routeParams = { token: 'skill-response-token' };
    vi.stubEnv('NEXT_PUBLIC_PROOFOUND_VISUAL_FIXTURES', 'false');
    vi.stubEnv('PROOFOUND_VISUAL_FIXTURES', 'false');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          verification: {
            id: 'request-1',
            verification_type: 'skill',
            skill_name: 'TypeScript migration',
            skill_code: 'typescript',
            requester_name: 'Mika Andersson',
            requester_email: 'mika@example.com',
            verifier_source: 'peer',
            verifier_relationship: 'peer',
            status: 'pending',
            created_at: '2026-03-01T10:00:00.000Z',
            expires_at: '2026-03-15T10:00:00.000Z',
          },
        }),
      }))
    );
    apiFetchMock.mockRejectedValueOnce(new Error('verification service unavailable'));

    render(<VerifySkillPage />);

    await screen.findByText('TypeScript migration');

    fireEvent.change(screen.getByLabelText(/Add a note/i), {
      target: { value: 'I directly reviewed this migration.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Verify Skill/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Verification response could not be recorded. Your note and review choices are still here; please try again.'
    );
    expect(
      screen.queryByRole('heading', { name: /unable to load request/i })
    ).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('I directly reviewed this migration.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Verify Skill/i })).toBeEnabled();
  });

  it('keeps returned skill verification response failures safe', async () => {
    const rawError = 'database insert failed: verifier email policy detail';
    routeParams = { token: 'skill-response-token' };
    vi.stubEnv('NEXT_PUBLIC_PROOFOUND_VISUAL_FIXTURES', 'false');
    vi.stubEnv('PROOFOUND_VISUAL_FIXTURES', 'false');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          verification: {
            id: 'request-1',
            verification_type: 'skill',
            skill_name: 'TypeScript migration',
            skill_code: 'typescript',
            requester_name: 'Mika Andersson',
            requester_email: 'mika@example.com',
            verifier_source: 'peer',
            verifier_relationship: 'peer',
            status: 'pending',
            created_at: '2026-03-01T10:00:00.000Z',
            expires_at: '2026-03-15T10:00:00.000Z',
          },
        }),
      }))
    );
    apiFetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: rawError }),
    } as Response);

    render(<VerifySkillPage />);

    await screen.findByText('TypeScript migration');

    fireEvent.change(screen.getByLabelText(/Add a note/i), {
      target: { value: 'I directly reviewed this migration.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Verify Skill/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Verification response could not be recorded. Your note and review choices are still here; please try again.'
    );
    expect(screen.queryByText(rawError)).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('I directly reviewed this migration.')).toBeInTheDocument();
  });

  it('keeps failed custom verification responses inline and retryable', async () => {
    const rawError = 'database insert failed: custom response policy detail';
    routeParams = { token: 'custom-response-token' };
    vi.stubEnv('NEXT_PUBLIC_PROOFOUND_VISUAL_FIXTURES', 'false');
    vi.stubEnv('PROOFOUND_VISUAL_FIXTURES', 'false');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          request: {
            id: 'custom-request-1',
            requester_name: 'Elena Proof',
            relationship: 'peer',
            request_kind: 'generic_verification',
            status: 'pending',
            created_at: '2026-03-01T10:00:00.000Z',
            expires_at: '2026-03-15T10:00:00.000Z',
            items: [
              {
                id: 'item-1',
                artifact_type: 'project',
                artifact_id: 'project-1',
                display_label: 'Launch proof packet',
                claim_template: 'Can you verify this project?',
                claim_label: 'Verify the launch proof packet.',
                support_label: 'Direct review',
                status: 'pending',
              },
            ],
          },
        }),
      }))
    );
    apiFetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: rawError }),
    } as Response);

    render(<VerifyCustomRequestPage />);

    await screen.findByText('Verify the launch proof packet.');

    fireEvent.change(screen.getByLabelText(/Add a note/i), {
      target: { value: 'I reviewed the launch evidence.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Verify Artifacts/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Verification response could not be recorded. Your note and review choices are still here; please try again.'
    );
    expect(
      screen.queryByRole('heading', { name: /unable to load request/i })
    ).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('I reviewed the launch evidence.')).toBeInTheDocument();
    expect(screen.queryByText(rawError)).not.toBeInTheDocument();
    expect(screen.getByText('Verify the launch proof packet.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Verify Artifacts/i })).toBeEnabled();
  });
});
