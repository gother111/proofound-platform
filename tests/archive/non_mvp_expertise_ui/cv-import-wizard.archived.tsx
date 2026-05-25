import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CvImportWizard } from '@/components/expertise/cv-import/CvImportWizard';

const apiFetchMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();
const toastInfoMock = vi.fn();

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
}));

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
    info: (...args: unknown[]) => toastInfoMock(...args),
  },
}));

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function buildAnalyzePayload(overrides?: Partial<Record<string, unknown>>) {
  return {
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
      fallback_stage: 'none',
      candidate_only_fallback_triggered: false,
      unmapped_candidates_count: 0,
      limits: {
        max_documents: 5,
        max_chars_per_document: 30000,
        max_total_chars: 90000,
      },
      ...(overrides?.metadata as Record<string, unknown> | undefined),
    },
    ...(overrides || {}),
  };
}

function remapAnalyzePayloadDocumentIds(payload: Record<string, unknown>, documentIds: string[]) {
  const documents = Array.isArray(payload.documents) ? payload.documents : [];
  return {
    ...payload,
    documents: documents.map((document, index) => ({
      ...(document as Record<string, unknown>),
      document_id: documentIds[index] ?? (document as Record<string, unknown>).document_id,
    })),
  };
}

function remapStatusResponseDocumentIds(
  response: Record<string, unknown>,
  documentIds: string[],
  fileNames: string[]
) {
  if (response.status !== 'completed') {
    return response;
  }

  const documents = Array.isArray(response.documents) ? response.documents : [];
  const failedDocuments = Array.isArray(response.failed_documents) ? response.failed_documents : [];

  return {
    ...response,
    documents: documents.map((document, index) => ({
      ...(document as Record<string, unknown>),
      document_id: documentIds[index] ?? (document as Record<string, unknown>).document_id,
      file_name: fileNames[index] ?? (document as Record<string, unknown>).file_name,
    })),
    failed_documents: failedDocuments.map((document, index) => ({
      ...(document as Record<string, unknown>),
      document_id: documentIds[index] ?? (document as Record<string, unknown>).document_id,
      file_name: fileNames[index] ?? (document as Record<string, unknown>).file_name,
    })),
  };
}

function installAsyncAnalyzeFlow(params?: {
  analyzePayload?: Record<string, unknown>;
  extractedDocuments?: Array<Record<string, unknown>>;
  failedDocuments?: Array<Record<string, unknown>>;
  statusResponses?: Array<Record<string, unknown>>;
  applyPayload?: Record<string, unknown>;
}) {
  const analyzePayload = params?.analyzePayload ?? buildAnalyzePayload();
  const statusResponses = params?.statusResponses ?? [
    {
      job_id: 'job-1',
      status: 'completed',
      documents: params?.extractedDocuments ?? [
        {
          document_id: 'doc-1',
          file_name: 'cv.pdf',
          text: 'React TypeScript',
          context: 'cv',
        },
      ],
      failed_documents: params?.failedDocuments ?? [],
    },
  ];
  let statusIndex = 0;
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
      const nextStatus = remapStatusResponseDocumentIds(
        statusResponses[Math.min(statusIndex, statusResponses.length - 1)],
        requestDocumentIds,
        requestFileNames
      );
      statusIndex += 1;
      return jsonResponse(nextStatus);
    }

    if (url === '/api/expertise/cv-import/wizard-suggest?engine=gemini') {
      return jsonResponse(remapAnalyzePayloadDocumentIds(analyzePayload, requestDocumentIds));
    }

    if (url === '/api/expertise/cv-import/wizard-suggest?engine=typescript') {
      return jsonResponse(remapAnalyzePayloadDocumentIds(analyzePayload, requestDocumentIds));
    }

    if (url === '/api/expertise/cv-import/wizard-apply') {
      return jsonResponse(
        params?.applyPayload ?? {
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
        }
      );
    }

    if (url === '/api/analytics/track') {
      return jsonResponse({ ok: true });
    }

    if (url.startsWith('/api/expertise/taxonomy')) {
      return jsonResponse({ l4_skills: [] });
    }

    throw new Error(`Unexpected apiFetch call: ${url} ${JSON.stringify(init || {})}`);
  });
}

