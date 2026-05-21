import { describe, expect, it, vi } from 'vitest';
import { dispatchClientDiagnostic, dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';

describe('client diagnostics', () => {
  it('dispatches local diagnostics without console output', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    dispatchClientDiagnostic('interviews.individual.load_failed', { route: '/app/i/interviews' });

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'proofound:client-diagnostic',
        detail: {
          reason: 'interviews.individual.load_failed',
          route: '/app/i/interviews',
        },
      })
    );
  });

  it('serializes client error diagnostics to safe messages', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    dispatchClientErrorDiagnostic('interviews.organization.load_failed', new Error('network down'));

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'proofound:client-diagnostic',
        detail: {
          reason: 'interviews.organization.load_failed',
          error: 'network down',
        },
      })
    );
  });
});
