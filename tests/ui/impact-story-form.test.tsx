import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ImpactStoryForm } from '@/components/profile/forms/ImpactStoryForm';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';

const IMPACT_STORY_CONFIRMATION_BUTTON_LABEL = /ask to confirm this proof/i;

const uploadFileMock = vi.fn();
const validateFileMock = vi.fn();

vi.mock('@/lib/upload', () => ({
  uploadFile: (...args: any[]) => uploadFileMock(...args),
  validateFile: (...args: any[]) => validateFileMock(...args),
}));

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientErrorDiagnostic: vi.fn(),
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: any) => <div>{children}</div>,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor, ...rest }: any) => (
    <label htmlFor={htmlFor ?? rest.id ?? 'mock-id'} {...rest}>
      {children}
    </label>
  ),
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: any) => <textarea {...props} />,
}));

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, ...props }: any) => (
    <input
      type="checkbox"
      checked={!!checked}
      onChange={(event) => onCheckedChange?.(event.target.checked)}
      {...props}
    />
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
}));

const dispatchClientErrorDiagnosticMock = vi.mocked(dispatchClientErrorDiagnostic);

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText(/^Title \*$/i), {
    target: { value: 'Community mentorship program' },
  });

  fireEvent.change(screen.getByLabelText(/^Start \*$/i), {
    target: { value: '2025-01-01' },
  });

  fireEvent.change(screen.getByLabelText(/^End\s*\*$/i), {
    target: { value: '2025-06-30' },
  });

  fireEvent.change(screen.getByLabelText(/^Role title \*$/i), {
    target: { value: 'Program Lead' },
  });

  fireEvent.change(screen.getByLabelText(/Primary area/i), {
    target: { value: 'education' },
  });

  fireEvent.change(screen.getByPlaceholderText(/Increased awareness about stories/i), {
    target: { value: 'Increased awareness among local communities' },
  });
}

