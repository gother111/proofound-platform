import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { EducationForm } from '@/components/profile/forms/EducationForm';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={typeof href === 'string' ? href : '/app/i/expertise'} {...props}>
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

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

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

describe('EducationForm skill picker', () => {
  it('blocks save and guides user when no Expertise Atlas skills exist', () => {
    const onSave = vi.fn();

    render(
      <EducationForm open={true} onOpenChange={() => {}} availableSkills={[]} onSave={onSave} />
    );

    expect(
      screen.getByText(/You need skills in your Expertise Atlas before adding education entries/i)
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: /Go to Expertise Atlas/i })).toHaveAttribute(
      'href',
      '/app/i/expertise'
    );
    expect(screen.getByRole('button', { name: /Add Education/i })).toHaveAttribute('disabled');
  });

  it('prefills matching legacy skills, drops unmatched legacy text, and saves selected picker skills', () => {
    const onSave = vi.fn();
    const education = {
      id: 'edu-1',
      institution: 'Test University',
      degree: 'MSc Policy',
      duration: '2020 - 2022',
      skills: 'Legacy Skill, React',
      projects: 'Capstone project',
      verified: false,
    };

    render(
      <EducationForm
        open={true}
        onOpenChange={() => {}}
        education={education}
        availableSkills={['React', 'TypeScript']}
        onSave={onSave}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'TypeScript' }));
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    expect(onSave).toHaveBeenCalledTimes(1);
    const payload = onSave.mock.calls[0][0];
    expect(payload.skills).toBe('React, TypeScript');
    expect(payload.skills).not.toContain('Legacy Skill');
    expect(payload.institution).toBe('Test University');
    expect(payload.degree).toBe('MSc Policy');
  });
});
