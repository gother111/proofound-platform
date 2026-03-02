import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CvImportWizard } from '@/components/expertise/cv-import/CvImportWizard';

const apiFetchMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();
const toastInfoMock = vi.fn();
const extractPdfTextFromFileMock = vi.fn();
const extractPdfTextWithOcrMock = vi.fn();
const isOcrClientEnabledMock = vi.fn();
const resolveOcrClientLimitsMock = vi.fn();
const normalizePdfParseErrorMock = vi.fn((error: unknown) =>
  error instanceof Error ? error.message : 'Failed to parse PDF'
);

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: any[]) => apiFetchMock(...args),
}));

vi.mock('sonner', () => ({
  toast: {
    success: (...args: any[]) => toastSuccessMock(...args),
    error: (...args: any[]) => toastErrorMock(...args),
    info: (...args: any[]) => toastInfoMock(...args),
  },
}));

vi.mock('@/lib/expertise/pdf-client-extractor', () => ({
  extractPdfTextFromFile: (...args: any[]) => extractPdfTextFromFileMock(...args),
  normalizePdfParseError: (...args: any[]) => normalizePdfParseErrorMock(...args),
}));

vi.mock('@/lib/expertise/ocr-client', () => ({
  extractPdfTextWithOcr: (...args: any[]) => extractPdfTextWithOcrMock(...args),
  isOcrClientEnabled: (...args: any[]) => isOcrClientEnabledMock(...args),
  resolveOcrClientLimits: (...args: any[]) => resolveOcrClientLimitsMock(...args),
}));

