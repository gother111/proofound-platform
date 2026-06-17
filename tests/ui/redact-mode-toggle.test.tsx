import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RedactModeToggle } from '@/components/privacy/RedactModeToggle';

const dispatchClientErrorDiagnosticMock = vi.fn();
const toastErrorMock = vi.fn();
const toastSuccessMock = vi.fn();

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientErrorDiagnostic: (...args: unknown[]) => dispatchClientErrorDiagnosticMock(...args),
}));

vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => toastErrorMock(...args),
    success: (...args: unknown[]) => toastSuccessMock(...args),
  },
}));

describe('RedactModeToggle', () => {
  it('keeps redact mode failure copy user-safe and recovery-oriented', () => {
    const updateError = new Error('privacy_debug_user_user-1_policy_denied');
    const onChange = vi.fn(() => {
      throw updateError;
    });

    render(<RedactModeToggle enabled={false} onChange={onChange} />);

    fireEvent.click(screen.getByRole('switch', { name: 'Toggle redact mode' }));

    expect(onChange).toHaveBeenCalledWith(true);
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'privacy.redact_mode.toggle_failed',
      updateError
    );
    expect(toastErrorMock).toHaveBeenCalledWith('Redact mode was not changed', {
      description:
        'Your current privacy view is unchanged. Retry redact mode before sharing your screen.',
    });
    expect(JSON.stringify(toastErrorMock.mock.calls)).not.toContain('privacy_debug');
    expect(toastSuccessMock).not.toHaveBeenCalled();
  });
});
