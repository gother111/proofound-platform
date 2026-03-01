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
  const originalFlag = process.env.NEXT_PUBLIC_CV_IMPORT_V2;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.NEXT_PUBLIC_CV_IMPORT_V2;
  });

  afterEach(() => {
    if (originalFlag === undefined) {
      delete process.env.NEXT_PUBLIC_CV_IMPORT_V2;
    } else {
      process.env.NEXT_PUBLIC_CV_IMPORT_V2 = originalFlag;
    }
  });

  it('renders the new PDF import workflow by default', () => {
    render(<CVJDAutoSuggest />);

    expect(screen.getByText('CV Skills Import (PDF, Privacy-first)')).toBeInTheDocument();
    expect(screen.getByTestId('cv-upload')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Analyze Uploaded PDFs/i })).toBeInTheDocument();
  });

  it('renders legacy textarea workflow when v2 flag is disabled', () => {
    process.env.NEXT_PUBLIC_CV_IMPORT_V2 = 'false';

    render(<CVJDAutoSuggest />);

    expect(screen.getByText('Legacy Import (Rollback Mode)')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/paste your cv, resume, or job description/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Analyze & Suggest Skills/i })).toBeInTheDocument();
  });

  it('uploads multiple PDFs and sends structured wizard payload for CV analysis', async () => {
    apiFetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          documents: [
            {
              document_id: 'doc-1',
              file_name: 'cv-1.pdf',
              context: 'cv',
              work_experiences: [],
              learning_experiences: [],
              volunteering: [],
              languages: [],
              skill_candidates: [],
            },
            {
              document_id: 'doc-2',
              file_name: 'cv-2.pdf',
              context: 'cv',
              work_experiences: [],
              learning_experiences: [],
              volunteering: [],
              languages: [],
              skill_candidates: [],
            },
          ],
          metadata: {
            semantic_used: false,
            semantic_fallback_triggered: false,
            unmapped_candidates_count: 0,
            limits: {
              max_documents: 5,
              max_chars_per_document: 30000,
              max_total_chars: 90000,
            },
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );

    render(<CVJDAutoSuggest />);

    const uploadInput = screen.getByTestId('cv-upload');
    const fileOne = new File(['dummy-one'], 'cv-1.pdf', { type: 'application/pdf' });
    const fileTwo = new File(['dummy-two'], 'cv-2.pdf', { type: 'application/pdf' });

    fireEvent.change(uploadInput, {
      target: {
        files: [fileOne, fileTwo],
      },
    });

    const analyzeButton = screen.getByRole('button', { name: /Analyze Uploaded PDFs/i });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/api/expertise/cv-import/wizard-suggest?engine=gemini',
        expect.objectContaining({ method: 'POST' })
      );
    });

    const suggestCall = apiFetchMock.mock.calls.find(
      ([url]) => url === '/api/expertise/cv-import/wizard-suggest?engine=gemini'
    );
    expect(suggestCall).toBeDefined();
    const body = suggestCall?.[1]?.body;
    expect(body).toBeInstanceOf(FormData);
    const formData = body as FormData;
    expect(formData.getAll('files')).toHaveLength(2);
    expect(formData.getAll('document_ids')).toHaveLength(2);
  });

  it('analyzes pasted job-description text via cv-import engine', async () => {
    apiFetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          documents: [
            {
              document_id: 'jd-1',
              file_name: 'job-description.txt',
              context: 'jd',
              candidate_count: 0,
              candidates: [],
            },
          ],
          metadata: {
            semantic_used: false,
            semantic_fallback_triggered: false,
            unmapped_candidates_count: 0,
            limits: {
              max_documents: 5,
              max_chars_per_document: 30000,
              max_total_chars: 90000,
            },
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );

    render(<CVJDAutoSuggest />);

    fireEvent.click(screen.getByRole('button', { name: /job description/i }));

    expect(screen.queryByTestId('cv-upload')).not.toBeInTheDocument();
    const textInput = screen.getByTestId('context-text-input');
    fireEvent.change(textInput, {
      target: { value: 'Need React TypeScript and stakeholder communication skills.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /analyze text/i }));

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/api/expertise/cv-import/suggest?engine=gemini',
        expect.objectContaining({ method: 'POST' })
      );
    });

    const suggestCall = apiFetchMock.mock.calls.find(
      ([url]) => url === '/api/expertise/cv-import/suggest?engine=gemini'
    );
    expect(suggestCall).toBeDefined();

    const requestPayload = JSON.parse(String(suggestCall?.[1]?.body || '{}'));
    expect(requestPayload.documents).toHaveLength(1);
    expect(requestPayload.documents[0].context).toBe('jd');
    expect(requestPayload.documents[0].text).toContain('React TypeScript');
  });

  it('analyzes pasted general text via cv-import engine', async () => {
    apiFetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          documents: [
            {
              document_id: 'general-1',
              file_name: 'general-text.txt',
              context: 'general',
              candidate_count: 0,
              candidates: [],
            },
          ],
          metadata: {
            semantic_used: false,
            semantic_fallback_triggered: false,
            unmapped_candidates_count: 0,
            limits: {
              max_documents: 5,
              max_chars_per_document: 30000,
              max_total_chars: 90000,
            },
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );

    render(<CVJDAutoSuggest />);

    fireEvent.click(screen.getByRole('button', { name: /general text/i }));

    const textInput = screen.getByTestId('context-text-input');
    fireEvent.change(textInput, {
      target: { value: 'Led a project with Docker, Kubernetes, and collaboration across teams.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /analyze text/i }));

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/api/expertise/cv-import/suggest?engine=gemini',
        expect.objectContaining({ method: 'POST' })
      );
    });

    const suggestCall = apiFetchMock.mock.calls.find(
      ([url]) => url === '/api/expertise/cv-import/suggest?engine=gemini'
    );
    expect(suggestCall).toBeDefined();

    const requestPayload = JSON.parse(String(suggestCall?.[1]?.body || '{}'));
    expect(requestPayload.documents).toHaveLength(1);
    expect(requestPayload.documents[0].context).toBe('general');
    expect(requestPayload.documents[0].text).toContain('Docker');
  });

  it('shows controlled error when cv-import analysis returns malformed payload', async () => {
    apiFetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          metadata: {
            semantic_used: true,
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );

    render(<CVJDAutoSuggest />);

    fireEvent.click(screen.getByRole('button', { name: /job description/i }));

    const textInput = screen.getByTestId('context-text-input');
    fireEvent.change(textInput, {
      target: { value: 'Need React TypeScript and communication skills.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /analyze text/i }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        'Invalid response format from CV analysis service'
      );
    });
  });
});
