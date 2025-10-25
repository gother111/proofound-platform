import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PersonaChoice } from '../PersonaChoice';
import { PERSONA } from '@/constants/persona';

describe('PersonaChoice', () => {
  it('emits org_member when organization path is selected', () => {
    const onSelect = vi.fn();
    render(<PersonaChoice onSelect={onSelect} />);

    const organizationButton = screen.getByRole('button', {
      name: /continue as organization/i,
    });

    fireEvent.click(organizationButton);

    expect(onSelect).toHaveBeenCalledWith(PERSONA.ORG_MEMBER);
  });
});
