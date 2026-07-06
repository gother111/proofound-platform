import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  completeIndividualOnboardingMock,
  dispatchClientErrorDiagnosticMock,
  fetchMock,
  pushMock,
  startFromCvStatus,
  uploadFileMock,
  validateFileMock,
} = vi.hoisted(() => ({
  completeIndividualOnboardingMock: vi.fn(),
  dispatchClientErrorDiagnosticMock: vi.fn(),
  fetchMock: vi.fn(),
  pushMock: vi.fn(),
  startFromCvStatus: {
    visible: false,
    available: false,
    blockers: [] as string[],
  },
  uploadFileMock: vi.fn(),
  validateFileMock: vi.fn(),
}));

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

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientErrorDiagnostic: dispatchClientErrorDiagnosticMock,
}));

vi.mock('@/hooks/useStartFromCvBetaStatus', () => ({
  useStartFromCvBetaStatus: () => startFromCvStatus,
}));

vi.mock('@/components/profile/StartFromCvDialog', () => ({
  StartFromCvDialog: ({ onApplyComplete }: { onApplyComplete?: () => void }) => (
    <div data-testid="start-from-cv-dialog">
      <p>Private draft scaffolding mock</p>
      <button type="button" onClick={() => onApplyComplete?.()}>
        Continue manually
      </button>
    </div>
  ),
}));

import { IndividualSetup } from '@/components/onboarding/IndividualSetup';
import { START_FROM_CV_GUEST_FIRST_PROOF_SCAFFOLDING_SURFACE } from '@/lib/ai/start-from-cv-contract';

