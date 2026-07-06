import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { IndividualMatchingEmpty } from '@/components/matching/IndividualMatchingEmpty';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe('IndividualMatchingEmpty', () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it('keeps the first-run assignment review setup proof-first and privacy-safe', () => {
    const onSetup = vi.fn();

    render(<IndividualMatchingEmpty onSetup={onSetup} />);

    expect(
      screen.getByRole('heading', { name: 'Prepare assignment reviews at your pace' })
    ).toBeInTheDocument();
    expect(screen.getByText('Assignment reviews open in order')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /set review preferences/i })).toHaveLength(2);
    expect(
      screen.getByText('Add constraints and preferences so assignment reviews stay relevant.')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Refresh proof-backed work examples before opening assignment reviews further.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Confirm what is public, private, and only visible after review-stage reveal.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Takes about five minutes. Blind by default.')).toBeInTheDocument();

    expect(screen.queryByText('Prepare matching at your pace')).not.toBeInTheDocument();
    expect(screen.queryByText('Set up matching profile')).not.toBeInTheDocument();
    expect(screen.queryByText('Matching opens in order')).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /set review preferences/i })[0]);
    expect(onSetup).toHaveBeenCalledTimes(1);
  });

  it('routes proof and privacy remediation actions to the right surfaces', () => {
    render(<IndividualMatchingEmpty onSetup={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /review proof readiness/i }));
    expect(pushMock).toHaveBeenCalledWith('/app/i/profile?profileView=full&tab=proof_packs');

    fireEvent.click(screen.getByRole('button', { name: /review privacy first/i }));
    expect(pushMock).toHaveBeenCalledWith('/app/i/settings/privacy');
  });
});
