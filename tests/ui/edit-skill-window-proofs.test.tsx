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

  it('uploads a document proof and includes filePath payload', async () => {
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

    expect(payload.proofType).toBe('document');
    expect(payload.filePath).toBe('proof/user-1/doc.pdf');
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
});