describe('IndividualSetup first-proof flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    startFromCvStatus.visible = false;
    startFromCvStatus.available = false;
    startFromCvStatus.blockers = [];
    validateFileMock.mockReturnValue({ valid: true });
    uploadFileMock.mockResolvedValue({
      success: true,
      uploadedFileId: 'upload-1',
      fileName: 'starter-proof.pdf',
      artifactDisplayName: 'starter-proof.pdf',
      url: 'https://proofound.test/uploads/starter-proof.pdf',
    });
    completeIndividualOnboardingMock.mockResolvedValue({
      success: true,
      portfolioReady: false,
      publicPortfolioUrl: 'https://proofound.io/portfolio/jane-founder',
      scaffoldProfilePath: '/app/i/home',
      firstProofVerificationArtifact: {
        type: 'experience',
        id: '11111111-1111-4111-8111-111111111111',
      },
    });
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ request: { id: 'request-1' }, email_sent: true }),
    });
    vi.stubGlobal('fetch', fetchMock);
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    cleanup();
  });

  function fillBasicDetails() {
    fireEvent.change(screen.getByLabelText('First name *'), { target: { value: 'Jane' } });
    fireEvent.change(screen.getByLabelText('Last name *'), { target: { value: 'Founder' } });
    fireEvent.change(screen.getByLabelText('City or residence *'), {
      target: { value: 'Stockholm' },
    });
    fireEvent.click(screen.getByRole('button', { name: /continue to proof artifact/i }));
  }

  function fillRequiredProofDetails() {
    fireEvent.click(screen.getByLabelText('This was created with a team'));
    fireEvent.change(screen.getByLabelText('What was your ownership? *'), {
      target: { value: 'owned_scope' },
    });
    fireEvent.change(screen.getByLabelText('Concrete ownership note *'), {
      target: { value: 'I owned the proof mapping and launch handoff.' },
    });
    fireEvent.change(screen.getByLabelText('3 to 5 skills this proof supports *'), {
      target: { value: 'Proof writing, artifact review, onboarding design' },
    });
  }

  function fillLinkProof() {
    fireEvent.change(screen.getByLabelText('Proof link *'), {
      target: { value: 'https://example.com/proof' },
    });
    fireEvent.change(screen.getByLabelText('Proof title *'), {
      target: { value: 'Launch proof' },
    });
    fireEvent.change(screen.getByLabelText('What does this artifact show? *'), {
      target: { value: 'Shows the first proof artifact.' },
    });
    fillRequiredProofDetails();
  }

  it('starts with only the basic identity shell instead of broad profile fields', () => {
    render(<IndividualSetup />);

    expect(screen.getByLabelText('First name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Last name *')).toBeInTheDocument();
    expect(screen.getByLabelText('City or residence *')).toBeInTheDocument();
    expect(screen.queryByLabelText(/headline/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/timezone/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/work preference/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/resume wizard/i)).not.toBeInTheDocument();
  });

  it('keeps Start from CV hidden unless the guest first-proof scaffolding surface is passed', () => {
    startFromCvStatus.visible = true;
    startFromCvStatus.available = true;

    render(<IndividualSetup />);

    expect(screen.queryByRole('button', { name: /Import your CV/i })).not.toBeInTheDocument();
  });

  it('shows optional CV import before manual proof setup for the private scaffolding path', async () => {
    startFromCvStatus.visible = true;
    startFromCvStatus.available = true;

    render(
      <IndividualSetup
        completionPath="/candidate-invite/token-value"
        startFromCvScaffoldingSurface={START_FROM_CV_GUEST_FIRST_PROOF_SCAFFOLDING_SURFACE}
      />
    );

    expect(screen.getAllByText('Import your CV').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Import your CV/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /or start from scratch/i })).toBeInTheDocument();
    expect(screen.queryByText(/score|rank|shortlist/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Import your CV/i }));
    expect(await screen.findByTestId('start-from-cv-dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Continue manually/i }));

    await waitFor(() =>
      expect(screen.queryByTestId('start-from-cv-dialog')).not.toBeInTheDocument()
    );
  });

  it('hides the CV import entry when provider gates make Start from CV unavailable', () => {
    startFromCvStatus.visible = false;
    startFromCvStatus.available = false;
    startFromCvStatus.blockers = ['ai_provider_policy_api_key_missing'];

    render(
      <IndividualSetup
        startFromCvScaffoldingSurface={START_FROM_CV_GUEST_FIRST_PROOF_SCAFFOLDING_SURFACE}
      />
    );

    expect(screen.queryByRole('button', { name: /Import your CV/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText('First name *')).toBeInTheDocument();
  });

  it('captures one link artifact before broad profile setup', async () => {
    render(<IndividualSetup />);

    fillBasicDetails();

    expect(screen.getByLabelText('Artifact type *')).toBeInTheDocument();
    expect(screen.getByLabelText('Proof link *')).toBeInTheDocument();
    expect(screen.queryByText(/anchor the proof to real context/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/headline/i)).not.toBeInTheDocument();
    expect(screen.getByText(/ownership for this proof/i)).toBeInTheDocument();
    expect(screen.getByLabelText('This was created with a team')).toBeInTheDocument();
    expect(screen.getByLabelText('3 to 5 skills this proof supports *')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Artifact type *'), { target: { value: 'document' } });
    fireEvent.change(screen.getByLabelText('Proof link *'), {
      target: { value: 'https://example.com/proof' },
    });
    fireEvent.change(screen.getByLabelText('Proof title *'), {
      target: { value: 'Launch proof' },
    });
    fireEvent.change(screen.getByLabelText('What does this artifact show? *'), {
      target: { value: 'Shows the first proof artifact.' },
    });
    fireEvent.change(screen.getByLabelText('What changed?'), {
      target: { value: 'Reduced review time' },
    });
    fireEvent.change(screen.getByLabelText('Measure'), {
      target: { value: '23%' },
    });
    fireEvent.change(screen.getByLabelText('Scope'), {
      target: { value: 'Q1 pilot' },
    });
    fillRequiredProofDetails();
    fireEvent.submit(
      screen.getByRole('button', { name: /save first proof record/i }).closest('form')!
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
    expect(payload.get('proofPackOutcome')).toBe('Reduced review time · 23% · Q1 pilot');
    expect(JSON.parse(String(payload.get('proofPackMeasuredOutcomes')))).toEqual([
      {
        id: 'outcome-1',
        statement: 'Reduced review time',
        value: '23%',
        timeframe: 'Q1 pilot',
      },
    ]);
    expect(payload.get('contextTitle')).toBeNull();
    expect(payload.get('proofPackSkills')).toBe(
      'Proof writing, artifact review, onboarding design'
    );
    expect(payload.get('proofContributionMode')).toBe('team');
    expect(payload.get('proofOwnershipLevel')).toBe('owned_scope');
    expect(payload.get('proofOwnershipNote')).toBe('I owned the proof mapping and launch handoff.');
    expect(payload.get('proofPackOwnership')).toBe(
      'Created as part of a team effort. I owned a defined part of the work. I owned the proof mapping and launch handoff.'
    );
    expect(screen.getByText(/your public page is ready/i)).toBeInTheDocument();
    expect(screen.getByText(/launch proof/i)).toBeInTheDocument();
    expect(screen.getByText(/shows the first proof artifact/i)).toBeInTheDocument();
    expect(screen.getByText('https://proofound.io/portfolio/jane-founder')).toBeInTheDocument();
    expect(screen.getAllByText(/self-reported/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('switch', { name: /publish my public page/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy link/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /not now, go to home/i })).toBeInTheDocument();
    expect(screen.queryByText(/% complete/i)).not.toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('announces first-proof validation errors in an alert region', () => {
    render(<IndividualSetup />);

    fillBasicDetails();
    fireEvent.submit(
      screen.getByRole('button', { name: /save first proof record/i }).closest('form')!
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Add one proof link before saving.');
    expect(completeIndividualOnboardingMock).not.toHaveBeenCalled();
  });

  it('publishes the ready step before enabling copy and continuing home', async () => {
    completeIndividualOnboardingMock.mockResolvedValueOnce({
      success: true,
      portfolioReady: true,
      publicPortfolioUrl: 'https://proofound.io/portfolio/jane-founder',
      scaffoldProfilePath: '/app/i/home',
    });
    render(<IndividualSetup />);

    fillBasicDetails();
    fireEvent.change(screen.getByLabelText('Proof link *'), {
      target: { value: 'https://example.com/proof' },
    });
    fireEvent.change(screen.getByLabelText('Proof title *'), {
      target: { value: 'Launch proof' },
    });
    fireEvent.change(screen.getByLabelText('What does this artifact show? *'), {
      target: { value: 'Shows the first proof artifact.' },
    });
    fillRequiredProofDetails();
    fireEvent.submit(
      screen.getByRole('button', { name: /save first proof record/i }).closest('form')!
    );

    await waitFor(() => expect(screen.getByText(/your public page is ready/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('switch', { name: /publish my public page/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/portfolio/visibility',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            publicPageEnabled: true,
            searchIndexingEnabled: false,
          }),
        })
      )
    );
    expect(screen.getByRole('button', { name: /copy link/i })).not.toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /copy link/i }));
    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'https://proofound.io/portfolio/jane-founder'
      )
    );

    fireEvent.click(screen.getByRole('button', { name: /continue to home/i }));

    expect(pushMock).toHaveBeenCalledWith('/app/i/home');
    expect(pushMock).not.toHaveBeenCalledWith('https://proofound.io/portfolio/jane-founder');
  });

  it('lets the user decline publishing and still completes onboarding to home', async () => {
    render(<IndividualSetup />);

    fillBasicDetails();
    fillLinkProof();
    fireEvent.submit(
      screen.getByRole('button', { name: /save first proof record/i }).closest('form')!
    );

    await waitFor(() => expect(screen.getByText(/your public page is ready/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /not now, go to home/i }));

    expect(pushMock).toHaveBeenCalledWith('/app/i/home');
    expect(fetchMock).not.toHaveBeenCalledWith('/api/portfolio/visibility', expect.anything());
  });

  it('lets the first proof be a single uploaded file', async () => {
    render(<IndividualSetup />);

    fillBasicDetails();
    fireEvent.click(screen.getByRole('radio', { name: /file upload/i }));

    const file = new File(['proof'], 'starter-proof.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText('Proof file *'), {
      target: { files: [file] },
    });

    await waitFor(() => expect(uploadFileMock).toHaveBeenCalledTimes(1));
    fireEvent.change(screen.getByLabelText('Proof title *'), {
      target: { value: 'Starter proof' },
    });
    fireEvent.change(screen.getByLabelText('What does this artifact show? *'), {
      target: { value: 'A single uploaded artifact.' },
    });
    fillRequiredProofDetails();
    fireEvent.submit(
      screen.getByRole('button', { name: /save first proof record/i }).closest('form')!
    );

    await waitFor(() => expect(completeIndividualOnboardingMock).toHaveBeenCalledTimes(1));
    const payload = completeIndividualOnboardingMock.mock.calls[0][0] as FormData;

    expect(validateFileMock).toHaveBeenCalledWith(file, 'document', { category: 'proof' });
    expect(payload.get('proofInputType')).toBe('file');
    expect(payload.get('uploadedFileId')).toBe('upload-1');
    expect(payload.get('proofUploadedFileId')).toBe('upload-1');
    expect(payload.get('proofFileName')).toBe('starter-proof.pdf');
    expect(payload.get('proofPackOutcome')).toBeNull();
    expect(JSON.parse(String(payload.get('proofPackMeasuredOutcomes')))).toEqual([]);
    expect(payload.get('contextTitle')).toBeNull();
    expect(payload.get('proofPackSkills')).toBe(
      'Proof writing, artifact review, onboarding design'
    );
    expect(payload.get('proofContributionMode')).toBe('team');
  });

  it('announces invalid first-proof files as recoverable upload alerts', async () => {
    validateFileMock.mockReturnValueOnce({
      valid: false,
      error: 'Choose a PDF, image, or document under the upload limit.',
    });

    render(<IndividualSetup />);

    fillBasicDetails();
    fireEvent.click(screen.getByRole('radio', { name: /file upload/i }));

    const file = new File(['proof'], 'starter-proof.exe', {
      type: 'application/octet-stream',
    });
    fireEvent.change(screen.getByLabelText('Proof file *'), {
      target: { files: [file] },
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Choose a PDF, image, or document under the upload limit.'
    );
    expect(uploadFileMock).not.toHaveBeenCalled();
  });

  it('keeps returned first-proof upload failures safe and retryable', async () => {
    const rawError = 'Storage provider stack: insert failed for bucket proof-uploads';
    uploadFileMock.mockResolvedValueOnce({
      success: false,
      error: rawError,
    });

    render(<IndividualSetup />);

    fillBasicDetails();
    fireEvent.click(screen.getByRole('radio', { name: /file upload/i }));

    const file = new File(['proof'], 'starter-proof.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText('Proof file *'), {
      target: { files: [file] },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Upload could not be saved. Your proof details are still here; try again or choose another file.'
    );
    expect(screen.queryByText(rawError)).not.toBeInTheDocument();
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'onboarding.individual.first_proof_upload_returned_error',
      expect.any(Error)
    );
    expect((dispatchClientErrorDiagnosticMock.mock.calls[0]?.[1] as Error).message).toBe(rawError);
    expect(screen.getByLabelText('Proof file *')).toBeEnabled();
  });

  it('preserves known first-proof upload rejection copy', async () => {
    uploadFileMock.mockResolvedValueOnce({
      success: false,
      error: 'Invalid file type',
      message: 'The uploaded file type did not match its file signature.',
    });

    render(<IndividualSetup />);

    fillBasicDetails();
    fireEvent.click(screen.getByRole('radio', { name: /file upload/i }));

    const file = new File(['proof'], 'starter-proof.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText('Proof file *'), {
      target: { files: [file] },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The uploaded file type did not match its file signature.'
    );
    expect(dispatchClientErrorDiagnosticMock).not.toHaveBeenCalledWith(
      'onboarding.individual.first_proof_upload_returned_error',
      expect.any(Error)
    );
    expect(screen.getByLabelText('Proof file *')).toBeEnabled();
  });

  it('maps generic returned first-proof upload failures to preserved-details retry copy', async () => {
    const genericFailure = 'Failed to upload file. Please try again.';
    uploadFileMock.mockResolvedValueOnce({
      success: false,
      error: genericFailure,
    });

    render(<IndividualSetup />);

    fillBasicDetails();
    fireEvent.click(screen.getByRole('radio', { name: /file upload/i }));

    const file = new File(['proof'], 'starter-proof.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText('Proof file *'), {
      target: { files: [file] },
    });

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'Upload could not be saved. Your proof details are still here; try again or choose another file.'
    );
    expect(alert).not.toHaveTextContent(genericFailure);
    expect(dispatchClientErrorDiagnosticMock).not.toHaveBeenCalledWith(
      'onboarding.individual.first_proof_upload_returned_error',
      expect.any(Error)
    );
    expect(screen.getByLabelText('Proof file *')).toBeEnabled();
  });

  it('logs unexpected first-proof upload failures while keeping upload retryable', async () => {
    const uploadError = new Error('network down');
    uploadFileMock.mockRejectedValueOnce(uploadError);

    render(<IndividualSetup />);

    fillBasicDetails();
    fireEvent.click(screen.getByRole('radio', { name: /file upload/i }));

    const file = new File(['proof'], 'starter-proof.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText('Proof file *'), {
      target: { files: [file] },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Upload could not be saved. Your proof details are still here; try again or choose another file.'
    );
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'onboarding.individual.first_proof_upload_failed',
      uploadError
    );
    expect(screen.getByLabelText('Proof file *')).toBeEnabled();
  });

  it('announces first-proof save validation errors as recoverable alerts', async () => {
    render(<IndividualSetup />);

    fillBasicDetails();
    fireEvent.submit(
      screen.getByRole('button', { name: /save first proof record/i }).closest('form')!
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Add one proof link before saving.');
    expect(screen.getByRole('button', { name: /save first proof record/i })).toBeEnabled();
  });

  it('logs unexpected first-proof save failures while keeping save retryable', async () => {
    const submitError = new Error('action failed');
    completeIndividualOnboardingMock.mockRejectedValueOnce(submitError);

    render(<IndividualSetup />);

    fillBasicDetails();
    fillLinkProof();
    fireEvent.submit(
      screen.getByRole('button', { name: /save first proof record/i }).closest('form')!
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'First Proof Pack could not be saved. Your details are still here; please try again.'
    );
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'onboarding.individual.first_proof_submit_failed',
      submitError
    );
    expect(screen.getByRole('button', { name: /save first proof record/i })).toBeEnabled();
  });

  it('keeps returned first-proof save failures safe, diagnostic, and retryable', async () => {
    const rawError = 'Database policy failed: proof_pack_items insert stack detail';
    completeIndividualOnboardingMock.mockResolvedValueOnce({ error: rawError });

    render(<IndividualSetup />);

    fillBasicDetails();
    fillLinkProof();
    fireEvent.submit(
      screen.getByRole('button', { name: /save first proof record/i }).closest('form')!
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'First Proof Pack could not be saved. Your details are still here; please try again.'
    );
    expect(screen.queryByText(rawError)).not.toBeInTheDocument();
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'onboarding.individual.first_proof_returned_error',
      expect.any(Error)
    );
    expect((dispatchClientErrorDiagnosticMock.mock.calls[0]?.[1] as Error).message).toBe(rawError);
    expect(screen.getByRole('button', { name: /save first proof record/i })).toBeEnabled();
  });

  it('preserves known first-proof save action copy', async () => {
    completeIndividualOnboardingMock.mockResolvedValueOnce({
      error: 'Uploaded file is awaiting privacy review or failed checks.',
    });

    render(<IndividualSetup />);

    fillBasicDetails();
    fillLinkProof();
    fireEvent.submit(
      screen.getByRole('button', { name: /save first proof record/i }).closest('form')!
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Uploaded file is awaiting privacy review or failed checks.'
    );
    expect(dispatchClientErrorDiagnosticMock).not.toHaveBeenCalledWith(
      'onboarding.individual.first_proof_returned_error',
      expect.any(Error)
    );
    expect(screen.getByRole('button', { name: /save first proof record/i })).toBeEnabled();
  });

  it('saves an optional scoped verification request preview without sending', async () => {
    render(<IndividualSetup />);

    fillBasicDetails();
    fillLinkProof();
    fireEvent.change(screen.getByLabelText('What changed?'), {
      target: { value: 'Reduced review time' },
    });
    fireEvent.change(screen.getByLabelText('Measure'), {
      target: { value: '23%' },
    });
    fireEvent.change(screen.getByLabelText('Scope'), {
      target: { value: 'Q1 pilot' },
    });

    fireEvent.click(screen.getByLabelText('Save without sending'));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Amina Client' } });
    fireEvent.change(screen.getByLabelText('Relationship'), { target: { value: 'client' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'Amina@Example.com' } });

    expect(screen.getByText('Email preview')).toBeInTheDocument();
    expect(screen.getByText(/Specific claim: Launch proof/i)).toBeInTheDocument();
    expect(screen.getByText(/Artifact or evidence:/i)).toBeInTheDocument();
    expect(screen.getByText(/Ownership:/i)).toBeInTheDocument();
    expect(screen.getByText(/Observed behavior to confirm:/i)).toBeInTheDocument();
    expect(screen.getByText(/Optional outcome: Reduced review time/i)).toBeInTheDocument();

    fireEvent.submit(
      screen.getByRole('button', { name: /save first proof record/i }).closest('form')!
    );

    await waitFor(() => expect(completeIndividualOnboardingMock).toHaveBeenCalledTimes(1));
    const payload = completeIndividualOnboardingMock.mock.calls[0][0] as FormData;
    const confirmers = JSON.parse(String(payload.get('firstProofVerificationConfirmers')));

    expect(payload.get('firstProofVerificationAction')).toBe('draft');
    expect(String(payload.get('firstProofVerificationPreview'))).toContain(
      'This is a scoped verification request'
    );
    expect(confirmers).toEqual([
      {
        name: 'Amina Client',
        relationship: 'client',
        email: 'amina@example.com',
      },
    ]);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText(/saved without sending/i)).toBeInTheDocument();
  });

  it('sends optional verification requests after the first proof record is created', async () => {
    render(<IndividualSetup />);

    fillBasicDetails();
    fillLinkProof();
    fireEvent.click(screen.getByLabelText('Send now'));
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Program Teacher' },
    });
    fireEvent.change(screen.getByLabelText('Relationship'), {
      target: { value: 'teacher' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'teacher@example.com' },
    });

    fireEvent.submit(
      screen.getByRole('button', { name: /save and send request/i }).closest('form')!
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body));

    expect(url).toBe('/api/verification/requests/custom');
    expect(init.method).toBe('POST');
    expect(body.verifierEmail).toBe('teacher@example.com');
    expect(body.relationship).toBe('mentor_coach');
    expect(body.message).toContain('Specific claim: Launch proof');
    expect(body.artifacts).toEqual([
      { type: 'experience', id: '11111111-1111-4111-8111-111111111111' },
    ]);
    expect(
      screen.getByText(/verification request sent to 1 confirmer/i)
    ).toBeInTheDocument();
  });

  it('keeps partial verification request delivery honest after saving first proof', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ request: { id: 'request-1' }, email_sent: true }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'service unavailable' }),
      });

    render(<IndividualSetup />);

    fillBasicDetails();
    fillLinkProof();
    fireEvent.click(screen.getByLabelText('Send now'));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Program Teacher' } });
    fireEvent.change(screen.getByLabelText('Relationship'), { target: { value: 'teacher' } });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'teacher@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /add confirmer/i }));
    fireEvent.change(screen.getAllByLabelText('Name')[1], {
      target: { value: 'Peer Reviewer' },
    });
    fireEvent.change(screen.getAllByLabelText('Relationship')[1], {
      target: { value: 'peer' },
    });
    fireEvent.change(screen.getAllByLabelText('Email')[1], {
      target: { value: 'peer@example.com' },
    });

    fireEvent.submit(
      screen.getByRole('button', { name: /save and send request/i }).closest('form')!
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(
      screen.getByText(
        /First proof record saved\. 1 of 2 verification request emails sent\./i
      )
    ).toBeInTheDocument();
  });
});
