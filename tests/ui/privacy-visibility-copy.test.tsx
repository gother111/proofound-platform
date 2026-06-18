import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { dispatchClientErrorDiagnosticMock, toastErrorMock, toastSuccessMock } = vi.hoisted(() => ({
  dispatchClientErrorDiagnosticMock: vi.fn(),
  toastErrorMock: vi.fn(),
  toastSuccessMock: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => toastErrorMock(...args),
    success: (...args: unknown[]) => toastSuccessMock(...args),
  },
}));

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientErrorDiagnostic: (...args: unknown[]) => dispatchClientErrorDiagnosticMock(...args),
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange, disabled }: any) => (
    <div data-current-value={value}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<any>, {
              value,
              onValueChange,
              disabled,
            })
          : child
      )}
    </div>
  ),
  SelectTrigger: ({ id, value, onValueChange, disabled, className }: any) => (
    <select
      id={id}
      value={value}
      disabled={disabled}
      className={className}
      onChange={(event) => onValueChange(event.target.value)}
    >
      <option value="public">Public</option>
      <option value="network_only">Trusted review context</option>
      <option value="match_only">Assignment review</option>
      <option value="private">Private</option>
    </select>
  ),
  SelectValue: () => null,
  SelectContent: () => null,
  SelectItem: () => null,
}));

import { IndividualFieldVisibilityControls } from '@/components/profile/IndividualFieldVisibilityControls';

describe('privacy visibility copy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('frames visibility as Public Page control instead of broad profile exposure', () => {
    render(
      <IndividualFieldVisibilityControls userId="user-1" initialVisibility={{}} onSave={vi.fn()} />
    );

    expect(
      screen.getByRole('heading', { level: 3, name: 'Public Page visibility' })
    ).toBeInTheDocument();
    expect(screen.getByText(/Visible on your Public Page/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Trusted review context/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Visible only in trusted review contexts/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Assignment review/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/Visible only after assignment-review access applies/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Short proof-context headline/i)).toBeInTheDocument();
    expect(screen.getByText(/Public Page and assignment-review surfaces/i)).toBeInTheDocument();
    expect(document.body.textContent ?? '').not.toMatch(/Profile visibility/i);
    expect(document.body.textContent ?? '').not.toMatch(/visible to everyone/i);
    expect(document.body.textContent ?? '').not.toMatch(/Professional headline/i);
    expect(document.body.textContent ?? '').not.toMatch(/Visible to your connections/i);
    expect(document.body.textContent ?? '').not.toMatch(/Visible after a mutual match/i);
  });

  it('keeps long trust visibility labels roomy at wide breakpoints', () => {
    render(
      <IndividualFieldVisibilityControls userId="user-1" initialVisibility={{}} onSave={vi.fn()} />
    );

    expect(screen.getByLabelText('Location')).toHaveClass('w-full', 'lg:w-[280px]');
    expect(screen.getByLabelText('Location')).not.toHaveClass('sm:w-[140px]');
  });

  it('shows durable save feedback and clears it when visibility changes again', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <IndividualFieldVisibilityControls userId="user-1" initialVisibility={{}} onSave={onSave} />
    );

    fireEvent.change(screen.getByLabelText('Location'), {
      target: { value: 'private' },
    });
    expect(screen.getByRole('status')).toHaveTextContent('You have unsaved changes');

    fireEvent.click(screen.getByRole('button', { name: 'Save privacy settings' }));

    expect(await screen.findByText('Privacy settings saved')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Your Public Page and assignment-review visibility preferences are up to date.'
      )
    ).toBeInTheDocument();
    expect(toastSuccessMock).toHaveBeenCalledWith('Privacy settings saved', {
      description: 'Your Public Page and assignment-review visibility preferences are up to date.',
    });
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ location: 'private' }));

    fireEvent.change(screen.getByLabelText('Location'), {
      target: { value: 'network_only' },
    });

    expect(screen.queryByText('Privacy settings saved')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('You have unsaved changes');
  });

  it('shows save errors inline and keeps privacy guidance buttons named', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('The privacy service is unavailable.'));

    render(
      <IndividualFieldVisibilityControls userId="user-1" initialVisibility={{}} onSave={onSave} />
    );

    expect(screen.getByRole('button', { name: 'Show privacy guidance for Location' })).toHaveClass(
      'h-11',
      'w-11',
      'shrink-0'
    );
    expect(screen.getAllByText('Privacy default').length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText('Location'), {
      target: { value: 'private' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save privacy settings' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Privacy settings were not saved');
    expect(alert).toHaveTextContent(
      'Your Public Page visibility was not changed. Review the selected fields and retry before leaving this page.'
    );
    expect(alert).not.toHaveTextContent('The privacy service is unavailable.');
    expect(toastErrorMock).toHaveBeenCalledWith('Privacy settings were not saved', {
      description:
        'Your Public Page visibility was not changed. Review the selected fields and retry before leaving this page.',
    });
    expect(toastErrorMock).not.toHaveBeenCalledWith('Failed to save settings', expect.anything());
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'privacy.field_visibility.save_failed',
      expect.any(Error)
    );
    expect((dispatchClientErrorDiagnosticMock.mock.calls[0]?.[1] as Error).message).toBe(
      'The privacy service is unavailable.'
    );
  });

  it('pauses visibility edits when saved privacy preferences did not load', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <IndividualFieldVisibilityControls
        userId="user-1"
        initialVisibility={{}}
        onSave={onSave}
        controlsDisabledReason="Saved privacy preferences did not load. Retry before editing."
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Visibility controls are paused');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Saved privacy preferences did not load. Retry before editing.'
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'Retry privacy preferences before editing. Saved choices were not loaded.'
    );
    expect(screen.getByLabelText('Location')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Save privacy settings' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Location'), {
      target: { value: 'private' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save privacy settings' }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.queryByText('You have unsaved changes')).not.toBeInTheDocument();
  });
});
