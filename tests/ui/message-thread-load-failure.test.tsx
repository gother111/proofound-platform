import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MessageThreadLoadFailure } from '@/components/messaging/MessageThreadLoadFailure';

describe('MessageThreadLoadFailure', () => {
  it('keeps assignment-thread recovery contextual and privacy-safe', () => {
    const onBack = vi.fn();
    const onRetry = vi.fn();

    render(
      <MessageThreadLoadFailure
        title="Assignment thread messages could not load"
        description="This assignment thread did not finish loading. Messages, reveal requests, and review context are still safe; retry before replying."
        onBack={onBack}
        onRetry={onRetry}
      />
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Assignment thread messages could not load');
    expect(alert).toHaveTextContent('review context are still safe');
    expect(alert).toHaveTextContent('Privacy and reveal state were not changed.');
    expect(alert).not.toHaveTextContent(/^Thread messages could not load$/);

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    fireEvent.click(screen.getByRole('button', { name: 'Retry thread messages' }));

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('keeps the default heading for legacy callers', () => {
    render(
      <MessageThreadLoadFailure
        description="This thread did not finish loading."
        onRetry={vi.fn()}
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Thread messages could not load');
  });
});
