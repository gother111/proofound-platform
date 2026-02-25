import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CVJDAutoSuggest } from '@/components/expertise/CVJDAutoSuggest';

const apiFetchMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastInfoMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: any[]) => apiFetchMock(...args),
}));

vi.mock('sonner', () => ({
  toast: {
    success: (...args: any[]) => toastSuccessMock(...args),
    info: (...args: any[]) => toastInfoMock(...args),
    error: (...args: any[]) => toastErrorMock(...args),
  },
}));

describe('CVJDAutoSuggest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses apiFetch for CV analysis POST and renders returned suggestions', async () => {
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        suggestions: [
          {
            id: 'react',
            code: 'react',
            name: 'React',
            aliases: ['ReactJS'],
            description: 'UI library',
            slug: 'react',
            tags: null,
            score: 2,
            confidence: 0.91,
          },
        ],
      }),
    });

    render(<CVJDAutoSuggest />);

    fireEvent.change(screen.getByPlaceholderText(/paste your cv, resume, or job description/i), {
      target: { value: 'Built React apps for enterprise products.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /analyze & suggest skills/i }));

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/api/expertise/auto-suggest',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    expect(await screen.findByText('Suggested Skills (1)')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('surfaces backend error messages when analysis fails', async () => {
    apiFetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'CSRF validation failed' }),
    });

    render(<CVJDAutoSuggest />);

    fireEvent.change(screen.getByPlaceholderText(/paste your cv, resume, or job description/i), {
      target: { value: 'Any text' },
    });
    fireEvent.click(screen.getByRole('button', { name: /analyze & suggest skills/i }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('CSRF validation failed');
    });
  });
});
