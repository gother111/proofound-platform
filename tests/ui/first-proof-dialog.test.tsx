import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FirstProofDialog } from '@/components/proofs/FirstProofDialog';
import { apiFetch } from '@/lib/api/fetch';
import { dispatchClientDiagnostic, dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
import { uploadFile } from '@/lib/upload';

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientDiagnostic: vi.fn(),
  dispatchClientErrorDiagnostic: vi.fn(),
}));

vi.mock('@/lib/upload', async () => {
  const actual = await vi.importActual<typeof import('@/lib/upload')>('@/lib/upload');
  return {
    ...actual,
    uploadFile: vi.fn(),
  };
});

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => (open ? <div role="dialog">{children}</div> : null),
  DialogContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <footer>{children}</footer>,
  DialogHeader: ({ children }: any) => <header>{children}</header>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
}));

const apiFetchMock = vi.mocked(apiFetch);
const dispatchClientDiagnosticMock = vi.mocked(dispatchClientDiagnostic);
const dispatchClientErrorDiagnosticMock = vi.mocked(dispatchClientErrorDiagnostic);
const uploadFileMock = vi.mocked(uploadFile);

const firstProofProps = {
  open: true,
  onOpenChange: vi.fn(),
  onProofAdded: vi.fn(),
  skills: [{ id: 'skill-1', name: 'Systems thinking' }],
  anchors: [
    {
      id: '11111111-1111-4111-8111-111111111111',
      type: 'experience' as const,
      label: 'Proof-first launch work',
      detail: 'Proofound · 2026',
    },
  ],
};

describe('first proof entry point', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens the proof artifact dialog instead of the Add Skill to Atlas panel', () => {
    render(<FirstProofDialog {...firstProofProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Add your first proof' })).toBeInTheDocument();
    expect(screen.getByLabelText('Skill or capability')).toHaveDisplayValue('Systems thinking');
    expect(screen.getByLabelText('Real context')).toHaveDisplayValue('Proof-first launch work');
    expect(screen.getByLabelText('Proof link')).toBeInTheDocument();
    expect(screen.getByLabelText('Upload proof file')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save first proof' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Save first proof' }).closest('.overflow-y-auto')
    ).toHaveClass('max-h-[90vh]');
    expect(screen.queryByText('Add Skill to Atlas')).not.toBeInTheDocument();
  });

  it('keeps unexpected upload return errors safe, diagnostic, and retryable', async () => {
    const rawFailure = 'storage insert failed: bucket policy details';
    uploadFileMock.mockResolvedValueOnce({
      success: false,
      error: rawFailure,
    });

    render(<FirstProofDialog {...firstProofProps} />);

    fireEvent.change(screen.getByLabelText('Proof title'), {
      target: { value: 'Launch review artifact' },
    });
    fireEvent.change(screen.getByLabelText('Upload proof file'), {
      target: {
        files: [new File(['proof'], 'launch-review.pdf', { type: 'application/pdf' })],
      },
    });

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'Upload could not be saved. Your proof details are still here; try again or choose another file.'
    );
    expect(screen.queryByText(rawFailure)).not.toBeInTheDocument();
    expect(dispatchClientDiagnosticMock).toHaveBeenCalledWith(
      'proofs.first_proof.upload_returned_error',
      {
        hasReturnedError: true,
        errorKind: 'first_proof_upload_request_failed',
      }
    );
    expect(JSON.stringify(dispatchClientDiagnosticMock.mock.calls)).not.toContain(rawFailure);
    expect(JSON.stringify(dispatchClientErrorDiagnosticMock.mock.calls)).not.toContain(rawFailure);
    expect(screen.getByLabelText('Proof title')).toHaveValue('Launch review artifact');
    expect(screen.getByText('Selected: launch-review.pdf')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Save first proof' })).toBeEnabled()
    );
  });

  it('keeps failed first proof saves safe, diagnostic, and retryable', async () => {
    const rawFailure = 'storage policy leaked-ish';
    const onOpenChange = vi.fn();
    const onProofAdded = vi.fn();
    apiFetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: rawFailure }), { status: 500 })
    );

    render(
      <FirstProofDialog
        {...firstProofProps}
        onOpenChange={onOpenChange}
        onProofAdded={onProofAdded}
      />
    );

    fireEvent.change(screen.getByLabelText('Proof title'), {
      target: { value: 'Launch review artifact' },
    });
    fireEvent.change(screen.getByLabelText('Proof link'), {
      target: { value: 'https://example.com/proofs/launch-review' },
    });
    fireEvent.change(screen.getByLabelText('Evidence note'), {
      target: { value: 'Shows the real review work and outcome.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save first proof' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'Proof was not saved. Your proof details are still here; review them and try again.'
    );
    expect(screen.queryByText(rawFailure)).not.toBeInTheDocument();
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'proofs.first_proof.submit_failed',
      expect.any(Error)
    );
    expect((dispatchClientErrorDiagnosticMock.mock.calls[0]?.[1] as Error).message).toBe(
      'first_proof_save_request_failed'
    );
    expect(dispatchClientDiagnosticMock).toHaveBeenCalledWith(
      'proofs.first_proof.submit_returned_error',
      {
        status: 500,
        hasReturnedError: true,
      }
    );
    expect(JSON.stringify(dispatchClientDiagnosticMock.mock.calls)).not.toContain(rawFailure);
    expect(JSON.stringify(dispatchClientErrorDiagnosticMock.mock.calls)).not.toContain(rawFailure);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Save first proof' })).toBeEnabled()
    );
    expect(screen.getByLabelText('Proof title')).toHaveValue('Launch review artifact');
    expect(screen.getByLabelText('Proof link')).toHaveValue(
      'https://example.com/proofs/launch-review'
    );
    expect(screen.getByLabelText('Evidence note')).toHaveValue(
      'Shows the real review work and outcome.'
    );
    expect(onProofAdded).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
