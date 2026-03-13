import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EditSkillWindow } from '@/app/app/i/expertise/components/EditSkillWindow';

const apiFetchMock = vi.fn();
const toastMock = vi.fn();
const routerPushMock = vi.fn();
const uploadFileMock = vi.fn();
const validateFileMock = vi.fn();

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: any[]) => apiFetchMock(...args),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: routerPushMock,
  }),
}));

vi.mock('@/lib/upload', () => ({
  uploadFile: (...args: any[]) => uploadFileMock(...args),
  validateFile: (...args: any[]) => validateFileMock(...args),
}));

function mockResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

const baseSkill = {
  id: 'skill-1',
  level: 3,
  relevance: 'current' as const,
  skill_name: 'TypeScript',
};

describe('EditSkillWindow proof refresh behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateFileMock.mockReturnValue({ valid: true });
    uploadFileMock.mockResolvedValue({
      success: true,
      uploadedFileId: '11111111-1111-4111-8111-111111111111',
      url: 'https://example.com/doc.pdf',
      path: 'proof/user-1/doc.pdf',
      fileName: 'doc.pdf',
    });
  });

  it('calls onSkillUpdated after successful proof add', async () => {
    const onSkillUpdated = vi.fn();

    apiFetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/proofs') && !init?.method) {
        return mockResponse({ proofs: [] });
      }
      if (url.endsWith('/verification-request') && !init?.method) {
        return mockResponse({ requests: [] });
      }
      if (url.endsWith('/proofs') && init?.method === 'POST') {
        return mockResponse({
          proof: {
            id: 'proof-1',
            proof_type: 'link',
            title: 'Launch case study',
            description: null,
            url: 'https://example.com/case-study',
            issued_date: null,
          },
        });
      }
      return mockResponse({});
    });

    render(
      <EditSkillWindow
        open
        onOpenChange={vi.fn()}
        skill={baseSkill}
        onSkillUpdated={onSkillUpdated}
        onSkillDeleted={vi.fn()}
      />
    );

    await waitFor(() =>
      expect(apiFetchMock).toHaveBeenCalledWith('/api/expertise/user-skills/skill-1/proofs')
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add Proof' }));
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Launch case study' },
    });

    const addButtons = screen.getAllByRole('button', { name: 'Add Proof' });
    fireEvent.click(addButtons[addButtons.length - 1]);

    await waitFor(() => expect(onSkillUpdated).toHaveBeenCalledTimes(1));
  });

  it('calls onSkillUpdated after successful proof delete', async () => {
    const onSkillUpdated = vi.fn();

    apiFetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/proofs') && !init?.method) {
        return mockResponse({
          proofs: [
            {
              id: 'proof-1',
              proof_type: 'link',
              title: 'Launch case study',
              description: null,
              url: 'https://example.com/case-study',
              issued_date: null,
            },
          ],
        });
      }
      if (url.endsWith('/verification-request') && !init?.method) {
        return mockResponse({ requests: [] });
      }
      if (url.endsWith('/proofs/proof-1') && init?.method === 'DELETE') {
        return mockResponse({});
      }
      return mockResponse({});
    });

    render(
      <EditSkillWindow
        open
        onOpenChange={vi.fn()}
        skill={baseSkill}
        onSkillUpdated={onSkillUpdated}
        onSkillDeleted={vi.fn()}
      />
    );

    await screen.findByText('Launch case study');

    fireEvent.click(screen.getByRole('button', { name: 'Remove proof Launch case study' }));

    await waitFor(() => expect(onSkillUpdated).toHaveBeenCalledTimes(1));
  });

  it('uploads a document proof and includes the uploaded file id payload', async () => {
    apiFetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/proofs') && !init?.method) {
        return mockResponse({ proofs: [] });
      }
      if (url.endsWith('/verification-request') && !init?.method) {
        return mockResponse({ requests: [] });
      }
      if (url.endsWith('/proofs') && init?.method === 'POST') {
        return mockResponse({
          proof: {
            id: 'proof-2',
            proof_type: 'document',
            title: 'doc.pdf',
            description: '',
            url: 'https://example.com/doc.pdf',
            file_path: 'proof/user-1/doc.pdf',
          },
        });
      }
      return mockResponse({});
    });

    render(
      <EditSkillWindow
        open
        onOpenChange={vi.fn()}
        skill={baseSkill}
        onSkillUpdated={vi.fn()}
        onSkillDeleted={vi.fn()}
      />
    );

    await waitFor(() =>
      expect(apiFetchMock).toHaveBeenCalledWith('/api/expertise/user-skills/skill-1/proofs')
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add Proof' }));
    fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'document' } });

    const file = new File(['proof'], 'doc.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText('Upload Document'), {
      target: { files: [file] },
    });

    await waitFor(() => expect(uploadFileMock).toHaveBeenCalledTimes(1));

    const addButtons = screen.getAllByRole('button', { name: 'Add Proof' });
    fireEvent.click(addButtons[addButtons.length - 1]);

    await waitFor(() => {
      const proofPostCall = apiFetchMock.mock.calls.find(
        ([url, init]) =>
          url === '/api/expertise/user-skills/skill-1/proofs' &&
          (init as RequestInit | undefined)?.method === 'POST'
      );
      expect(proofPostCall).toBeTruthy();
    });

    const proofPostCall = apiFetchMock.mock.calls.find(
      ([url, init]) =>
        url === '/api/expertise/user-skills/skill-1/proofs' &&
        (init as RequestInit | undefined)?.method === 'POST'
    );

    expect(proofPostCall).toBeTruthy();
    const requestInit = proofPostCall?.[1] as RequestInit;
    const payload = JSON.parse(requestInit.body as string);

    expect(payload.proofType).toBe('document');
    expect(payload.filePath).toBe('proof/user-1/doc.pdf');
    expect(payload.uploadedFileId).toBe('11111111-1111-4111-8111-111111111111');
    expect(payload.url).toBe('https://example.com/doc.pdf');
  });

  it('submits issued and expiration dates for proofs', async () => {
    apiFetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/proofs') && !init?.method) {
        return mockResponse({ proofs: [] });
      }
      if (url.endsWith('/verification-request') && !init?.method) {
        return mockResponse({ requests: [] });
      }
      if (url.endsWith('/proofs') && init?.method === 'POST') {
        return mockResponse({
          proof: {
            id: 'proof-3',
            proof_type: 'certification',
            title: 'AWS Associate',
            issued_date: '2025-01-01',
            expires_date: '2028-01-01',
          },
        });
      }
      return mockResponse({});
    });

    render(
      <EditSkillWindow
        open
        onOpenChange={vi.fn()}
        skill={baseSkill}
        onSkillUpdated={vi.fn()}
        onSkillDeleted={vi.fn()}
      />
    );

    await waitFor(() =>
      expect(apiFetchMock).toHaveBeenCalledWith('/api/expertise/user-skills/skill-1/proofs')
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add Proof' }));
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'AWS Associate' },
    });
    fireEvent.change(screen.getByLabelText('Issued Date (Optional)'), {
      target: { value: '2025-01-01' },
    });
    fireEvent.change(screen.getByLabelText('Expiration Date (Optional)'), {
      target: { value: '2028-01-01' },
    });

    const addButtons = screen.getAllByRole('button', { name: 'Add Proof' });
    fireEvent.click(addButtons[addButtons.length - 1]);

    await waitFor(() =>
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/api/expertise/user-skills/skill-1/proofs',
        expect.objectContaining({ method: 'POST' })
      )
    );

    const proofPostCall = apiFetchMock.mock.calls.find(
      ([url, init]) =>
        url === '/api/expertise/user-skills/skill-1/proofs' &&
        (init as RequestInit | undefined)?.method === 'POST'
    );

    expect(proofPostCall).toBeTruthy();
    const requestInit = proofPostCall?.[1] as RequestInit;
    const payload = JSON.parse(requestInit.body as string);

    expect(payload.issuedDate).toBe('2025-01-01');
    expect(payload.expiresDate).toBe('2028-01-01');
  });

  it('disables adding proofs once the per-skill proof limit is reached', async () => {
    apiFetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/proofs') && !init?.method) {
        return mockResponse({
          proofs: Array.from({ length: 5 }, (_, index) => ({
            id: `proof-${index + 1}`,
            proof_type: 'link',
            title: `Proof ${index + 1}`,
            url: `https://example.com/proof-${index + 1}`,
          })),
        });
      }
      if (url.endsWith('/verification-request') && !init?.method) {
        return mockResponse({ requests: [] });
      }
      return mockResponse({});
    });

    render(
      <EditSkillWindow
        open
        onOpenChange={vi.fn()}
        skill={baseSkill}
        onSkillUpdated={vi.fn()}
        onSkillDeleted={vi.fn()}
      />
    );

    await screen.findByText('You have reached the maximum of 5 proofs for this skill.');
    expect(screen.getByRole('button', { name: 'Add Proof' })).toBeDisabled();
  });

  it('normalizes last_used_at to ISO datetime when saving edited skill details', async () => {
    const onOpenChange = vi.fn();

    apiFetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/proofs') && !init?.method) {
        return mockResponse({ proofs: [] });
      }
      if (url.endsWith('/verification-request') && !init?.method) {
        return mockResponse({ requests: [] });
      }
      if (url.endsWith('/user-skills/skill-1') && init?.method === 'PATCH') {
        return mockResponse({ skill: { id: 'skill-1' } });
      }
      return mockResponse({});
    });

    render(
      <EditSkillWindow
        open
        onOpenChange={onOpenChange}
        skill={{ ...baseSkill, last_used_at: '2026-02-20T14:45:00.000Z' }}
        onSkillUpdated={vi.fn()}
        onSkillDeleted={vi.fn()}
      />
    );

    await waitFor(() =>
      expect(apiFetchMock).toHaveBeenCalledWith('/api/expertise/user-skills/skill-1/proofs')
    );

    fireEvent.change(screen.getByLabelText('Last Used'), {
      target: { value: '2026-02-26' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() =>
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/api/expertise/user-skills/skill-1',
        expect.objectContaining({ method: 'PATCH' })
      )
    );

    const patchCall = apiFetchMock.mock.calls.find(
      ([url, init]) =>
        url === '/api/expertise/user-skills/skill-1' &&
        (init as RequestInit | undefined)?.method === 'PATCH'
    );

    expect(patchCall).toBeTruthy();
    const patchInit = patchCall?.[1] as RequestInit;
    const payload = JSON.parse(patchInit.body as string);

    expect(payload.last_used_at).toBe('2026-02-26T00:00:00.000Z');
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('normalizes verifier email before requesting verification from edit flow', async () => {
    apiFetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/proofs') && !init?.method) {
        return mockResponse({ proofs: [] });
      }
      if (url.endsWith('/verification-request') && !init?.method) {
        return mockResponse({ requests: [] });
      }
      if (url.endsWith('/verification-request') && init?.method === 'POST') {
        return mockResponse({
          request: {
            id: 'req-1',
            status: 'pending',
            verifier_source: 'peer',
            verifier_email: 'mentor@example.com',
            created_at: '2026-02-26T00:00:00.000Z',
          },
          email_sent: true,
        });
      }
      return mockResponse({});
    });

    render(
      <EditSkillWindow
        open
        onOpenChange={vi.fn()}
        skill={baseSkill}
        onSkillUpdated={vi.fn()}
        onSkillDeleted={vi.fn()}
      />
    );

    await waitFor(() =>
      expect(apiFetchMock).toHaveBeenCalledWith('/api/expertise/user-skills/skill-1/proofs')
    );

    fireEvent.click(screen.getByRole('button', { name: 'Request Verification' }));
    fireEvent.change(screen.getByLabelText('Verifier Email'), {
      target: { value: '  Mentor@Example.COM  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send Request' }));

    await waitFor(() =>
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/api/expertise/user-skills/skill-1/verification-request',
        expect.objectContaining({ method: 'POST' })
      )
    );

    const verificationCall = apiFetchMock.mock.calls.find(
      ([url, init]) =>
        url === '/api/expertise/user-skills/skill-1/verification-request' &&
        (init as RequestInit | undefined)?.method === 'POST'
    );

    expect(verificationCall).toBeTruthy();
    const verificationInit = verificationCall?.[1] as RequestInit;
    const payload = JSON.parse(verificationInit.body as string);

    expect(payload.verifierEmail).toBe('mentor@example.com');
  });

  it('deletes a pending verification request from edit flow', async () => {
    const onSkillUpdated = vi.fn();

    apiFetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/proofs') && !init?.method) {
        return mockResponse({ proofs: [] });
      }
      if (url.endsWith('/verification-request') && !init?.method) {
        return mockResponse({
          requests: [
            {
              id: 'verification-1',
              status: 'pending',
              verifier_source: 'peer',
              verifier_email: 'mentor@example.com',
              message: 'Please verify this skill.',
              created_at: '2026-02-26T00:00:00.000Z',
            },
          ],
        });
      }
      if (
        url.endsWith('/verification/requests/skill/verification-1') &&
        init?.method === 'DELETE'
      ) {
        return mockResponse({ success: true });
      }
      return mockResponse({});
    });

    render(
      <EditSkillWindow
        open
        onOpenChange={vi.fn()}
        skill={baseSkill}
        onSkillUpdated={onSkillUpdated}
        onSkillDeleted={vi.fn()}
      />
    );

    await screen.findByText('mentor@example.com');
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Delete verification request for mentor@example.com',
      })
    );

    await waitFor(() =>
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/api/verification/requests/skill/verification-1',
        expect.objectContaining({ method: 'DELETE' })
      )
    );

    await waitFor(() => expect(onSkillUpdated).toHaveBeenCalledTimes(1));
    expect(screen.queryByText('mentor@example.com')).not.toBeInTheDocument();
  });

  it('shows bundled request guidance when deleting a bundled verification request', async () => {
    const onSkillUpdated = vi.fn();

    apiFetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/proofs') && !init?.method) {
        return mockResponse({ proofs: [] });
      }
      if (url.endsWith('/verification-request') && !init?.method) {
        return mockResponse({
          requests: [
            {
              id: 'verification-2',
              status: 'pending',
              verifier_source: 'peer',
              verifier_email: 'bundle@example.com',
              custom_request_id: 'bundle-1',
              message: 'Bundled verification',
              created_at: '2026-02-26T00:00:00.000Z',
            },
          ],
        });
      }
      if (
        url.endsWith('/verification/requests/skill/verification-2') &&
        init?.method === 'DELETE'
      ) {
        return mockResponse(
          {
            code: 'BUNDLED_REQUEST',
            error: 'This verification request belongs to a bundled request.',
          },
          409
        );
      }
      return mockResponse({});
    });

    render(
      <EditSkillWindow
        open
        onOpenChange={vi.fn()}
        skill={baseSkill}
        onSkillUpdated={onSkillUpdated}
        onSkillDeleted={vi.fn()}
      />
    );

    await screen.findByText('bundle@example.com');
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Delete verification request for bundle@example.com',
      })
    );

    await waitFor(() =>
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/api/verification/requests/skill/verification-2',
        expect.objectContaining({ method: 'DELETE' })
      )
    );

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Bundled verification request',
          variant: 'destructive',
        })
      )
    );
    expect(onSkillUpdated).not.toHaveBeenCalled();
  });
});
