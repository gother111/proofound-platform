import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ProfileSkillPicker } from '@/components/profile/forms/ProfileSkillPicker';

describe('ProfileSkillPicker touch targets', () => {
  it('keeps selected skill removal easy to tap and updates selected skills', () => {
    const onChange = vi.fn();

    render(
      <ProfileSkillPicker
        availableSkills={['React', 'TypeScript']}
        selectedSkills={['React']}
        onChange={onChange}
      />
    );

    const removeButton = screen.getByRole('button', { name: 'Remove React' });

    expect(removeButton).toHaveClass('min-h-[44px]', 'min-w-[44px]');

    fireEvent.click(removeButton);

    expect(onChange).toHaveBeenCalledWith([]);
  });
});