async function uploadPdf(fileName = 'cv.pdf') {
  const uploadInput = screen.getByTestId('cv-upload');
  fireEvent.change(uploadInput, {
    target: {
      files: [new File(['dummy'], fileName, { type: 'application/pdf' })],
    },
  });

  await waitFor(() => {
    expect(screen.getByRole('button', { name: /Analyze Uploaded PDFs/i })).toBeEnabled();
  });
}

async function clickAnalyze() {
  fireEvent.click(screen.getByRole('button', { name: /Analyze Uploaded PDFs/i }));
}

describe('CvImportWizard', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    window.sessionStorage.clear();
  });

  it('uploads PDFs through the async extract route and then analyzes extracted text', async () => {
    installAsyncAnalyzeFlow({
      analyzePayload: buildAnalyzePayload({
        documents: [
          {
            document_id: 'doc-1',
            file_name: 'cv.pdf',
            context: 'cv',
            parsed_text: 'React TypeScript',
            parse_error: null,
            parse_error_code: null,
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
      }),
    });

    render(<CvImportWizard />);
    await uploadPdf();
    await clickAnalyze();

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/api/expertise/cv-import/wizard-extract',
        expect.objectContaining({ method: 'POST', body: expect.any(FormData) })
      );
    });

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/api/expertise/cv-import/wizard-suggest?engine=gemini',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    expect(screen.getByText('Skills to review')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Expand all sections/i }));
    expect(screen.getByDisplayValue('Senior Engineer')).toBeInTheDocument();
  });

  it('uses ASCII-safe document ids in the async extract upload payload', async () => {
    installAsyncAnalyzeFlow();

    render(<CvImportWizard />);
    await uploadPdf('CV_Äндрей.pdf');
    await clickAnalyze();

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/api/expertise/cv-import/wizard-extract',
        expect.any(Object)
      );
    });

    const formData = apiFetchMock.mock.calls.find(
      ([url]) => url === '/api/expertise/cv-import/wizard-extract'
    )?.[1]?.body as FormData;
    const requestDocumentId = String(formData.getAll('document_ids')[0] || '');
    expect(requestDocumentId).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(requestDocumentId).not.toContain('Ä');
    expect(requestDocumentId).not.toContain('ндрей');
  });

  it('shows upload progress and auto-collapses completion after 4 seconds', async () => {
    installAsyncAnalyzeFlow();

    render(<CvImportWizard />);
    await uploadPdf();
    await clickAnalyze();

    await waitFor(() => {
      expect(
        screen.getByText('CV analysis completed. Review and approve the results below.')
      ).toBeInTheDocument();
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 4200));
    });

    expect(
      screen.queryByText('CV analysis completed. Review and approve the results below.')
    ).not.toBeInTheDocument();
  }, 10000);

  it('applies approved wizard selections via wizard-apply route', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    try {
      installAsyncAnalyzeFlow({
        analyzePayload: buildAnalyzePayload({
          documents: [
            {
              document_id: 'doc-1',
              file_name: 'cv.pdf',
              context: 'cv',
              parsed_text: 'React',
              parse_error: null,
              parse_error_code: null,
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
        }),
      });

      render(<CvImportWizard />);
      await uploadPdf();
      await clickAnalyze();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Finish Review & Apply/i })).toBeEnabled();
      });

      fireEvent.click(screen.getByRole('button', { name: /Finish Review & Apply/i }));

      await waitFor(() => {
        expect(confirmSpy).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(apiFetchMock).toHaveBeenCalledWith(
          '/api/expertise/cv-import/wizard-apply',
          expect.objectContaining({ method: 'POST' })
        );
      });
    } finally {
      confirmSpy.mockRestore();
    }
  });

  it('does not preselect fuzzy-only matches by default', async () => {
    installAsyncAnalyzeFlow({
      analyzePayload: buildAnalyzePayload({
        documents: [
          {
            document_id: 'doc-1',
            file_name: 'cv.pdf',
            context: 'cv',
            parsed_text: 'React-ish frontend stack',
            parse_error: null,
            parse_error_code: null,
            work_experiences: [],
            learning_experiences: [],
            volunteering: [],
            languages: [],
            skill_candidates: [
              {
                candidate_id: 'candidate-1',
                raw_skill_text: 'React-ish frontend stack',
                category: 'technical',
                evidence_snippets: ['Built modern frontend stack'],
                confidence: 0.91,
                suggestions: [
                  {
                    skill_id: 'skill_react',
                    skill_name: 'React',
                    match_method: 'fuzzy',
                    score: 0.98,
                  },
                ],
                unmapped_candidate: true,
              },
            ],
          },
        ],
        metadata: {
          unmapped_candidates_count: 1,
        },
      }),
    });

    render(<CvImportWizard />);
    await uploadPdf();
    await clickAnalyze();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Finish Review & Apply/i })).toBeDisabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Matching details/i }));

    expect(screen.getAllByText('Needs mapping: 1').length).toBeGreaterThan(0);
  });

  it('shows the Python queue error instead of falling back locally when enqueue fails', async () => {
    apiFetchMock.mockImplementation(async (url: string) => {
      if (url === '/api/expertise/cv-import/wizard-extract') {
        return jsonResponse(
          {
            error: 'CV extraction queue unavailable',
            message: 'Background extraction is unavailable.',
            code: 'CV_IMPORT_EXTRACT_ENQUEUE_FAILED',
          },
          503
        );
      }

      throw new Error(`Unexpected apiFetch call: ${url}`);
    });

    render(<CvImportWizard />);
    await uploadPdf();
    await clickAnalyze();

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        'We could not prepare your CV for review. Please try again.'
      );
    });
  });

  it('automatically requeues Python extraction once after a retryable failure', async () => {
    let extractCalls = 0;
    apiFetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url === '/api/expertise/cv-import/wizard-extract') {
        extractCalls += 1;
        return jsonResponse(
          {
            job_id: `job-${extractCalls}`,
            status: 'queued',
            poll_after_ms: 1,
          },
          202
        );
      }

      if (url.startsWith('/api/expertise/cv-import/wizard-extract/status')) {
        if (url.includes('job-1')) {
          return jsonResponse({
            job_id: 'job-1',
            status: 'failed',
            error: 'Python extract unavailable',
            message: 'Python extract unavailable',
            code: 'CV_IMPORT_PROXY_UNAVAILABLE',
          });
        }

        return jsonResponse({
          job_id: 'job-2',
          status: 'completed',
          documents: [
            {
              document_id: 'doc-1',
              file_name: 'cv.pdf',
              text: 'React TypeScript',
              context: 'cv',
            },
          ],
          failed_documents: [],
        });
      }

      if (url === '/api/expertise/cv-import/wizard-suggest?engine=gemini') {
        return jsonResponse(buildAnalyzePayload());
      }

      if (url === '/api/analytics/track') {
        return jsonResponse({ ok: true });
      }

      if (url.startsWith('/api/expertise/taxonomy')) {
        return jsonResponse({ l4_skills: [] });
      }

      throw new Error(`Unexpected apiFetch call: ${url} ${JSON.stringify(init || {})}`);
    });

    render(<CvImportWizard />);
    await uploadPdf();
    await clickAnalyze();

    await waitFor(() => {
      expect(
        apiFetchMock.mock.calls.filter(([url]) => url === '/api/expertise/cv-import/wizard-extract')
      ).toHaveLength(2);
    });

    expect(toastInfoMock).toHaveBeenCalledWith(
      'CV analysis hit a temporary issue. Retrying automatically.'
    );

    await waitFor(() => {
      expect(
        screen.getByText('CV analysis completed. Review and approve the results below.')
      ).toBeInTheDocument();
    });
  });

  it('keeps polling Python extraction through queued and processing states until it completes', async () => {
    installAsyncAnalyzeFlow({
      statusResponses: [
        {
          job_id: 'job-1',
          status: 'queued',
          poll_after_ms: 1,
        },
        {
          job_id: 'job-1',
          status: 'queued',
          poll_after_ms: 1,
        },
        {
          job_id: 'job-1',
          status: 'processing',
          poll_after_ms: 1,
        },
        {
          job_id: 'job-1',
          status: 'completed',
          documents: [
            {
              document_id: 'doc-1',
              file_name: 'cv.pdf',
              text: 'React TypeScript',
              context: 'cv',
            },
          ],
          failed_documents: [],
        },
      ],
    });

    render(<CvImportWizard />);
    await uploadPdf();
    await clickAnalyze();

    await waitFor(() => {
      expect(
        apiFetchMock.mock.calls.filter(([url]) =>
          String(url).startsWith('/api/expertise/cv-import/wizard-extract/status')
        ).length
      ).toBeGreaterThanOrEqual(3);
    });

    await waitFor(() => {
      expect(
        screen.getByText('CV analysis completed. Review and approve the results below.')
      ).toBeInTheDocument();
    });
  });

  it('shows the Python extraction error when the async job fails permanently', async () => {
    apiFetchMock.mockImplementation(async (url: string) => {
      if (url === '/api/expertise/cv-import/wizard-extract') {
        return jsonResponse({ job_id: 'job-1', status: 'queued', poll_after_ms: 1 }, 202);
      }

      if (url.startsWith('/api/expertise/cv-import/wizard-extract/status')) {
        return jsonResponse({
          job_id: 'job-1',
          status: 'failed',
          error: 'Python extract unavailable',
          message: 'Python extract unavailable',
          code: 'CV_IMPORT_EXTRACT_FAILED',
        });
      }

      throw new Error(`Unexpected apiFetch call: ${url}`);
    });

    render(<CvImportWizard />);
    await uploadPdf();
    await clickAnalyze();

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('Python extract unavailable');
    });
    expect(screen.getByText('Python extract unavailable')).toBeInTheDocument();
  });

  it('resumes a queued extract job from sessionStorage after reload', async () => {
    window.sessionStorage.setItem(
      'cv-import-wizard-extract-job',
      JSON.stringify({
        jobId: 'job-1',
        fingerprint: 'doc-1:cv.pdf:0:0',
        documents: [{ requestId: 'doc-1', localId: 'doc-1', fileName: 'cv.pdf' }],
      })
    );

    installAsyncAnalyzeFlow();

    render(<CvImportWizard />);

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/api/expertise/cv-import/wizard-extract/status?job_id=job-1'
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Skills to review')).toBeInTheDocument();
    });
  });

  it('keeps a resumed queued job alive in the background until it completes', async () => {
    const dateNowSpy = vi.spyOn(Date, 'now');
    let now = 0;
    dateNowSpy.mockImplementation(() => {
      now += 6_000;
      return now;
    });
    try {
      window.sessionStorage.setItem(
        'cv-import-wizard-extract-job',
        JSON.stringify({
          jobId: 'job-1',
          fingerprint: 'doc-1:cv.pdf:0:0',
          documents: [{ requestId: 'doc-1', localId: 'doc-1', fileName: 'cv.pdf' }],
        })
      );

      installAsyncAnalyzeFlow({
        statusResponses: [
          {
            job_id: 'job-1',
            status: 'queued',
            poll_after_ms: 1,
          },
          {
            job_id: 'job-1',
            status: 'processing',
            poll_after_ms: 1,
          },
          {
            job_id: 'job-1',
            status: 'completed',
            documents: [
              {
                document_id: 'doc-1',
                file_name: 'cv.pdf',
                text: 'React TypeScript',
                context: 'cv',
              },
            ],
            failed_documents: [],
          },
        ],
      });

      render(<CvImportWizard />);

      await waitFor(() => {
        expect(toastInfoMock).toHaveBeenCalledWith(
          'We are still reading your CV. You can leave this page and return later.'
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Skills to review')).toBeInTheDocument();
      });
    } finally {
      dateNowSpy.mockRestore();
    }
  });
});
