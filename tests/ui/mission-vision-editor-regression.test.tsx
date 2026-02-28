import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MissionEditor } from '@/components/profile/MissionEditor';
import { VisionEditor } from '@/components/profile/VisionEditor';

describe('Mission and vision editor regression coverage', () => {
  it('renders MissionEditor in open state and saves mission payload', () => {
    const onOpenChange = vi.fn();
    const onSave = vi.fn();

    const { rerender } = render(
      <MissionEditor
        open={true}
        onOpenChange={onOpenChange}
        mission="Build trust"
        missionLinks={{ values: ['Integrity'], causes: ['Climate Justice'] }}
        availableValues={['Integrity']}
        availableCauses={['Climate Justice']}
        visibility="public"
        onSave={onSave}
      />
    );

    expect(screen.getByText('Your Mission')).toBeInTheDocument();

    // Re-render with fresh array references to mirror parent re-renders.
    rerender(
      <MissionEditor
        open={true}
        onOpenChange={onOpenChange}
        mission="Build trust"
        missionLinks={{ values: ['Integrity'], causes: ['Climate Justice'] }}
        availableValues={['Integrity']}
        availableCauses={['Climate Justice']}
        visibility="public"
        onSave={onSave}
      />
    );

    fireEvent.change(screen.getByLabelText('Mission Statement'), {
      target: { value: '  Build more trust  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Mission' }));

    expect(onSave).toHaveBeenCalledWith(
      'Build more trust',
      { values: ['Integrity'], causes: ['Climate Justice'] },
      'public'
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders VisionEditor in open state and saves vision payload', () => {
    const onOpenChange = vi.fn();
    const onSave = vi.fn();

    const { rerender } = render(
      <VisionEditor
        open={true}
        onOpenChange={onOpenChange}
        vision="Scale equitable systems"
        visionLinks={{ values: ['Integrity'], causes: ['Climate Justice'] }}
        availableValues={['Integrity']}
        availableCauses={['Climate Justice']}
        visibility="network"
        onSave={onSave}
      />
    );

    expect(screen.getByText('Your Vision')).toBeInTheDocument();

    // Re-render with fresh array references to mirror parent re-renders.
    rerender(
      <VisionEditor
        open={true}
        onOpenChange={onOpenChange}
        vision="Scale equitable systems"
        visionLinks={{ values: ['Integrity'], causes: ['Climate Justice'] }}
        availableValues={['Integrity']}
        availableCauses={['Climate Justice']}
        visibility="network"
        onSave={onSave}
      />
    );

    fireEvent.change(screen.getByLabelText('Vision Statement'), {
      target: { value: '  Expand equitable systems  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Vision' }));

    expect(onSave).toHaveBeenCalledWith(
      'Expand equitable systems',
      { values: ['Integrity'], causes: ['Climate Justice'] },
      'network'
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
