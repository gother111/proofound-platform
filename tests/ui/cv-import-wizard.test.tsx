import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CvImportWizard } from '@/components/expertise/cv-import/CvImportWizard';

const apiFetchMock = vi.fn();
const pdfGetDocumentMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();
const toastInfoMock = vi.fn();

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

vi.mock('pdfjs-dist/webpack.mjs', () => ({
  getDocument: (...args: any[]) => pdfGetDocumentMock(...args),
}));

describe('CvImportWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    pdfGetDocumentMock.mockReturnValue({
      promise: Promise.resolve({
        numPages: 1,
        getPage: async () => ({
          getTextContent: async () => ({
            items: [{ str: 'Experience\nSenior Engineer at Acme\nLanguages\nEnglish Native' }],
          }),
        }),
      }),
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
    Object.defineProperty(file, 'arrayBuffer', {
      value: async () => new TextEncoder().encode('dummy').buffer,
    });

    fireEvent.change(uploadInput, {
      target: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(pdfGetDocumentMock).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Analyze Uploaded PDFs/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Analyze Uploaded PDFs/i }));

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/api/expertise/cv-import/wizard-suggest',
        expect.objectContaining({ method: 'POST' })
      );
    });

    expect(screen.getByRole('button', { name: /1\. Work Experiences/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Senior Engineer')).toBeInTheDocument();
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
    Object.defineProperty(file, 'arrayBuffer', {
      value: async () => new TextEncoder().encode('dummy').buffer,
    });

    fireEvent.change(uploadInput, {
      target: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(pdfGetDocumentMock).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Analyze Uploaded PDFs/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Analyze Uploaded PDFs/i }));

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/api/expertise/cv-import/wizard-suggest',
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
});
