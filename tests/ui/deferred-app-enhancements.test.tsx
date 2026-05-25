import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DeferredAppEnhancements } from '@/components/root/DeferredAppEnhancements';

describe('DeferredAppEnhancements', () => {
  it('does not mount the retired in-app chat widget on launch app routes', () => {
    render(<DeferredAppEnhancements />);

    expect(screen.queryByTestId('chat-widget')).not.toBeInTheDocument();
  });
});
