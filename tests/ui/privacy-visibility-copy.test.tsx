import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-current-value={value}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<any>, { value, onValueChange })
          : child
      )}
    </div>
  ),
  SelectTrigger: ({ id, value, onValueChange }: any) => (
    <select id={id} value={value} onChange={(event) => onValueChange(event.target.value)}>
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
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ location: 'private' }));

    fireEvent.change(screen.getByLabelText('Location'), {
      target: { value: 'network_only' },
    });

    expect(screen.queryByText('Privacy settings saved')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('You have unsaved changes');
  });

  it('shows save errors inline and keeps recommendation buttons named', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('The privacy service is unavailable.'));

    render(
      <IndividualFieldVisibilityControls userId="user-1" initialVisibility={{}} onSave={onSave} />
    );

    expect(
      screen.getByRole('button', { name: 'Show recommendation for Location' })
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Location'), {
      target: { value: 'private' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save privacy settings' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Privacy settings were not saved');
    expect(alert).toHaveTextContent('The privacy service is unavailable.');
  });
});
