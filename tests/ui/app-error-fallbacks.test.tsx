import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AppError from '@/app/error';
import GlobalError from '@/app/global-error';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
import * as Sentry from '@sentry/nextjs';

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientErrorDiagnostic: vi.fn(),
}));

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
const originalConsoleError = console.error;

function buildPrivateError() {
  return Object.assign(new Error('database role leak for private proof table'), {
    digest: 'digest-private-proof-123',
  });
}

describe('app error fallbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      const message = args.map(String).join(' ');
      if (message.includes('validateDOMNesting') && message.includes('<html>')) return;
      originalConsoleError(...args);
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('keeps the route-level fallback proof-safe and retryable', () => {
    const reset = vi.fn();

    render(<AppError error={buildPrivateError()} reset={reset} />);

    expect(
      screen.getByRole('heading', { name: 'This page could not finish loading' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Your proof, privacy settings, and review work are still protected/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/database role leak/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/digest-private-proof/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry page' }));

    expect(reset).toHaveBeenCalledTimes(1);
    expect(dispatchClientErrorDiagnostic).toHaveBeenCalledWith(
      'app.error_boundary.caught',
      expect.any(Error)
    );
  });

  it('keeps the global fallback proof-safe and retryable', () => {
    const reset = vi.fn();

    render(<GlobalError error={buildPrivateError()} reset={reset} />);

    expect(
      screen.getByRole('heading', { name: 'Proofound could not finish loading' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Your proof, privacy settings, and review work are still protected/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/contact support before making changes from this screen/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/database role leak/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/digest-private-proof/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry Proofound' }));

    expect(reset).toHaveBeenCalledTimes(1);
    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error));
  });
});
