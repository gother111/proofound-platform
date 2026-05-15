import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { completeIndividualOnboardingMock, pushMock, uploadFileMock, validateFileMock } = vi.hoisted(
  () => ({
    completeIndividualOnboardingMock: vi.fn(),
    pushMock: vi.fn(),
    uploadFileMock: vi.fn(),
    validateFileMock: vi.fn(),
  })
);

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock('@/actions/onboarding', () => ({
  completeIndividualOnboarding: completeIndividualOnboardingMock,
}));

vi.mock('@/lib/upload', () => ({
  uploadFile: uploadFileMock,
  validateFile: validateFileMock,
}));

import { IndividualSetup } from '@/components/onboarding/IndividualSetup';

describe('IndividualSetup first-proof flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateFileMock.mockReturnValue({ valid: true });
    uploadFileMock.mockResolvedValue({
      success: true,
      uploadedFileId: 'upload-1',
      artifactDisplayName: 'starter-proof.pdf',
    });
    completeIndividualOnboardingMock.mockResolvedValue({
      success: true,
      portfolioReady: false,
      scaffoldProfilePath: '/app/i/profile',
    });
  });

  it('starts with only the basic identity shell instead of profile completion fields', () => {
    render(<IndividualSetup />);

    expect(screen.getByLabelText('First name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Last name *')).toBeInTheDocument();
    expect(screen.getByLabelText('City or residence *')).toBeInTheDocument();
    expect(screen.queryByLabelText(/headline/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/timezone/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/work preference/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/resume wizard/i)).not.toBeInTheDocument();
  });

  it('captures one link artifact as the first Proof Pack without required verification', async () => {
    render(<IndividualSetup />);

    fireEvent.change(screen.getByLabelText('First name *'), { target: { value: 'Jane' } });
    fireEvent.change(screen.getByLabelText('Last name *'), { target: { value: 'Founder' } });
    fireEvent.change(screen.getByLabelText('City or residence *'), {
      target: { value: 'Stockholm' },
    });
    fireEvent.submit(
      screen.getByRole('button', { name: /continue to proof artifact/i }).closest('form')!
    );

    expect(screen.getByLabelText('Artifact type *')).toBeInTheDocument();
    expect(screen.getByLabelText('Proof link *')).toBeInTheDocument();
    expect(screen.queryByText(/anchor context/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/what context/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/3 to 5 skills/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Artifact type *'), { target: { value: 'document' } });
    fireEvent.change(screen.getByLabelText('Proof link *'), {
      target: { value: 'https://example.com/proof' },
    });
    fireEvent.change(screen.getByLabelText('Proof title *'), {
      target: { value: 'Launch proof' },
    });
    fireEvent.change(screen.getByLabelText('Short proof note *'), {
      target: { value: 'Shows the first proof artifact.' },
    });
    fireEvent.submit(
      screen.getByRole('button', { name: /save first proof pack/i }).closest('form')!
    );

    await waitFor(() => expect(completeIndividualOnboardingMock).toHaveBeenCalledTimes(1));
    const payload = completeIndividualOnboardingMock.mock.calls[0][0] as FormData;

    expect(payload.get('firstName')).toBe('Jane');
    expect(payload.get('lastName')).toBe('Founder');
    expect(payload.get('cityOrResidence')).toBe('Stockholm');
    expect(payload.get('proofInputType')).toBe('link');
    expect(payload.get('proofArtifactType')).toBe('document');
    expect(payload.get('proofUrl')).toBe('https://example.com/proof');
    expect(payload.get('proofPackClaim')).toBe('Launch proof');
    expect(payload.get('proofPackOutcome')).toBe('Shows the first proof artifact.');
    expect(payload.get('contextTitle')).toBeNull();
    expect(payload.get('proofPackSkills')).toBeNull();
    expect(screen.getByText(/first proof pack created/i)).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('lets the first proof be a single uploaded file', async () => {
    render(<IndividualSetup />);

    fireEvent.change(screen.getByLabelText('First name *'), { target: { value: 'Jane' } });
    fireEvent.change(screen.getByLabelText('Last name *'), { target: { value: 'Founder' } });
    fireEvent.change(screen.getByLabelText('City or residence *'), {
      target: { value: 'Stockholm' },
    });
    fireEvent.submit(
      screen.getByRole('button', { name: /continue to proof artifact/i }).closest('form')!
    );
    fireEvent.click(screen.getByLabelText('File upload'));

    const file = new File(['proof'], 'starter-proof.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText('Proof file *'), {
      target: { files: [file] },
    });

    await waitFor(() => expect(uploadFileMock).toHaveBeenCalledTimes(1));
    fireEvent.change(screen.getByLabelText('Proof title *'), {
      target: { value: 'Starter proof' },
    });
    fireEvent.change(screen.getByLabelText('Short proof note *'), {
      target: { value: 'A single uploaded artifact.' },
    });
    fireEvent.submit(
      screen.getByRole('button', { name: /save first proof pack/i }).closest('form')!
    );

    await waitFor(() => expect(completeIndividualOnboardingMock).toHaveBeenCalledTimes(1));
    const payload = completeIndividualOnboardingMock.mock.calls[0][0] as FormData;

    expect(validateFileMock).toHaveBeenCalledWith(file, 'document', { category: 'proof' });
    expect(payload.get('proofInputType')).toBe('file');
    expect(payload.get('uploadedFileId')).toBe('upload-1');
    expect(payload.get('proofUploadedFileId')).toBe('upload-1');
    expect(payload.get('proofFileName')).toBe('starter-proof.pdf');
  });
});
