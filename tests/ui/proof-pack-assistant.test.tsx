import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProofsSection } from '@/app/app/i/expertise/components/edit-skill/ProofsSection';

const apiFetchMock = vi.fn();
const routerPushMock = vi.fn();

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
    apiFetchMock.mockResolvedValue(
      mockResponse({
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

    expect(screen.getByRole('button', { name: /improve this proof/i })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Sends selected Proof Pack text only. Does not review full files by default.'
      )
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /improve this proof/i }));

    await screen.findByText('Suggested improvements');
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

    expect(apiFetchMock).toHaveBeenCalledTimes(1);
    expect(apiFetchMock).toHaveBeenCalledWith(
      '/api/ai/proof-pack/suggest',
      expect.objectContaining({ method: 'POST' })
    );
    expect(JSON.stringify(apiFetchMock.mock.calls)).not.toContain('PATCH');
    expect(JSON.stringify(apiFetchMock.mock.calls)).not.toContain('/proofs/proof-1');
  });
});
