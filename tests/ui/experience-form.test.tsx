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
    fireEvent.change(screen.getByLabelText(/Organization Name/i), {
      target: { value: 'Proofound' },
    });
    fireEvent.change(screen.getByLabelText(/Industry/i), { target: { value: 'Technology' } });

    fireEvent.change(screen.getByPlaceholderText(/Hiring cycle time/i), {
      target: { value: 'Reduced hiring cycle time' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Interview rubric revamp/i), {
      target: { value: 'Interview rubric revamp' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Jan 2024 - May 2024/i), {
      target: { value: 'Jan 2024 - Present' },
    });
  }

  it('requires start month', async () => {
    const { onSave } = renderForm();

    fillRequiredTextFields();
    fireEvent.click(screen.getByRole('button', { name: /Add Experience/i }));

    await waitFor(() => expect(screen.getByText('Start month is required')).toBeInTheDocument());
    expect(onSave).not.toHaveBeenCalled();
  });

  it('accepts ongoing timeline and emits endDate null', async () => {
    const { onSave } = renderForm();

    fillRequiredTextFields();
    fireEvent.change(screen.getByLabelText(/Start month/i), { target: { value: '2024-01' } });
    fireEvent.click(screen.getByLabelText(/Ongoing/i));

    fireEvent.click(screen.getByRole('button', { name: /Add Experience/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: '2024-01-01',
        endDate: null,
        duration: 'Jan 2024 - Present',
        organizationName: 'Proofound',
        measuredOutcomes: [
          expect.objectContaining({
            name: 'Reduced hiring cycle time',
          }),
        ],
        projectEntries: [
          expect.objectContaining({
            name: 'Interview rubric revamp',
            duration: 'Jan 2024 - Present',
          }),
        ],
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

  it('requires custom industry text when Other is selected', async () => {
    const { onSave } = renderForm();

    fillRequiredTextFields();
    fireEvent.change(screen.getByLabelText(/Industry/i), { target: { value: 'Other' } });
    fireEvent.change(screen.getByLabelText(/Start month/i), { target: { value: '2024-06' } });
    fireEvent.click(screen.getByLabelText(/Ongoing/i));

    fireEvent.click(screen.getByRole('button', { name: /Add Experience/i }));

    await waitFor(() =>
      expect(screen.getByText('Enter custom industry when selecting Other')).toBeInTheDocument()
    );
    expect(onSave).not.toHaveBeenCalled();
  });
});
