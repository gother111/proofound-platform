import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OrgTrustProfileEditor } from '@/components/organization/OrgTrustProfileEditor';
import { apiFetch } from '@/lib/api/fetch';
import { dispatchClientDiagnostic, dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';

const { refreshMock, toastMock } = vi.hoisted(() => ({
  refreshMock: vi.fn(),
  toastMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientDiagnostic: vi.fn(),
  dispatchClientErrorDiagnostic: vi.fn(),
}));

const apiFetchMock = vi.mocked(apiFetch);
const dispatchClientDiagnosticMock = vi.mocked(dispatchClientDiagnostic);
const dispatchClientErrorDiagnosticMock = vi.mocked(dispatchClientErrorDiagnostic);

const editableOrg = {
  id: 'org-1',
  displayName: 'Acme Studio',
  whyWorkMatters: 'This assignment path helps reviewers compare real proof.',
  mission: 'Make hiring evidence easier to inspect.',
  operatingContext: 'Small review team with async proof review.',
  website: 'https://acme.example/team',
};

describe('OrgTrustProfileEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps failed trust page saves safe, diagnostic, and retryable', async () => {
    const rawFailure = 'database password leaked-ish';
    apiFetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: rawFailure }), { status: 500 })
    );

    render(<OrgTrustProfileEditor org={editableOrg} canEdit={true} />);

    const updatedMission = 'Make hiring evidence easier to inspect before the first assignment.';
    fireEvent.change(screen.getByLabelText('Mission'), {
      target: { value: updatedMission },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save trust page' }));

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Organization trust page was not saved',
          description:
            'Your published trust page was not changed. The edited fields are still here; please try again before continuing.',
          variant: 'destructive',
        })
      );
    });

    expect(JSON.stringify(toastMock.mock.calls)).not.toContain(rawFailure);
    expect(dispatchClientDiagnosticMock).toHaveBeenCalledWith(
      'organization.trust_profile.save_returned_error',
      {
        organizationId: editableOrg.id,
        status: 500,
        hasReturnedError: true,
      }
    );
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'organization.trust_profile.save_failed',
      expect.any(Error)
    );
    expect((dispatchClientErrorDiagnosticMock.mock.calls[0]?.[1] as Error).message).toBe(
      'organization_trust_profile_save_request_failed'
    );
    expect(JSON.stringify(dispatchClientDiagnosticMock.mock.calls)).not.toContain(rawFailure);
    expect(JSON.stringify(dispatchClientErrorDiagnosticMock.mock.calls)).not.toContain(rawFailure);
    expect(screen.getByLabelText('Mission')).toHaveValue(updatedMission);
    expect(screen.getByRole('button', { name: 'Save trust page' })).toBeEnabled();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
