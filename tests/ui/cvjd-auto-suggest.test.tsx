import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('CVJDAutoSuggest', () => {
  const originalFlag = process.env.NEXT_PUBLIC_CV_IMPORT_V2;

  beforeEach(() => {
    vi.useRealTimers();
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
    let requestDocumentIds: string[] = [];
    let requestFileNames: string[] = [];

    apiFetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url === '/api/expertise/cv-import/wizard-extract') {
        const formData = init?.body as FormData;
        requestDocumentIds = formData
          .getAll('document_ids')
          .map((value) => String(value))
          .filter(Boolean);
        requestFileNames = formData
          .getAll('files')
          .map((value) => (value instanceof File ? value.name : 'cv.pdf'));
        return jsonResponse({ job_id: 'job-1', status: 'queued', poll_after_ms: 1 }, 202);
      }

      if (url.startsWith('/api/expertise/cv-import/wizard-extract/status')) {
        return jsonResponse({
          job_id: 'job-1',
          status: 'completed',
          documents: requestDocumentIds.map((documentId, index) => ({
            document_id: documentId,
            file_name: requestFileNames[index] ?? `cv-${index + 1}.pdf`,
            text: 'React TypeScript',
            context: 'cv',
          })),
          failed_documents: [],
        });
      }

      if (url === '/api/expertise/cv-import/wizard-suggest?engine=gemini') {
        return jsonResponse({
          documents: requestDocumentIds.map((documentId, index) => ({
            document_id: documentId,
            file_name: requestFileNames[index] ?? `cv-${index + 1}.pdf`,
            context: 'cv',
            parsed_text: 'React TypeScript',
            parse_error: null,
            parse_error_code: null,
            work_experiences: [],
            learning_experiences: [],
            volunteering: [],
            languages: [],
            skill_candidates: [],
          })),
          metadata: {
            semantic_used: false,
            semantic_fallback_triggered: false,
            fallback_stage: 'none',
            candidate_only_fallback_triggered: false,
            unmapped_candidates_count: 0,
            limits: {
              max_documents: 5,
              max_chars_per_document: 30000,
              max_total_chars: 90000,
            },
          },
        });
      }

      if (url === '/api/analytics/track') {
        return jsonResponse({ ok: true });
      }

      if (String(url).startsWith('/api/expertise/taxonomy')) {
        return jsonResponse({ l4_skills: [] });
      }

      throw new Error(`Unexpected apiFetch call: ${url}`);
    });

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
        '/api/expertise/cv-import/wizard-extract',
        expect.objectContaining({ method: 'POST', body: expect.any(FormData) })
      );
    });

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/api/expertise/cv-import/wizard-suggest?engine=gemini',
        expect.objectContaining({ method: 'POST' })
      );
    });

    const extractCall = apiFetchMock.mock.calls.find(
      ([url]) => url === '/api/expertise/cv-import/wizard-extract'
    );
    expect(extractCall).toBeDefined();
    const body = extractCall?.[1]?.body;
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

  it('keeps fuzzy suggestions unapproved until manually selected', async () => {
    apiFetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          documents: [
            {
              document_id: 'jd-1',
              file_name: 'job-description.txt',
              context: 'jd',
              candidate_count: 1,
              candidates: [
                {
                  candidate_id: 'candidate-1',
                  raw_skill_text: 'react-like frontend framework',
                  category: 'technical',
                  evidence_snippets: ['react-like frontend framework'],
                  confidence: 0.93,
                  suggestions: [
                    {
                      skill_id: 'skill_react',
                      skill_name: 'React',
                      match_method: 'fuzzy',
                      score: 0.97,
                    },
                  ],
                  unmapped_candidate: true,
                },
              ],
            },
          ],
          metadata: {
            semantic_used: false,
            semantic_fallback_triggered: false,
            unmapped_candidates_count: 1,
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

    const textInput = screen.getByTestId('context-text-input');
    fireEvent.change(textInput, {
      target: { value: 'Need react-like frontend framework experience.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /analyze text/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Approved \(0\) to Profile/i })).toBeDisabled();
    });

    expect(screen.getByText('0/1 selected')).toBeInTheDocument();
  });

  it('requires confirmation before applying weak semantic matches in text mode', async () => {
    apiFetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          documents: [
            {
              document_id: 'jd-1',
              file_name: 'job-description.txt',
              context: 'jd',
              candidate_count: 1,
              candidates: [
                {
                  candidate_id: 'candidate-1',
                  raw_skill_text: 'platform concept',
                  category: 'technical',
                  evidence_snippets: ['platform concept workstream across teams'],
                  confidence: 0.84,
                  suggestions: [
                    {
                      skill_id: 'skill_kubernetes',
                      skill_name: 'Kubernetes',
                      match_method: 'semantic',
                      score: 0.85,
                    },
                  ],
                  unmapped_candidate: false,
                },
              ],
            },
          ],
          metadata: {
            semantic_used: true,
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

    const textInput = screen.getByTestId('context-text-input');
    fireEvent.change(textInput, {
      target: { value: 'Need platform concept alignment for distributed teams.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /analyze text/i }));

    await waitFor(() => {
      expect(screen.getByText('platform concept')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Accept' })[0]);
    expect(
      screen.getByText('This match is low-confidence. Confirm before applying.')
    ).toBeInTheDocument();
    expect(screen.getAllByText('Kubernetes').length).toBeGreaterThan(0);
    expect(
      screen.getByText('Evidence: platform concept workstream across teams')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm selection' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Approved \(1\) to Profile/i })).toBeEnabled();
    });
  });

  it('reruns atlas verification automatically when a text candidate is edited', async () => {
    apiFetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            documents: [
              {
                document_id: 'jd-1',
                file_name: 'job-description.txt',
                context: 'jd',
                candidate_count: 1,
                candidates: [
                  {
                    candidate_id: 'candidate-edit',
                    raw_skill_text: 'server runtime',
                    category: 'technical',
                    evidence_snippets: ['Node.js backend services'],
                    confidence: 0.7,
                    suggestions: [],
                    unmapped_candidate: true,
                  },
                ],
              },
            ],
            metadata: {
              semantic_used: false,
              semantic_fallback_triggered: false,
              unmapped_candidates_count: 1,
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
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            l4_skills: [
              {
                code: 'skill_nodejs',
                nameI18n: { en: 'Node.js' },
                matchMethod: 'exact',
                matchScore: 0.99,
              },
            ],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );

    render(<CVJDAutoSuggest />);

    fireEvent.click(screen.getByRole('button', { name: /job description/i }));
    fireEvent.change(screen.getByTestId('context-text-input'), {
      target: { value: 'Need backend runtime ownership.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /analyze text/i }));

    await waitFor(() => {
      expect(screen.getByText('server runtime')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Edit skill text\/category/i }));
    fireEvent.change(screen.getByDisplayValue('server runtime'), {
      target: { value: 'Node.js' },
    });

    await waitFor(
      () => {
        expect(
          apiFetchMock.mock.calls.some(
            ([url]) =>
              typeof url === 'string' &&
              url.startsWith('/api/expertise/taxonomy?') &&
              url.includes('context=cv_import') &&
              url.includes('search=Node.js')
          )
        ).toBe(true);
      },
      { timeout: 1500 }
    );

    await waitFor(() => {
      expect(screen.getByText('0 remaining · 1 ready · 0 already in profile')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Add Approved \(1\) to Profile/i })).toBeEnabled();
  });

  it('shows staged progress and auto-collapses completion for text analysis', async () => {
    vi.useFakeTimers();
    try {
      let resolveRequest: ((value: Response) => void) | null = null;
      apiFetchMock.mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            resolveRequest = resolve;
          })
      );

      render(<CVJDAutoSuggest />);

      fireEvent.click(screen.getByRole('button', { name: /job description/i }));

      const textInput = screen.getByTestId('context-text-input');
      fireEvent.change(textInput, {
        target: { value: 'Need React TypeScript and stakeholder communication skills.' },
      });

      fireEvent.click(screen.getByRole('button', { name: /analyze text/i }));

      expect(screen.getByText('Submitting text to extraction service...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '35');

      expect(resolveRequest).toBeTruthy();
      await act(async () => {
        resolveRequest?.(
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
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(
        screen.getByText('Extraction completed. Review and approve the results below.')
      ).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');

      await act(async () => {
        vi.advanceTimersByTime(4000);
        await Promise.resolve();
      });

      expect(
        screen.queryByText('Extraction completed. Review and approve the results below.')
      ).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
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
