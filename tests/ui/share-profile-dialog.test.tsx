import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ShareProfileDialog } from '@/components/profile/ShareProfileDialog';

const toastMock = vi.fn();
const apiFetchMock = vi.fn();

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: any[]) => apiFetchMock(...args),
}));

vi.mock('@/hooks/use-responsive-modal-mode', () => ({
  useResponsiveModalMode: () => true,
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
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
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

vi.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange, ...props }: any) => (
    <input
      type="checkbox"
      checked={Boolean(checked)}
      onChange={(event) => onCheckedChange?.(event.target.checked)}
      {...props}
    />
  ),
}));

vi.mock('@/components/ui/radio-group', () => ({
  RadioGroup: ({ children }: any) => <div>{children}</div>,
  RadioGroupItem: (props: any) => <input type="radio" {...props} />,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: any) => <div>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children }: any) => <button type="button">{children}</button>,
  TabsContent: ({ children }: any) => <div>{children}</div>,
}));

describe('ShareProfileDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds embed code from the generated snippet URL', async () => {
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        snippet: {
          id: 'snippet-1',
          shareToken: 'token123',
          url: 'https://proofound.io/p/token123',
        },
      }),
    });

    render(
      <ShareProfileDialog
        isOpen={true}
        onClose={() => {}}
        userName="Jane Doe"
        userHeadline="Impact Builder"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /generate shareable link/i }));

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));

    const embedTextarea = document.querySelector('textarea') as HTMLTextAreaElement | null;
    expect(embedTextarea).not.toBeNull();
    expect(embedTextarea?.value).toContain('https://proofound.io/p/token123/embed');
    expect(embedTextarea?.value).not.toContain('proofound.com');
  });

  it('allows continuous typing in expiration input without focus loss', () => {
    render(
      <ShareProfileDialog
        isOpen={true}
        onClose={() => {}}
        userName="Jane Doe"
        userHeadline="Impact Builder"
      />
    );

    const expirationInput = screen.getByPlaceholderText(
      /Days until link expires/i
    ) as HTMLInputElement;

    expirationInput.focus();
    expect(document.activeElement).toBe(expirationInput);

    fireEvent.change(expirationInput, { target: { value: '3' } });
    expect(expirationInput).toHaveValue(3);
    expect(document.activeElement).toBe(expirationInput);

    fireEvent.change(expirationInput, { target: { value: '30' } });
    expect(expirationInput).toHaveValue(30);
    expect(document.activeElement).toBe(expirationInput);
  });
});
