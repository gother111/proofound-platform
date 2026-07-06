import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AssignmentBuilderLoading } from '@/app/app/o/[slug]/assignments/new/DeferredAssignmentBuilderClient';

describe('DeferredAssignmentBuilderClient', () => {
  it('announces the assignment builder while the client chunk loads', () => {
    render(<AssignmentBuilderLoading />);

    const status = screen.getByRole('status');

    expect(
      screen.getByRole('heading', { level: 1, name: 'Preparing assignment builder' })
    ).toBeInTheDocument();
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveTextContent('Assignment draft');
    expect(status).toHaveTextContent('private assignment workspace');
    expect(status).toHaveTextContent('review readiness');
    expect(status).toHaveTextContent('publish state stay unchanged');
    expect(screen.queryByText(/^loading\.\.\.$/i)).not.toBeInTheDocument();
  });
});
