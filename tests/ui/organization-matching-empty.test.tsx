import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { OrganizationMatchingEmpty } from '@/components/matching/OrganizationMatchingEmpty';

const routerPushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: routerPushMock,
  }),
}));

describe('OrganizationMatchingEmpty', () => {
  it('keeps recovery actions keyboard-visible and icons decorative', () => {
    const onCreateAssignment = vi.fn();

    const { container } = render(
      <OrganizationMatchingEmpty orgSlug="test-org" onCreateAssignment={onCreateAssignment} />
    );

    const publishAction = screen.getByRole('button', { name: /Publish assignment/i });
    expect(publishAction).toHaveClass('focus-visible:ring-2');
    expect(publishAction).toHaveClass('focus-visible:ring-proofound-forest');
    expect(publishAction).toHaveClass('focus-visible:ring-offset-2');

    fireEvent.click(publishAction);
    expect(onCreateAssignment).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Add skill requirements/i }));
    expect(routerPushMock).toHaveBeenCalledWith('/app/o/test-org/assignments/new?focus=skills');

    const decorativeIcons = container.querySelectorAll('svg[aria-hidden="true"]');
    expect(decorativeIcons.length).toBeGreaterThanOrEqual(4);
  });
});
