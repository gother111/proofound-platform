import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { VolunteerForm } from '@/components/profile/forms/VolunteerForm';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a
      href={typeof href === 'string' ? href : '/app/i/profile?profileView=full&tab=proof_packs'}
      {...props}
    >
      {children}
    </a>
  ),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: any) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <div>{children}</div>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, asChild, ...props }: any) => {
    if (asChild) {
      return <span>{children}</span>;
    }
    return <button {...props}>{children}</button>;
  },
}));

vi.mock('@/components/ui/input', () => {
  const MockInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    (props, ref) => <input ref={ref} {...props} />
  );
  MockInput.displayName = 'MockInput';
  return { Input: MockInput };
});

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor, ...rest }: any) => (
    <label htmlFor={htmlFor ?? 'mock-label'} {...rest}>
      {children}
    </label>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

describe('VolunteerForm skill picker', () => {
  it('requires selected proof skills and serializes selected values on save', async () => {
    const onSave = vi.fn();
    const volunteering = {
      id: 'vol-1',
      title: 'Board Advisor',
      orgDescription: 'Youth climate NGO',
      duration: '2021 - Present',
      cause: 'Climate Justice',
      impact: 'Built onboarding process',
      skillsDeployed: 'Legacy Skill',
      personalWhy: 'Personal motivation',
      verified: false,
    };

    render(
      <VolunteerForm
        open={true}
        onOpenChange={() => {}}
        volunteering={volunteering}
        availableSkills={['React', 'TypeScript']}
        onSave={onSave}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));
    await waitFor(() => {
      expect(screen.getByText(/Select at least one skill/i)).toBeTruthy();
    });
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'React' }));
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const payload = onSave.mock.calls[0][0];
    expect(payload.skillsDeployed).toBe('React');
    expect(payload.title).toBe('Board Advisor');
  });
});
