import React from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ErrorBoundary } from '@/components/ErrorBoundary';
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

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(screen.queryByText(/database stack trace/i)).not.toBeInTheDocument();
    expect(dispatchClientErrorDiagnosticMock.mock.calls.join('\n')).not.toContain(
      'database stack trace'
    );
  });
});
