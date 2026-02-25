import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ExperienceForm } from '@/components/profile/forms/ExperienceForm';

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: any) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock('@/components/ui/input', async () => {
  const react = await import('react');
  const Input = react.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>((props, ref) => (
    <input ref={ref} {...props} />
  ));
  Input.displayName = 'MockInput';

  return { Input };
});

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor, ...rest }: any) => (
    <label htmlFor={htmlFor} {...rest}>
      {children}
    </label>
  ),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('ExperienceForm', () => {
  function renderForm(overrides?: Partial<React.ComponentProps<typeof ExperienceForm>>) {
    const onSave = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <ExperienceForm open={true} onOpenChange={onOpenChange} onSave={onSave} {...overrides} />
    );

    return { onSave, onOpenChange };
  }

  function fillRequiredTextFields() {
    fireEvent.change(screen.getByLabelText(/Role\/Title/i), { target: { value: 'Product Lead' } });
    fireEvent.change(screen.getByLabelText(/Organization/i), {
      target: { value: 'Proofound' },
    });
    fireEvent.change(screen.getByLabelText(/Outcomes/i), {
      target: { value: 'Reduced average hiring cycle time by 32%.' },
    });
    fireEvent.change(screen.getByLabelText(/Projects/i), {
      target: { value: 'Launched interview rubric revamp.' },
    });
    fireEvent.change(screen.getByLabelText(/Colleagues/i), {
      target: { value: 'Partnered with recruiting and engineering leads.' },
    });
    fireEvent.change(screen.getByLabelText(/Achievements/i), {
      target: { value: 'Established first skills-based hiring pilot.' },
    });
  }

  it('requires start month', async () => {
    const { onSave } = renderForm();

    fillRequiredTextFields();
    fireEvent.click(screen.getByRole('button', { name: /Add Experience/i }));

    await waitFor(() => expect(screen.getByText('Start month is required')).toBeInTheDocument());
    expect(onSave).not.toHaveBeenCalled();
  });

  it('accepts empty end month and emits present timeline', async () => {
    const { onSave } = renderForm();

    fillRequiredTextFields();
    fireEvent.change(screen.getByLabelText(/Start month/i), { target: { value: '2024-01' } });

    fireEvent.click(screen.getByRole('button', { name: /Add Experience/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: '2024-01-01',
        endDate: null,
        duration: 'Jan 2024 - Present',
      })
    );
  });

  it('rejects end month earlier than start month', async () => {
    const { onSave } = renderForm();

    fillRequiredTextFields();
    fireEvent.change(screen.getByLabelText(/Start month/i), { target: { value: '2024-06' } });
    fireEvent.change(screen.getByLabelText(/End month/i), { target: { value: '2024-05' } });

    fireEvent.click(screen.getByRole('button', { name: /Add Experience/i }));

    await waitFor(() =>
      expect(screen.getByText('End month cannot be earlier than start month')).toBeInTheDocument()
    );
    expect(onSave).not.toHaveBeenCalled();
  });
});
