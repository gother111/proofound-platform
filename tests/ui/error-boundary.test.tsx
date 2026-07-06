import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DataErrorBoundary,
  ErrorBoundary,
  FormErrorBoundary,
  InlineErrorBoundary,
} from '@/components/ErrorBoundary';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientErrorDiagnostic: vi.fn(),
}));

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

const dispatchClientErrorDiagnosticMock = vi.mocked(dispatchClientErrorDiagnostic);

function CrashingSection() {
  throw new Error('database stack trace with private table detail');
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps crash details out of the rendered recovery UI outside development', () => {
    render(
      <ErrorBoundary showDetails>
        <CrashingSection />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toHaveTextContent('This view could not finish loading');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Your work and privacy settings are still protected.'
    );
    expect(screen.getByRole('button', { name: /retry view/i })).toBeInTheDocument();
    expect(screen.queryByText(/database stack trace/i)).not.toBeInTheDocument();
    expect(dispatchClientErrorDiagnosticMock.mock.calls.join('\n')).not.toContain(
      'database stack trace'
    );
  });

  it('keeps inline and form fallbacks explicit about safe recovery', () => {
    render(
      <div>
        <InlineErrorBoundary>
          <CrashingSection />
        </InlineErrorBoundary>
        <FormErrorBoundary>
          <CrashingSection />
        </FormErrorBoundary>
      </div>
    );

    expect(screen.getByText('This section is paused')).toBeInTheDocument();
    expect(
      screen.getByText('Refresh the page before relying on this section.')
    ).toBeInTheDocument();
    expect(screen.getByText('This form paused before saving')).toBeInTheDocument();
    expect(
      screen.getByText(/No changes were submitted from this broken form state/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/database stack trace/i)).not.toBeInTheDocument();
  });

  it('keeps data-list fallbacks retryable without exposing crash details', () => {
    const onRetry = vi.fn();

    render(
      <DataErrorBoundary onRetry={onRetry}>
        <CrashingSection />
      </DataErrorBoundary>
    );

    expect(screen.getByText('This list could not load')).toBeInTheDocument();
    expect(screen.getByText(/The records are still safe/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /retry list/i }));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/database stack trace/i)).not.toBeInTheDocument();
  });
});
