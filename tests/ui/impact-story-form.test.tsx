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

  it('submits structured impact story payload', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(<ImpactStoryForm open={true} onOpenChange={vi.fn()} onSave={onSave} />);

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
    expect(payload.roleTitle).toBe('Program Lead');
    expect(payload.roleScope).toBe('contributed');
    expect(payload.primaryCause).toBe('education');
    expect(payload.measuredOutcomes).toHaveLength(1);
    expect(payload.measuredOutcomes[0]).toMatchObject({
      label: 'Participants supported',
      value: 1200,
      unit: 'users',
      valueMode: 'absolute',
      timeframe: 'Q1 2025',
    });
  });

  it('requires valid verifier email when verification request is enabled', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(<ImpactStoryForm open={true} onOpenChange={vi.fn()} onSave={onSave} />);

    fillRequiredFields();

    fireEvent.click(screen.getByLabelText(/Send verification request/i));
    fireEvent.change(screen.getByLabelText(/Verifier email/i), {
      target: { value: 'invalid-email' },
    });

    fireEvent.submit(screen.getByRole('button', { name: /add story/i }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/Verifier email must be valid/i)).toBeTruthy();
    });
    expect(onSave).not.toHaveBeenCalled();
  });
});