describe('CvImportWizard', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    extractPdfTextFromFileMock.mockReset();
    extractPdfTextWithOcrMock.mockReset();
    isOcrClientEnabledMock.mockReset();
    resolveOcrClientLimitsMock.mockReset();
    normalizePdfParseErrorMock.mockReset();
    normalizePdfParseErrorMock.mockImplementation((error: unknown) =>
      error instanceof Error ? error.message : 'Failed to parse PDF'
    );
    isOcrClientEnabledMock.mockReturnValue(false);
    delete process.env.NEXT_PUBLIC_CV_IMPORT_CLIENT_FALLBACK_ENABLED;
    resolveOcrClientLimitsMock.mockReturnValue({
      maxPages: 4,
      maxFileSizeBytes: 5 * 1024 * 1024,
      pageTimeoutMs: 8000,
      totalTimeoutMs: 25000,
      renderScale: 2,
      language: 'eng',
    });
  });

  it('uploads and analyzes CV PDFs through wizard suggest route', async () => {
    apiFetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          documents: [
            {
              document_id: 'doc-1',
              file_name: 'cv.pdf',
              context: 'cv',
              work_experiences: [
                {
                  item_id: 'work-1',
                  title: 'Senior Engineer',
                  organization: 'Acme',
                  duration: '2021 - Present',
                  summary: 'Built React products.',
                  evidence_snippets: ['Senior Engineer at Acme'],
                  confidence: 0.8,
                },
              ],
              learning_experiences: [],
              volunteering: [],
              languages: [
                {
                  item_id: 'language-1',
                  language_code: 'en',
                  language_name: 'English',
                  level: 'C2',
                  evidence_snippets: ['English Native'],
                  confidence: 0.9,
                },
              ],
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

    render(<CvImportWizard />);

    const uploadInput = screen.getByTestId('cv-upload');
    const file = new File(['dummy'], 'cv.pdf', { type: 'application/pdf' });

    fireEvent.change(uploadInput, {
      target: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Analyze Uploaded PDFs/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Analyze Uploaded PDFs/i }));

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/api/expertise/cv-import/wizard-suggest?engine=gemini',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      );
    });

    expect(screen.getByRole('button', { name: /1\. Work Experiences/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Senior Engineer')).toBeInTheDocument();
  });

  it('uses ASCII-safe multipart document IDs for non-ASCII filenames', async () => {
    apiFetchMock.mockImplementationOnce(async (_url: string, init?: RequestInit) => {
      const formData = init?.body as FormData;
      const requestDocumentId = String(formData.getAll('document_ids')[0] || 'doc-1');

      return new Response(
        JSON.stringify({
          documents: [
            {
              document_id: requestDocumentId,
              file_name: 'CV_Äндрей.pdf',
              context: 'cv',
              parsed_text: 'React',
              parse_error: null,
              parse_error_code: null,
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
      );
    });

    render(<CvImportWizard />);

    const uploadInput = screen.getByTestId('cv-upload');
    const file = new File(['dummy'], 'CV_Äндрей.pdf', { type: 'application/pdf' });

    fireEvent.change(uploadInput, {
      target: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Analyze Uploaded PDFs/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Analyze Uploaded PDFs/i }));

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledTimes(1);
    });

    const multipartBody = apiFetchMock.mock.calls[0]?.[1]?.body as FormData;
    const requestDocumentId = String(multipartBody.getAll('document_ids')[0] || '');
    expect(requestDocumentId).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(requestDocumentId).not.toContain('Ä');
    expect(requestDocumentId).not.toContain('ндрей');
  });

  it('shows staged progress and auto-collapses completion after 4 seconds', async () => {
    vi.useFakeTimers();
    try {
      let resolveRequest: ((value: Response) => void) | null = null;
      apiFetchMock.mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            resolveRequest = resolve;
          })
      );

      render(<CvImportWizard />);

      const uploadInput = screen.getByTestId('cv-upload');
      const file = new File(['dummy'], 'cv.pdf', { type: 'application/pdf' });

      fireEvent.change(uploadInput, {
        target: {
          files: [file],
        },
      });

      const analyzeButton = screen.getByRole('button', { name: /Analyze Uploaded PDFs/i });
      expect(analyzeButton).toBeEnabled();

      fireEvent.click(analyzeButton);

      expect(screen.getByText('Submitting files to extraction service...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25');

      expect(resolveRequest).toBeTruthy();
      await act(async () => {
        resolveRequest?.(
          new Response(
            JSON.stringify({
              documents: [
                {
                  document_id: 'doc-1',
                  file_name: 'cv.pdf',
                  context: 'cv',
                  parsed_text: 'React TypeScript',
                  parse_error: null,
                  parse_error_code: null,
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

  it('applies approved wizard selections via wizard-apply route', async () => {
    apiFetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            documents: [
              {
                document_id: 'doc-1',
                file_name: 'cv.pdf',
                context: 'cv',
                work_experiences: [],
                learning_experiences: [],
                volunteering: [],
                languages: [],
                skill_candidates: [
                  {
                    candidate_id: 'candidate-1',
                    raw_skill_text: 'React',
                    category: 'technical',
                    evidence_snippets: ['Built React products'],
                    confidence: 0.88,
                    suggestions: [
                      {
                        skill_id: 'skill_react',
                        skill_name: 'React',
                        match_method: 'exact',
                        score: 0.99,
                      },
                    ],
                    unmapped_candidate: false,
                  },
                ],
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
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            imported_counts: {
              skills: 1,
              work_experiences: 0,
              learning_experiences: 0,
              volunteering: 0,
              languages: 0,
            },
            skipped_counts: {
              skills: 0,
              work_experiences: 0,
              learning_experiences: 0,
              volunteering: 0,
              languages: 0,
            },
            warnings: [],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );

    render(<CvImportWizard />);

    const uploadInput = screen.getByTestId('cv-upload');
    const file = new File(['dummy'], 'cv.pdf', { type: 'application/pdf' });

    fireEvent.change(uploadInput, {
      target: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Analyze Uploaded PDFs/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Analyze Uploaded PDFs/i }));

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/api/expertise/cv-import/wizard-suggest?engine=gemini',
        expect.objectContaining({ method: 'POST' })
      );
    });

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Apply Approved \(1\) to Profile/i })
      ).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Apply Approved \(1\) to Profile/i }));

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/api/expertise/cv-import/wizard-apply',
        expect.objectContaining({ method: 'POST' })
      );
    });

    const applyCall = apiFetchMock.mock.calls.find(
      ([url]) => url === '/api/expertise/cv-import/wizard-apply'
    );

    expect(applyCall).toBeDefined();

    const requestPayload = JSON.parse(String(applyCall?.[1]?.body || '{}'));
    expect(requestPayload.documents).toHaveLength(1);
    expect(requestPayload.documents[0].skill_ids).toContain('skill_react');
  });

  it('shows partial-success info when skill suggestions are unavailable but extraction succeeds', async () => {
    apiFetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          documents: [
            {
              document_id: 'doc-1',
              file_name: 'cv.pdf',
              context: 'cv',
              work_experiences: [
                {
                  item_id: 'work-1',
                  title: 'Senior Engineer',
                  organization: 'Acme',
                  duration: '2021 - Present',
                  summary: 'Built React products.',
                  evidence_snippets: ['Senior Engineer at Acme'],
                  confidence: 0.8,
                },
              ],
              learning_experiences: [],
              volunteering: [],
              languages: [],
              skill_candidates: [],
            },
          ],
          metadata: {
            semantic_used: false,
            semantic_fallback_triggered: true,
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

    render(<CvImportWizard />);

    const uploadInput = screen.getByTestId('cv-upload');
    const file = new File(['dummy'], 'cv.pdf', { type: 'application/pdf' });

    fireEvent.change(uploadInput, {
      target: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Analyze Uploaded PDFs/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Analyze Uploaded PDFs/i }));

    await waitFor(() => {
      expect(toastInfoMock).toHaveBeenCalledWith(
        'Skill suggestions are temporarily unavailable, but core CV entities were extracted.'
      );
    });
  });

  it('shows detailed backend message when wizard suggest returns generic wrapper error', async () => {
    apiFetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: 'Failed to process CV wizard suggestions',
          message:
            'CV wizard dependencies are temporarily unavailable. Please retry in a few minutes.',
          code: 'WIZARD_DEPENDENCY_UNAVAILABLE',
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );

    render(<CvImportWizard />);

    const uploadInput = screen.getByTestId('cv-upload');
    const file = new File(['dummy'], 'cv.pdf', { type: 'application/pdf' });

    fireEvent.change(uploadInput, {
      target: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Analyze Uploaded PDFs/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Analyze Uploaded PDFs/i }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        'CV wizard dependencies are temporarily unavailable. Please retry in a few minutes.'
      );
    });
  });

  it('retries with gemini json engine when multipart proxy path is unavailable', async () => {
    extractPdfTextFromFileMock.mockResolvedValueOnce('React TypeScript');
    apiFetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: 'Failed to process CV wizard suggestions',
            message: 'Python CV service route is unavailable. Falling back is recommended.',
            code: 'CV_IMPORT_PROXY_UNAVAILABLE',
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            documents: [
              {
                document_id: 'doc-1',
                file_name: 'cv.pdf',
                context: 'cv',
                parsed_text: 'React TypeScript',
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

    render(<CvImportWizard />);

    const uploadInput = screen.getByTestId('cv-upload');
    const file = new File(['dummy'], 'cv.pdf', { type: 'application/pdf' });

    fireEvent.change(uploadInput, {
      target: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Analyze Uploaded PDFs/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Analyze Uploaded PDFs/i }));

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledTimes(2);
    });

    expect(extractPdfTextFromFileMock).toHaveBeenCalledTimes(1);
    expect(apiFetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/expertise/cv-import/wizard-suggest?engine=gemini',
      expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData),
      })
    );

    expect(apiFetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/expertise/cv-import/wizard-suggest?engine=gemini',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const multipartBody = apiFetchMock.mock.calls[0]?.[1]?.body as FormData;
    const requestDocumentId = String(multipartBody.getAll('document_ids')[0] || '');
    const retryPayload = JSON.parse(String(apiFetchMock.mock.calls[1]?.[1]?.body || '{}'));
    expect(requestDocumentId).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(retryPayload.documents[0].document_id).toBe(requestDocumentId);
    expect(retryPayload.documents[0].file_name).toBe('cv.pdf');
    expect(retryPayload.documents[0].context).toBe('cv');
    expect(retryPayload.documents[0].text).toBe('React TypeScript');
    expect(screen.getByText('Extracted text preview')).toBeInTheDocument();
  });

  it('auto-retries with gemini json payload on multipart metadata parse failures even when client fallback flag is false', async () => {
    process.env.NEXT_PUBLIC_CV_IMPORT_CLIENT_FALLBACK_ENABLED = 'false';
    extractPdfTextFromFileMock.mockResolvedValueOnce('React TypeScript');
    apiFetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error:
              'Upload metadata contains unsupported characters. Please rename the PDF and retry.',
            code: 'CV_IMPORT_MULTIPART_METADATA_INVALID',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            documents: [
              {
                document_id: 'doc-1',
                file_name: 'cv.pdf',
                context: 'cv',
                parsed_text: 'React TypeScript',
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

    render(<CvImportWizard />);

    const uploadInput = screen.getByTestId('cv-upload');
    const file = new File(['dummy'], 'cv.pdf', { type: 'application/pdf' });

    fireEvent.change(uploadInput, {
      target: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Analyze Uploaded PDFs/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Analyze Uploaded PDFs/i }));

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledTimes(2);
    });

    const multipartBody = apiFetchMock.mock.calls[0]?.[1]?.body as FormData;
    const requestDocumentId = String(multipartBody.getAll('document_ids')[0] || '');
    const retryPayload = JSON.parse(String(apiFetchMock.mock.calls[1]?.[1]?.body || '{}'));
    expect(requestDocumentId).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(retryPayload.documents[0].document_id).toBe(requestDocumentId);
    expect(retryPayload.documents[0].file_name).toBe('cv.pdf');
    expect(retryPayload.documents[0].context).toBe('cv');
    expect(retryPayload.documents[0].text).toBe('React TypeScript');
    expect(toastErrorMock).not.toHaveBeenCalledWith(
      'Upload metadata contains unsupported characters. Please rename the PDF and retry.'
    );
    delete process.env.NEXT_PUBLIC_CV_IMPORT_CLIENT_FALLBACK_ENABLED;
  });

  it('auto-retries with deterministic fallback when wizard request times out', async () => {
    extractPdfTextFromFileMock.mockResolvedValueOnce('React TypeScript');
    apiFetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: 'CV wizard processing timed out',
            message: 'Try fewer documents or shorter CV content.',
            code: 'CV_IMPORT_WIZARD_TIMEOUT',
          }),
          {
            status: 408,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            documents: [
              {
                document_id: 'doc-1',
                file_name: 'cv.pdf',
                context: 'cv',
                parsed_text: 'React TypeScript',
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

    render(<CvImportWizard />);

    const uploadInput = screen.getByTestId('cv-upload');
    const file = new File(['dummy'], 'cv.pdf', { type: 'application/pdf' });

    fireEvent.change(uploadInput, {
      target: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Analyze Uploaded PDFs/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Analyze Uploaded PDFs/i }));

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledTimes(2);
    });

    expect(apiFetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/expertise/cv-import/wizard-suggest?engine=gemini',
      expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData),
      })
    );
    expect(apiFetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/expertise/cv-import/wizard-suggest?engine=typescript',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const multipartBody = apiFetchMock.mock.calls[0]?.[1]?.body as FormData;
    const requestDocumentId = String(multipartBody.getAll('document_ids')[0] || '');
    const retryPayload = JSON.parse(String(apiFetchMock.mock.calls[1]?.[1]?.body || '{}'));
    expect(retryPayload.documents[0].document_id).toBe(requestDocumentId);
    expect(retryPayload.documents[0].file_name).toBe('cv.pdf');
    expect(retryPayload.documents[0].context).toBe('cv');
    expect(retryPayload.documents[0].text).toBe('React TypeScript');
    expect(toastErrorMock).not.toHaveBeenCalledWith('CV wizard processing timed out');
    expect(toastInfoMock).not.toHaveBeenCalledWith('CV analysis recovered via fallback path.');
  });

  it('retries with typescript engine when gemini json retry also fails', async () => {
    extractPdfTextFromFileMock.mockResolvedValueOnce('React TypeScript');
    apiFetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: 'Failed to process CV wizard suggestions',
            message: 'Python CV service timed out. Falling back is recommended.',
            code: 'CV_IMPORT_PROXY_TIMEOUT',
          }),
          {
            status: 504,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: 'Failed to process CV wizard suggestions',
            message: 'Python CV service timed out. Falling back is recommended.',
            code: 'CV_IMPORT_PROXY_TIMEOUT',
          }),
          {
            status: 504,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            documents: [
              {
                document_id: 'doc-1',
                file_name: 'cv.pdf',
                context: 'cv',
                parsed_text: 'React TypeScript',
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

    render(<CvImportWizard />);

    const uploadInput = screen.getByTestId('cv-upload');
    const file = new File(['dummy'], 'cv.pdf', { type: 'application/pdf' });

    fireEvent.change(uploadInput, {
      target: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Analyze Uploaded PDFs/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Analyze Uploaded PDFs/i }));

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledTimes(3);
    });

    expect(extractPdfTextFromFileMock).toHaveBeenCalledTimes(1);
    expect(apiFetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/expertise/cv-import/wizard-suggest?engine=gemini',
      expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData),
      })
    );

    expect(apiFetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/expertise/cv-import/wizard-suggest?engine=gemini',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );

    expect(apiFetchMock).toHaveBeenNthCalledWith(
      3,
      '/api/expertise/cv-import/wizard-suggest?engine=typescript',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const multipartBody = apiFetchMock.mock.calls[0]?.[1]?.body as FormData;
    const requestDocumentId = String(multipartBody.getAll('document_ids')[0] || '');
    const retryPayload = JSON.parse(String(apiFetchMock.mock.calls[2]?.[1]?.body || '{}'));
    expect(requestDocumentId).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(retryPayload.documents[0].document_id).toBe(requestDocumentId);
    expect(retryPayload.documents[0].file_name).toBe('cv.pdf');
    expect(retryPayload.documents[0].context).toBe('cv');
    expect(retryPayload.documents[0].text).toBe('React TypeScript');
    expect(screen.getByText('Extracted text preview')).toBeInTheDocument();
  });

  it('shows friendly parser message when fallback extraction cannot initialize parser', async () => {
    extractPdfTextFromFileMock.mockRejectedValueOnce(new Error('PDF parser initialization failed'));
    normalizePdfParseErrorMock.mockReturnValueOnce(
      'PDF parser could not start. Please refresh and re-upload the file.'
    );
    apiFetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: 'Failed to process CV wizard suggestions',
          message: 'Python CV service route is unavailable. Falling back is recommended.',
          code: 'CV_IMPORT_PROXY_UNAVAILABLE',
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );

    render(<CvImportWizard />);

    const uploadInput = screen.getByTestId('cv-upload');
    const file = new File(['dummy'], 'cv.pdf', { type: 'application/pdf' });

    fireEvent.change(uploadInput, {
      target: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Analyze Uploaded PDFs/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Analyze Uploaded PDFs/i }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        'PDF parser could not start. Please refresh and re-upload the file.'
      );
    });

    expect(apiFetchMock).toHaveBeenCalledTimes(1);
  });

  it('runs OCR retry for PDF_EMPTY_TEXT documents when OCR is enabled', async () => {
    isOcrClientEnabledMock.mockReturnValue(true);
    extractPdfTextWithOcrMock.mockResolvedValueOnce({
      text: 'OCR extracted text',
      pagesProcessed: 1,
    });

    apiFetchMock
      .mockImplementationOnce(async (_url: string, init?: RequestInit) => {
        const formData = init?.body as FormData;
        const requestDocumentId = String(formData.getAll('document_ids')[0] || 'doc-1');

        return new Response(
          JSON.stringify({
            documents: [
              {
                document_id: requestDocumentId,
                file_name: 'cv-scan.pdf',
                context: 'cv',
                parsed_text: '',
                parse_error: 'No extractable text found in document.',
                parse_error_code: 'PDF_EMPTY_TEXT',
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
        );
      })
      .mockImplementationOnce(async (_url: string, init?: RequestInit) => {
        const parsed = JSON.parse(String(init?.body || '{}')) as {
          documents?: Array<{ document_id?: string }>;
        };
        const requestDocumentId = parsed.documents?.[0]?.document_id || 'doc-1';

        return new Response(
          JSON.stringify({
            documents: [
              {
                document_id: requestDocumentId,
                file_name: 'cv-scan.pdf',
                context: 'cv',
                parsed_text: 'OCR extracted text',
                parse_error: null,
                parse_error_code: null,
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
        );
      });

    render(<CvImportWizard />);

    const uploadInput = screen.getByTestId('cv-upload');
    const file = new File(['dummy'], 'cv-scan.pdf', { type: 'application/pdf' });

    fireEvent.change(uploadInput, {
      target: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Analyze Uploaded PDFs/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Analyze Uploaded PDFs/i }));

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledTimes(2);
    });

    expect(apiFetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/expertise/cv-import/wizard-suggest?engine=gemini',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
    expect(extractPdfTextWithOcrMock).toHaveBeenCalledTimes(1);
    expect(toastSuccessMock).toHaveBeenCalledWith(
      'OCR fallback extracted text from scanned PDF documents.'
    );

    const retryPayload = JSON.parse(String(apiFetchMock.mock.calls[1]?.[1]?.body || '{}'));
    expect(retryPayload.documents).toEqual([
      expect.objectContaining({
        file_name: 'cv-scan.pdf',
        context: 'cv',
        text: 'OCR extracted text',
      }),
    ]);
  });

  it('shows OCR failure guidance when OCR cannot recover scanned PDFs', async () => {
    isOcrClientEnabledMock.mockReturnValue(true);
    extractPdfTextWithOcrMock.mockRejectedValueOnce(new Error('OCR timeout'));

    apiFetchMock.mockImplementationOnce(async (_url: string, init?: RequestInit) => {
      const formData = init?.body as FormData;
      const requestDocumentId = String(formData.getAll('document_ids')[0] || 'doc-1');

      return new Response(
        JSON.stringify({
          documents: [
            {
              document_id: requestDocumentId,
              file_name: 'cv-scan.pdf',
              context: 'cv',
              parsed_text: '',
              parse_error: 'No extractable text found in document.',
              parse_error_code: 'PDF_EMPTY_TEXT',
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
      );
    });

    render(<CvImportWizard />);

    const uploadInput = screen.getByTestId('cv-upload');
    const file = new File(['dummy'], 'cv-scan.pdf', { type: 'application/pdf' });

    fireEvent.change(uploadInput, {
      target: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Analyze Uploaded PDFs/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Analyze Uploaded PDFs/i }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        'OCR fallback could not extract readable text. Upload a better text-based PDF.'
      );
    });

    expect(apiFetchMock).toHaveBeenCalledTimes(1);
    expect(extractPdfTextWithOcrMock).toHaveBeenCalledTimes(1);
  });

  it('renders backend parse_error message when server-side parser fails for a document', async () => {
    apiFetchMock.mockImplementationOnce(async (_url: string, init?: RequestInit) => {
      const formData = init?.body as FormData;
      const requestDocumentId = String(formData.getAll('document_ids')[0] || 'doc-1');

      return new Response(
        JSON.stringify({
          documents: [
            {
              document_id: requestDocumentId,
              file_name: 'cv-init-error.pdf',
              context: 'cv',
              parsed_text: '',
              parse_error: 'PDF parser could not start. Please refresh and re-upload the file.',
              parse_error_code: 'PDF_EMPTY_TEXT',
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
      );
    });

    render(<CvImportWizard />);

    const uploadInput = screen.getByTestId('cv-upload');
    const file = new File(['dummy'], 'cv-init-error.pdf', { type: 'application/pdf' });

    fireEvent.change(uploadInput, {
      target: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Analyze Uploaded PDFs/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Analyze Uploaded PDFs/i }));

    await waitFor(() => {
      expect(
        screen.getByText('PDF parser could not start. Please refresh and re-upload the file.')
      ).toBeInTheDocument();
    });
  });
});
