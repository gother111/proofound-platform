import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ImpactStoryForm } from '@/components/profile/forms/ImpactStoryForm';

const uploadFileMock = vi.fn();
const validateFileMock = vi.fn();

vi.mock('@/lib/upload', () => ({
  uploadFile: (...args: any[]) => uploadFileMock(...args),
  validateFile: (...args: any[]) => validateFileMock(...args),
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

  fireEvent.change(screen.getByLabelText(/Primary cause/i), {
    target: { value: 'education' },
  });

  fireEvent.change(screen.getByPlaceholderText(/Participants served/i), {
    target: { value: 'Participants supported' },
  });

  fireEvent.change(screen.getByPlaceholderText(/Q3 2025/i), {
    target: { value: 'Q1 2025' },
  });

  fireEvent.change(screen.getByPlaceholderText(/1200/i), {
    target: { value: '1200' },
  });

  fireEvent.change(screen.getByPlaceholderText(/users, %, USD/i), {
    target: { value: 'users' },
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
    expect(payload.verificationRequest).toBeNull();
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

    fireEvent.click(screen.getByRole('button', { name: /send request/i }));

    await waitFor(() => {
      expect(screen.getByText(/Verifier email must be valid/i)).toBeTruthy();
    });
    expect(onSendVerificationRequest).not.toHaveBeenCalled();
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

    fireEvent.click(screen.getByRole('button', { name: /send request/i }));

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

    fireEvent.click(screen.getByRole('button', { name: /send request/i }));

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

    fireEvent.click(screen.getByRole('button', { name: /send request/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Please fix highlighted fields before sending the verification request/i)
      ).toBeTruthy();
    });
    expect(onSendVerificationRequest).not.toHaveBeenCalled();
  });
});
