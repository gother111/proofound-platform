import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ForbiddenPage from '@/app/403/page';

describe('ForbiddenPage', () => {
  it('renders recovery actions as clear links instead of nested interactive controls', () => {
    render(<ForbiddenPage />);

    expect(screen.getByRole('heading', { level: 1, name: '403' })).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Go to Overview' })).toHaveAttribute(
      'href',
      '/app/i/home'
    );
    expect(screen.getByRole('link', { name: 'Go to Home' })).toHaveAttribute('href', '/');
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
