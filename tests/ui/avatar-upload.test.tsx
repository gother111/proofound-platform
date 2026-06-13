import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AvatarUpload } from '@/components/profile/AvatarUpload';

const imageCompressionMock = vi.fn();
const dispatchClientDiagnosticMock = vi.fn();
const dispatchClientErrorDiagnosticMock = vi.fn();
const toastWarningMock = vi.fn();

vi.mock('browser-image-compression', () => ({
  default: (...args: unknown[]) => imageCompressionMock(...args),
}));

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientDiagnostic: (...args: unknown[]) => dispatchClientDiagnosticMock(...args),
  dispatchClientErrorDiagnostic: (...args: unknown[]) => dispatchClientErrorDiagnosticMock(...args),
}));

vi.mock('sonner', () => ({
  toast: {
    warning: (...args: unknown[]) => toastWarningMock(...args),
  },
}));

vi.mock('framer-motion', () => ({
  motion: {
    button: ({
      children,
      whileHover: _whileHover,
      onHoverStart: _onHoverStart,
      onHoverEnd: _onHoverEnd,
      ...props
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
      whileHover?: unknown;
      onHoverStart?: unknown;
      onHoverEnd?: unknown;
    }) => <button {...props}>{children}</button>,
    div: ({
      children,
      initial: _initial,
      animate: _animate,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & {
      initial?: unknown;
      animate?: unknown;
    }) => <div {...props}>{children}</div>,
    p: ({
      children,
      initial: _initial,
      animate: _animate,
      ...props
    }: React.HTMLAttributes<HTMLParagraphElement> & {
      initial?: unknown;
      animate?: unknown;
    }) => <p {...props}>{children}</p>,
  },
}));

describe('AvatarUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes the visible upload affordance as a real button', () => {
    const inputClickSpy = vi
      .spyOn(HTMLInputElement.prototype, 'click')
      .mockImplementation(() => undefined);

    render(<AvatarUpload avatar={null} onUpload={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Upload profile picture' }));

    expect(inputClickSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Choose profile picture file')).toBeInTheDocument();

    inputClickSpy.mockRestore();
  });

  it('labels an existing avatar action as a change and keeps invalid files safe', () => {
    render(<AvatarUpload avatar="data:image/png;base64,avatar" onUpload={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Change profile picture' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Choose profile picture file'), {
      target: {
        files: [new File(['not an image'], 'avatar.gif', { type: 'image/gif' })],
      },
    });

    expect(screen.getByText('Please upload a JPG, PNG, or WebP image')).toBeInTheDocument();
    expect(imageCompressionMock).not.toHaveBeenCalled();
    expect(dispatchClientDiagnosticMock).not.toHaveBeenCalled();
    expect(dispatchClientErrorDiagnosticMock).not.toHaveBeenCalled();
  });
});
