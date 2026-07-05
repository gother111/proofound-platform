import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProofsSection } from '@/app/app/i/expertise/components/edit-skill/ProofsSection';

const apiFetchMock = vi.fn();
const routerPushMock = vi.fn();
const defaultOcrStatus = {
  visible: false,
  available: false,
  unavailableReason: null as string | null,
  limits: {
    maxFileSizeMb: 5,
    maxPages: 4,
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  },
};
let ocrStatus = defaultOcrStatus;

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
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

const baseProps = {
  loadingProofs: false,
  showAddProof: false,
  setShowAddProof: vi.fn(),
  newProof: {
    proofType: 'link' as const,
    title: '',
    description: '',
    url: '',
    filePath: '',
    uploadedFileId: '',
    issuedDate: '',
    expiresDate: '',
  },
  setNewProof: vi.fn(),
  addingProof: false,
  proofUploading: false,
  proofUploadError: null,
  proofUploadName: '',
  onProofFileSelected: vi.fn(),
  onAddProof: vi.fn(),
  onDeleteProof: vi.fn(),
};

describe('Proof Pack Assistant UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ocrStatus = defaultOcrStatus;
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input) === '/api/feature-flags') {
        return {
          ok: true,
          json: async () => ({ flags: { assistiveAiUi: true } }),
        } as Response;
      }
      if (String(input) === '/api/proof-artifacts/text-extraction/status') {
        return {
          ok: true,
          json: async () => ocrStatus,
        } as Response;
      }
      throw new Error(`Unexpected fetch call: ${String(input)}`);
    }) as any;
    apiFetchMock.mockResolvedValue(
      mockResponse({
        suggestionId: '33333333-3333-4333-8333-333333333333',
        missingContext: ['Add a measurable outcome if you can support it.'],
        suggestedRewrite: {
          title: 'Clearer launch proof',
          claimStatement: 'I shipped the launch proof pack.',
          ownershipStatement: 'I owned the release coordination.',
        },
        privacyFlags: ['1 filename redacted before suggestion.'],
        verificationSuggestions: ['Ask a non-self verifier to confirm the claim.'],
        warnings: ['Do not add facts that are not already supported.'],
      })
    );
  });

  it('shows Improve this proof and requires explicit accept and dismiss actions', async () => {
    render(
      <ProofsSection
        {...baseProps}
        proofs={[
          {
            id: 'proof-1',
            proof_type: 'link',
            title: 'Launch proof',
            description: 'Original draft',
            canonicalPackId: '11111111-1111-4111-8111-111111111111',
          },
        ]}
      />
    );

    expect(await screen.findByRole('button', { name: /improve this proof/i })).toBeInTheDocument();
    expect(
      screen.getByText(
        'AI suggestions are drafts. They do not verify, score, rank, or evaluate anyone.'
      )
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /improve this proof/i }));

    await screen.findByText('Draft assistance');
    expect(screen.getByLabelText('Title')).toHaveValue('Clearer launch proof');
    expect(screen.queryByText('Accepted')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Edited launch proof title' },
    });
    fireEvent.click(screen.getByRole('button', { name: /accept title/i }));

    await waitFor(() => expect(screen.getByText('Accepted')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /^dismiss$/i }));

    await waitFor(() => {
      expect(screen.queryByText('Suggested improvements')).not.toBeInTheDocument();
    });

    expect(apiFetchMock).toHaveBeenCalledWith(
      '/api/ai/suggestions/events',
      expect.objectContaining({
        method: 'POST',
        body: expect.not.stringContaining('Edited launch proof title'),
      })
    );
    expect(apiFetchMock).toHaveBeenCalledWith(
      '/api/ai/proof-pack/suggest',
      expect.objectContaining({ method: 'POST' })
    );
    expect(JSON.stringify(apiFetchMock.mock.calls)).not.toContain('PATCH');
    expect(JSON.stringify(apiFetchMock.mock.calls)).not.toContain('/proofs/proof-1');
  });

  it('renders Improve this proof from the client default before server flags resolve', () => {
    global.fetch = vi.fn(() => new Promise<Response>(() => {})) as any;

    render(
      <ProofsSection
        {...baseProps}
        proofs={[
          {
            id: 'proof-1',
            proof_type: 'link',
            title: 'Launch proof',
            canonicalPackId: '11111111-1111-4111-8111-111111111111',
          },
        ]}
      />
    );

    expect(screen.getByRole('button', { name: /improve this proof/i })).toBeInTheDocument();
  });

  it('hides the AI button when the assistive AI UI flag is disabled', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ flags: { assistiveAiUi: false } }),
    });

    render(
      <ProofsSection
        {...baseProps}
        proofs={[
          {
            id: 'proof-1',
            proof_type: 'link',
            title: 'Launch proof',
            canonicalPackId: '11111111-1111-4111-8111-111111111111',
          },
        ]}
      />
    );

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /improve this proof/i })).not.toBeInTheDocument();
    });
  });

  it('shows deterministic manual fallback when provider assistance is unavailable', async () => {
    apiFetchMock.mockResolvedValueOnce(
      mockResponse({
        fallback: true,
        missingContext: ['Add one clear claim about what this proof shows.'],
        suggestedRewrite: {
          title: 'Launch proof',
        },
        privacyFlags: [],
        verificationSuggestions: [],
        warnings: ['AI suggestions are temporarily unavailable; manual editing still works.'],
      })
    );

    render(
      <ProofsSection
        {...baseProps}
        proofs={[
          {
            id: 'proof-1',
            proof_type: 'link',
            title: 'Launch proof',
            canonicalPackId: '11111111-1111-4111-8111-111111111111',
          },
        ]}
      />
    );

    fireEvent.click(await screen.findByRole('button', { name: /improve this proof/i }));

    await screen.findByText('Manual clarity checklist');
    expect(
      screen.getByText('AI suggestions are temporarily unavailable; manual editing still works.')
    ).toBeInTheDocument();
  });

  it('shows the manual checklist when the assistant endpoint is safely disabled', async () => {
    apiFetchMock.mockResolvedValueOnce(
      mockResponse(
        {
          error: 'AI assist is disabled',
          code: 'ai_feature_kill_switch',
          fallbackAvailable: true,
        },
        503
      )
    );

    render(
      <ProofsSection
        {...baseProps}
        proofs={[
          {
            id: 'proof-1',
            proof_type: 'link',
            title: 'Launch proof',
            canonicalPackId: '11111111-1111-4111-8111-111111111111',
          },
        ]}
      />
    );

    fireEvent.click(await screen.findByRole('button', { name: /improve this proof/i }));

    await screen.findByText('Manual clarity checklist');
    expect(
      screen.getByText('AI suggestions are temporarily unavailable; manual editing still works.')
    ).toBeInTheDocument();
    expect(screen.queryByText(/AI assist is disabled/i)).not.toBeInTheDocument();
  });

  it('hides proof artifact OCR when the beta status is not visible', async () => {
    render(
      <ProofsSection
        {...baseProps}
        proofs={[
          {
            id: 'proof-1',
            proof_type: 'document',
            title: 'Launch proof document',
            file_path: 'private/document.pdf',
            canonicalPackId: '11111111-1111-4111-8111-111111111111',
            canonicalArtifactId: '22222222-2222-4222-8222-222222222222',
          },
        ]}
      />
    );

    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: /extract text from this proof document/i })
      ).not.toBeInTheDocument();
    });
  });

  it('requires explicit consent before making an OCR extraction call', async () => {
    ocrStatus = {
      ...ocrStatus,
      visible: true,
      available: true,
      unavailableReason: null,
    };
    apiFetchMock.mockResolvedValueOnce(
      mockResponse({
        requestId: 'proof_ocr_test',
        artifactId: '22222222-2222-4222-8222-222222222222',
        status: 'completed',
        draftOnly: true,
        provider: 'gcp_document_ai',
        pageCount: 1,
        confidence: 0.92,
        extractedTextPreview: 'Sanitized launch memo text',
        privacyRiskWarnings: [
          'Review the extracted text manually before copying it into a Proof Pack.',
        ],
        suggestedProofPackFieldsDraft: {
          evidenceSummary: 'Sanitized launch memo text',
        },
      })
    );

    render(
      <ProofsSection
        {...baseProps}
        proofs={[
          {
            id: 'proof-1',
            proof_type: 'document',
            title: 'Launch proof document',
            file_path: 'private/document.pdf',
            canonicalPackId: '11111111-1111-4111-8111-111111111111',
            canonicalArtifactId: '22222222-2222-4222-8222-222222222222',
          },
        ]}
      />
    );

    fireEvent.click(
      await screen.findByRole('button', { name: /extract text from this proof document/i })
    );

    expect(screen.getByText(/Google Cloud Document AI/i)).toBeInTheDocument();
    const runButton = screen.getByRole('button', { name: /run ocr/i });
    expect(runButton).toBeDisabled();
    expect(apiFetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining('/text-extraction'),
      expect.anything()
    );

    fireEvent.click(screen.getByLabelText(/I consent to process this proof document/i));
    fireEvent.click(screen.getByRole('button', { name: /run ocr/i }));

    await screen.findByText('Extracted text preview');
    expect(apiFetchMock).toHaveBeenCalledWith(
      '/api/proof-artifacts/22222222-2222-4222-8222-222222222222/text-extraction',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ consentToProcess: true }),
      })
    );
  });

  it('renders privacy warnings and does not copy OCR output until privacy confirmation', async () => {
    ocrStatus = {
      ...ocrStatus,
      visible: true,
      available: true,
      unavailableReason: null,
    };
    apiFetchMock
      .mockResolvedValueOnce(
        mockResponse({
          requestId: 'proof_ocr_test',
          artifactId: '22222222-2222-4222-8222-222222222222',
          status: 'completed',
          draftOnly: true,
          provider: 'gcp_document_ai',
          pageCount: 1,
          confidence: 0.92,
          extractedTextPreview: 'Sanitized launch memo text',
          privacyRiskWarnings: [
            'May contain email addresses.',
            'Review the extracted text manually before copying it into a Proof Pack.',
          ],
          suggestedProofPackFieldsDraft: {
            evidenceSummary: 'Sanitized launch memo text',
          },
        })
      )
      .mockResolvedValueOnce(
        mockResponse({
          ok: true,
          proofPackId: '11111111-1111-4111-8111-111111111111',
          artifactId: '22222222-2222-4222-8222-222222222222',
          appliedFields: ['evidenceSummary'],
          draftOnly: true,
        })
      );

    render(
      <ProofsSection
        {...baseProps}
        proofs={[
          {
            id: 'proof-1',
            proof_type: 'document',
            title: 'Launch proof document',
            file_path: 'private/document.pdf',
            canonicalPackId: '11111111-1111-4111-8111-111111111111',
            canonicalArtifactId: '22222222-2222-4222-8222-222222222222',
          },
        ]}
      />
    );

    fireEvent.click(
      await screen.findByRole('button', { name: /extract text from this proof document/i })
    );
    fireEvent.click(screen.getByLabelText(/I consent to process this proof document/i));
    fireEvent.click(screen.getByRole('button', { name: /run ocr/i }));

    await screen.findByText('Privacy warnings');
    expect(screen.getByText('Sanitized launch memo text')).toBeInTheDocument();
    expect(screen.getByText('May contain email addresses.')).toBeInTheDocument();

    const copyButton = screen.getByRole('button', { name: /copy to proof pack draft/i });
    expect(copyButton).toBeDisabled();
    expect(apiFetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining('/text-extraction/apply'),
      expect.anything()
    );

    fireEvent.click(screen.getByLabelText(/I reviewed the privacy warnings/i));
    fireEvent.click(screen.getByRole('button', { name: /copy to proof pack draft/i }));

    await screen.findByText('Copied to draft only');
    expect(apiFetchMock).toHaveBeenCalledWith(
      '/api/proof-artifacts/22222222-2222-4222-8222-222222222222/text-extraction/apply',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"proofPackId":"11111111-1111-4111-8111-111111111111"'),
      })
    );
  });

  it('renders a generic manual fallback when OCR beta is temporarily unavailable', async () => {
    ocrStatus = {
      ...ocrStatus,
      visible: true,
      available: false,
      unavailableReason: 'temporarily_unavailable',
    };

    render(
      <ProofsSection
        {...baseProps}
        proofs={[
          {
            id: 'proof-1',
            proof_type: 'document',
            title: 'Launch proof document',
            file_path: 'private/document.pdf',
            canonicalPackId: '11111111-1111-4111-8111-111111111111',
            canonicalArtifactId: '22222222-2222-4222-8222-222222222222',
          },
        ]}
      />
    );

    expect(await screen.findByText(/OCR is temporarily unavailable/i)).toBeInTheDocument();
    expect(apiFetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining('/text-extraction'),
      expect.anything()
    );
  });
});
