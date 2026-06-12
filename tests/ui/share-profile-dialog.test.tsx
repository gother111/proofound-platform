import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ShareProfileDialog } from '@/components/profile/ShareProfileDialog';

const toastMock = vi.fn();
const apiFetchMock = vi.fn();
const clipboardWriteTextMock = vi.fn();
const dispatchClientDiagnosticMock = vi.fn();
const dispatchClientErrorDiagnosticMock = vi.fn();

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: any[]) => apiFetchMock(...args),
}));

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientDiagnostic: (...args: any[]) => dispatchClientDiagnosticMock(...args),
  dispatchClientErrorDiagnostic: (...args: any[]) => dispatchClientErrorDiagnosticMock(...args),
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
    clipboardWriteTextMock.mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: clipboardWriteTextMock,
      },
    });
  });

  it('builds embed code from the launch Public Page URL without calling archived snippet APIs', async () => {
    render(
      <ShareProfileDialog
        isOpen={true}
        onClose={() => {}}
        userName="Jane Doe"
        userHeadline="Impact Builder"
        publicPagePath="/portfolio/jane-doe"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /generate shareable link/i }));

    await waitFor(() => expect(screen.getByDisplayValue(/\/portfolio\/jane-doe$/)).toBeVisible());

    const embedTextarea = document.querySelector('textarea') as HTMLTextAreaElement | null;
    expect(embedTextarea).not.toBeNull();
    expect(embedTextarea?.value).toContain('/portfolio/jane-doe/embed');
    expect(embedTextarea?.value).not.toContain('proofound.com');
    expect(apiFetchMock).not.toHaveBeenCalledWith('/api/profile/snippet', expect.anything());
  });

  it('allows continuous typing in expiration input without focus loss', () => {
    render(
      <ShareProfileDialog
        isOpen={true}
        onClose={() => {}}
        userName="Jane Doe"
        userHeadline="Impact Builder"
        publicPagePath="/portfolio/jane-doe"
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

  it('disables sharing when a Public Page path is not ready', () => {
    render(
      <ShareProfileDialog
        isOpen={true}
        onClose={() => {}}
        userName="Jane Doe"
        userHeadline="Impact Builder"
      />
    );

    expect(screen.getByRole('button', { name: /public page not ready/i })).toBeDisabled();
    expect(apiFetchMock).not.toHaveBeenCalledWith('/api/profile/snippet', expect.anything());
  });

  it('keeps public-page sharing proof-safe without branded social copy', async () => {
    render(
      <ShareProfileDialog
        isOpen={true}
        onClose={() => {}}
        userName="Jane Doe"
        userHeadline="Proof operations lead"
        publicPagePath="/portfolio/jane-doe"
      />
    );

    expect(screen.getAllByText('Share Your Public Page').length).toBeGreaterThan(0);
    expect(document.body.textContent ?? '').not.toMatch(/professional profile/i);

    fireEvent.click(screen.getByRole('button', { name: /generate shareable link/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Outreach' })).toBeVisible());

    expect(screen.getByRole('button', { name: 'Outreach' })).toBeInTheDocument();
    expect(screen.getByText('Proof-safe outreach copy')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(
        "Review Jane Doe's proof-backed Public Page on Proofound - Proof operations lead"
      )
    ).toBeInTheDocument();
    expect(document.body.textContent ?? '').not.toMatch(/LinkedIn|Twitter|social/i);
    expect(apiFetchMock).not.toHaveBeenCalledWith('/api/profile/snippet', expect.anything());
  });

  it('keeps failed share-link generation retryable without raw URL text', async () => {
    render(
      <ShareProfileDialog
        isOpen={true}
        onClose={() => {}}
        userName="Jane Doe"
        userHeadline="Proof operations lead"
        publicPagePath="http://["
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/Days until link expires/i), {
      target: { value: '30' },
    });
    fireEvent.click(screen.getByRole('button', { name: /generate shareable link/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'Public Page link could not be created. Your sharing options are still here; please try again.'
    );
    expect(alert).not.toHaveTextContent('Invalid URL');
    expect(screen.getByPlaceholderText(/Days until link expires/i)).toHaveValue(30);
    expect(screen.getByRole('button', { name: /generate shareable link/i })).toBeEnabled();
    expect(screen.queryByDisplayValue(/http:\/\/\[/)).not.toBeInTheDocument();
    expect(dispatchClientDiagnosticMock).toHaveBeenCalledWith('profile.snippet.generate_failed', {
      error: expect.stringContaining('Invalid URL'),
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Share link not created',
        description:
          'Public Page link could not be created. Your sharing options are still here; please try again.',
        variant: 'destructive',
      })
    );
    expect(apiFetchMock).not.toHaveBeenCalledWith('/api/profile/snippet', expect.anything());
  });

  it('copies the shareable URL with visible confirmation', async () => {
    render(
      <ShareProfileDialog
        isOpen={true}
        onClose={() => {}}
        userName="Jane Doe"
        userHeadline="Proof operations lead"
        publicPagePath="/portfolio/jane-doe"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /generate shareable link/i }));
    await waitFor(() => expect(screen.getByDisplayValue(/\/portfolio\/jane-doe$/)).toBeVisible());

    fireEvent.click(screen.getByRole('button', { name: 'Copy shareable URL' }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Shareable URL copied to clipboard.');
    });
    expect(clipboardWriteTextMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/portfolio\/jane-doe$/)
    );
  });

  it('keeps failed copy actions visible and retryable without hiding the share URL', async () => {
    clipboardWriteTextMock.mockRejectedValueOnce(new Error('Clipboard permission denied'));

    render(
      <ShareProfileDialog
        isOpen={true}
        onClose={() => {}}
        userName="Jane Doe"
        userHeadline="Proof operations lead"
        publicPagePath="/portfolio/jane-doe"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /generate shareable link/i }));
    await waitFor(() => expect(screen.getByDisplayValue(/\/portfolio\/jane-doe$/)).toBeVisible());

    fireEvent.click(screen.getByRole('button', { name: 'Copy shareable URL' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'Shareable URL could not be copied. Select the text manually or try again.'
    );
    expect(screen.getByDisplayValue(/\/portfolio\/jane-doe$/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Copy shareable URL' })).toBeEnabled();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Copy did not work',
        variant: 'destructive',
      })
    );
  });
});