describe('ImpactStoryForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uploadFileMock.mockResolvedValue({
      success: true,
      url: 'https://example.com/file.pdf',
      path: 'artifact/file.pdf',
    });
    validateFileMock.mockReturnValue({ valid: true });
  });

  it('submits structured impact story payload when saving', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <ImpactStoryForm
        open={true}
        onOpenChange={vi.fn()}
        onSave={onSave}
        onSendVerificationRequest={vi.fn()}
      />
    );

    fillRequiredFields();

    fireEvent.submit(screen.getByRole('button', { name: /add story/i }).closest('form')!);

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));

    const payload = onSave.mock.calls[0][0];
    expect(payload.title).toBe('Community mentorship program');
    expect(payload.timelineStructured).toMatchObject({
      mode: 'range',
      precision: 'date',
      start: '2025-01-01',
      end: '2025-06-30',
      ongoing: false,
    });
    expect(payload.measuredOutcomes?.[0]).toMatchObject({
      change: 'Increased awareness among local communities',
      label: 'Increased awareness among local communities',
      value: null,
      unit: null,
    });
    expect(payload.verificationRequest).toBeNull();
  });

  it('blocks save when supporting metric value is provided without a unit', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <ImpactStoryForm
        open={true}
        onOpenChange={vi.fn()}
        onSave={onSave}
        onSendVerificationRequest={vi.fn()}
      />
    );

    fillRequiredFields();

    fireEvent.change(screen.getByPlaceholderText(/e.g., 5000/i), {
      target: { value: '5000' },
    });

    fireEvent.submit(screen.getByRole('button', { name: /add story/i }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/Unit\/type is required when value is provided/i)).toBeTruthy();
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('keeps failed impact story saves safe, diagnostic, and retryable', async () => {
    const rawFailure = 'duplicate key value violates unique constraint profile_impact_stories';
    const onSave = vi.fn().mockRejectedValue(new Error(rawFailure));
    const onOpenChange = vi.fn();

    render(
      <ImpactStoryForm
        open={true}
        onOpenChange={onOpenChange}
        onSave={onSave}
        onSendVerificationRequest={vi.fn()}
      />
    );

    fillRequiredFields();

    fireEvent.submit(screen.getByRole('button', { name: /add story/i }).closest('form')!);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'Impact story could not be saved. Your story details are still here; review them and try again.'
    );
    expect(screen.queryByText(rawFailure)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/^Title \*$/i)).toHaveValue('Community mentorship program');
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'profile.impact_story.save_failed',
      expect.any(Error)
    );
    expect((dispatchClientErrorDiagnosticMock.mock.calls[0]?.[1] as Error).message).toBe(
      rawFailure
    );
    await waitFor(() => expect(screen.getByRole('button', { name: /add story/i })).toBeEnabled());
  });

  it('keeps unexpected artifact upload return errors safe, diagnostic, and retryable', async () => {
    const rawFailure = 'storage policy denied: artifact bucket detail';
    uploadFileMock.mockResolvedValueOnce({
      success: false,
      error: rawFailure,
    });

    const { container } = render(
      <ImpactStoryForm
        open={true}
        onOpenChange={vi.fn()}
        onSave={vi.fn()}
        onSendVerificationRequest={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /add artifact/i }));
    fireEvent.change(screen.getByDisplayValue('link'), {
      target: { value: 'file' },
    });

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeTruthy();

    fireEvent.change(fileInput, {
      target: {
        files: [new File(['artifact'], 'impact-report.pdf', { type: 'application/pdf' })],
      },
    });

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'Artifact upload could not be saved. Your story details are still here; try again or choose another file.'
    );
    expect(screen.queryByText(rawFailure)).not.toBeInTheDocument();
    expect(screen.queryByText('Uploading...')).not.toBeInTheDocument();
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'profile.impact_story.artifact_upload_returned_error',
      expect.any(Error)
    );
    expect((dispatchClientErrorDiagnosticMock.mock.calls[0]?.[1] as Error).message).toBe(
      rawFailure
    );
  });

  it('clears artifact uploading state when upload throws', async () => {
    const thrownFailure = new Error('network layer exposed storage endpoint');
    uploadFileMock.mockRejectedValueOnce(thrownFailure);

    const { container } = render(
      <ImpactStoryForm
        open={true}
        onOpenChange={vi.fn()}
        onSave={vi.fn()}
        onSendVerificationRequest={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /add artifact/i }));
    fireEvent.change(screen.getByDisplayValue('link'), {
      target: { value: 'file' },
    });

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: {
        files: [new File(['artifact'], 'impact-report.pdf', { type: 'application/pdf' })],
      },
    });

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'Artifact upload could not be saved. Your story details are still here; try again or choose another file.'
    );
    expect(screen.queryByText(thrownFailure.message)).not.toBeInTheDocument();
    expect(screen.queryByText('Uploading...')).not.toBeInTheDocument();
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'profile.impact_story.artifact_upload_failed',
      thrownFailure
    );
  });

  it('requires valid verifier email for send request button', async () => {
    const onSendVerificationRequest = vi.fn();

    render(
      <ImpactStoryForm
        open={true}
        onOpenChange={vi.fn()}
        onSave={vi.fn()}
        onSendVerificationRequest={onSendVerificationRequest}
      />
    );

    fillRequiredFields();

    fireEvent.change(screen.getByLabelText(/Verifier email/i), {
      target: { value: 'invalid-email' },
    });

    fireEvent.click(screen.getByRole('button', { name: IMPACT_STORY_CONFIRMATION_BUTTON_LABEL }));

    await waitFor(() => {
      expect(screen.getByText(/Verifier email must be valid/i)).toBeTruthy();
    });
    expect(onSendVerificationRequest).not.toHaveBeenCalled();
  });

  it('keeps failed proof confirmation sends safe, diagnostic, and retryable', async () => {
    const rawFailure = 'SMTP provider rejected verifier address with internal code';
    const onSendVerificationRequest = vi.fn().mockRejectedValue(new Error(rawFailure));

    render(
      <ImpactStoryForm
        open={true}
        onOpenChange={vi.fn()}
        onSave={vi.fn()}
        onSendVerificationRequest={onSendVerificationRequest}
      />
    );

    fillRequiredFields();
    fireEvent.change(screen.getByLabelText(/Verifier email/i), {
      target: { value: 'verifier@example.com' },
    });

    fireEvent.click(screen.getByRole('button', { name: IMPACT_STORY_CONFIRMATION_BUTTON_LABEL }));

    await waitFor(() => expect(onSendVerificationRequest).toHaveBeenCalledTimes(1));
    expect(
      screen.getByText(
        'Proof confirmation request could not be sent. Your story details are still here; review the verifier details and try again.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(rawFailure)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/^Title \*$/i)).toHaveValue('Community mentorship program');
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'profile.impact_story.verification_send_failed',
      expect.any(Error)
    );
    expect((dispatchClientErrorDiagnosticMock.mock.calls[0]?.[1] as Error).message).toBe(
      rawFailure
    );
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: IMPACT_STORY_CONFIRMATION_BUTTON_LABEL })
      ).toBeEnabled()
    );
  });

  it('auto-saves before send for new story and then routes later save to existing story update', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onSaveExisting = vi.fn().mockResolvedValue(undefined);
    const onSendVerificationRequest = vi.fn(async (params: any) => ({
      story: {
        id: 'impact-123',
        ...(params.storyDraft || {}),
        verificationRequestStatus: 'pending',
      },
      verification: {
        requestId: 'request-1',
        status: 'pending',
        emailSent: true,
        verifierEmail: params.verificationRequest.verifierEmail,
        createdAt: new Date('2026-02-27T00:00:00.000Z').toISOString(),
        emailSentAt: new Date('2026-02-27T00:00:00.000Z').toISOString(),
      },
      saveWarning: null,
    }));

    render(
      <ImpactStoryForm
        open={true}
        onOpenChange={vi.fn()}
        onSave={onSave}
        onSaveExisting={onSaveExisting}
        onSendVerificationRequest={onSendVerificationRequest}
      />
    );

    fillRequiredFields();
    fireEvent.change(screen.getByLabelText(/Verifier email/i), {
      target: { value: 'verifier@example.com' },
    });

    fireEvent.click(screen.getByRole('button', { name: IMPACT_STORY_CONFIRMATION_BUTTON_LABEL }));

    await waitFor(() => expect(onSendVerificationRequest).toHaveBeenCalledTimes(1));
    expect(onSendVerificationRequest.mock.calls[0][0].storyDraft).toBeTruthy();
    expect(onSendVerificationRequest.mock.calls[0][0].storyId).toBeUndefined();

    fireEvent.submit(screen.getByRole('button', { name: /save changes/i }).closest('form')!);

    await waitFor(() => expect(onSaveExisting).toHaveBeenCalledTimes(1));
    expect(onSaveExisting.mock.calls[0][0]).toBe('impact-123');
    expect(onSave).not.toHaveBeenCalled();
  });

  it('sends request from existing story with current draft payload and story id', async () => {
    const onSendVerificationRequest = vi.fn(async (params: any) => ({
      story: {
        id: params.storyId,
        title: params.storyDraft?.title || 'Saved story',
        orgDescription: 'Org',
        impact: 'Impact',
        businessValue: 'Value',
        outcomes: 'Outcome',
        timeline: '2024',
        timelineStructured: { mode: 'single', precision: 'year', start: '2024' },
        verified: false,
      },
      verification: {
        requestId: 'request-2',
        status: 'pending',
        emailSent: true,
        verifierEmail: params.verificationRequest.verifierEmail,
        createdAt: new Date('2026-02-27T00:00:00.000Z').toISOString(),
        emailSentAt: new Date('2026-02-27T00:00:00.000Z').toISOString(),
      },
      saveWarning: null,
    }));

    render(
      <ImpactStoryForm
        open={true}
        onOpenChange={vi.fn()}
        onSave={vi.fn()}
        onSaveExisting={vi.fn()}
        onSendVerificationRequest={onSendVerificationRequest}
        story={{
          id: 'impact-existing',
          title: 'Saved story',
          orgDescription: 'Org',
          impact: 'Impact',
          businessValue: 'Value',
          outcomes: 'Outcome',
          timeline: '2024',
          timelineStructured: { mode: 'single', precision: 'year', start: '2024' },
          verified: false,
          affiliationType: 'organization',
          affiliationDetails: 'Org',
          roleTitle: 'Lead',
          roleScope: 'owned',
          primaryCause: 'education',
          secondaryCauses: [],
          measuredOutcomes: [
            {
              id: 'o1',
              label: 'Participants supported',
              value: 1200,
              unit: 'users',
              valueMode: 'absolute',
              timeframe: 'Q1 2025',
              baseline: null,
              after: null,
              confidence: 'exact',
            },
          ],
          supportingArtifacts: [],
        }}
      />
    );

    fireEvent.change(screen.getByLabelText(/Verifier email/i), {
      target: { value: 'manager@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^Title \*$/i), {
      target: { value: 'Unsaved changed title' },
    });

    fireEvent.click(screen.getByRole('button', { name: IMPACT_STORY_CONFIRMATION_BUTTON_LABEL }));

    await waitFor(() => expect(onSendVerificationRequest).toHaveBeenCalledTimes(1));
    expect(onSendVerificationRequest.mock.calls[0][0]).toMatchObject({
      storyId: 'impact-existing',
      storyDraft: expect.objectContaining({
        title: 'Unsaved changed title',
      }),
      verificationRequest: expect.objectContaining({
        verifierEmail: 'manager@example.com',
      }),
    });
  });

  it('blocks existing-story send when required fields are invalid', async () => {
    const onSendVerificationRequest = vi.fn();

    render(
      <ImpactStoryForm
        open={true}
        onOpenChange={vi.fn()}
        onSave={vi.fn()}
        onSaveExisting={vi.fn()}
        onSendVerificationRequest={onSendVerificationRequest}
        story={{
          id: 'impact-existing-invalid',
          title: 'Saved story',
          orgDescription: 'Org',
          impact: 'Impact',
          businessValue: 'Value',
          outcomes: 'Outcome',
          timeline: '2024',
          timelineStructured: { mode: 'single', precision: 'year', start: '2024' },
          verified: false,
          affiliationType: 'organization',
          affiliationDetails: 'Org',
          roleTitle: 'Lead',
          roleScope: 'owned',
          primaryCause: 'education',
          secondaryCauses: [],
          measuredOutcomes: [
            {
              id: 'o1',
              label: 'Participants supported',
              value: 1200,
              unit: 'users',
              valueMode: 'absolute',
              timeframe: 'Q1 2025',
              baseline: null,
              after: null,
              confidence: 'exact',
            },
          ],
          supportingArtifacts: [],
        }}
      />
    );

    fireEvent.change(screen.getByLabelText(/Verifier email/i), {
      target: { value: 'manager@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^Role title \*$/i), {
      target: { value: '' },
    });

    fireEvent.click(screen.getByRole('button', { name: IMPACT_STORY_CONFIRMATION_BUTTON_LABEL }));

    await waitFor(() => {
      expect(
        screen.getByText(/Please fix highlighted fields before sending the verification request/i)
      ).toBeTruthy();
    });
    expect(onSendVerificationRequest).not.toHaveBeenCalled();
  });
});
