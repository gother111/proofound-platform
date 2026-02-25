import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EditSkillWindow } from '@/app/app/i/expertise/components/EditSkillWindow';

const apiFetchMock = vi.fn();
const toastMock = vi.fn();
const routerPushMock = vi.fn();

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
});
