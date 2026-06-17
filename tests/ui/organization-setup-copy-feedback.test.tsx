import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  completeOrganizationOnboardingMock,
  createClientMock,
  dispatchClientDiagnosticMock,
  pushMock,
} = vi.hoisted(() => ({
  completeOrganizationOnboardingMock: vi.fn(),
  createClientMock: vi.fn(),
  dispatchClientDiagnosticMock: vi.fn(),
  pushMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock('@/actions/onboarding', () => ({
  completeOrganizationOnboarding: completeOrganizationOnboardingMock,
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: createClientMock,
}));

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientDiagnostic: (...args: unknown[]) => dispatchClientDiagnosticMock(...args),
  dispatchClientErrorDiagnostic: (...args: unknown[]) => dispatchClientDiagnosticMock(...args),
}));

import { OrganizationSetup } from '@/components/onboarding/OrganizationSetup';

describe('OrganizationSetup trust page link feedback', () => {
  let clipboardWriteText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    clipboardWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: clipboardWriteText,
      },
    });
    createClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    });
    completeOrganizationOnboardingMock.mockResolvedValue({ orgSlug: 'acme' });
  });

  afterEach(() => {
    cleanup();
    delete (navigator as Partial<Navigator>).clipboard;
  });

  async function submitOrganizationSetup() {
    render(<OrganizationSetup />);

    await screen.findByText('Create your organization');
    fireEvent.change(screen.getByLabelText('Organization Name *'), {
      target: { value: 'Acme Studio' },
    });
    fireEvent.change(screen.getByLabelText('Public link name *'), {
      target: { value: 'acme' },
    });
    fireEvent.change(screen.getByLabelText('Organization Type *'), {
      target: { value: 'company' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /create organization/i }).closest('form')!);

    await waitFor(() => expect(completeOrganizationOnboardingMock).toHaveBeenCalledTimes(1));
  }

  async function renderSuccessScreen() {
    await submitOrganizationSetup();
    await screen.findByText('Organization trust page ready');
  }

  it('keeps a failed existing-organization check visible and retryable', async () => {
    const membershipQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockRejectedValue(new Error('membership lookup failed')),
    };

    createClientMock.mockReturnValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
      },
      from: vi.fn().mockReturnValue(membershipQuery),
    });

    render(<OrganizationSetup />);

    expect(await screen.findByRole('status')).toHaveTextContent('Checking organization access...');
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'We could not confirm whether your account already belongs to an organization.'
    );
    expect(alert).toHaveTextContent('Retry this check before creating a new organization');
    expect(screen.getByRole('button', { name: /create organization/i })).toBeEnabled();
    expect(dispatchClientDiagnosticMock).toHaveBeenCalledWith(
      'onboarding.organization.existing_check_failed',
      expect.any(Error)
    );

    fireEvent.click(screen.getByRole('button', { name: /retry organization check/i }));

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /create organization/i })).toBeEnabled();
  });

  it('explains website use through the organization trust page without search exposure', async () => {
    render(<OrganizationSetup />);

    await screen.findByText('Create your organization');

    expect(
      screen.getByText(
        'Supports your public organization trust page. Search engines stay off by default.'
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Used for trust basics. Search engines stay off by default.')
    ).not.toBeInTheDocument();
  });

  it('shows returned organization creation errors as a retryable alert', async () => {
    completeOrganizationOnboardingMock.mockResolvedValueOnce({
      error: 'Organization slug already taken. Please choose another.',
    });

    await submitOrganizationSetup();

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Organization slug already taken. Please choose another.'
    );
    expect(screen.getByRole('button', { name: /create organization/i })).toBeEnabled();
  });

  it('translates legacy generic create failures into retained-details retry copy', async () => {
    completeOrganizationOnboardingMock.mockResolvedValueOnce({
      error: 'Failed to create organization. Please try again.',
    });

    await submitOrganizationSetup();

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(
      'Organization setup could not be saved. Your details are still here; please try again.'
    );
    expect(alert).not.toHaveTextContent('Failed to create organization. Please try again.');
    expect(screen.getByRole('button', { name: /create organization/i })).toBeEnabled();
    expect(dispatchClientDiagnosticMock).not.toHaveBeenCalledWith(
      'onboarding.organization.returned_error',
      expect.anything()
    );
  });

  it('keeps unexpected returned organization errors safe and diagnostic', async () => {
    const rawError = 'Supabase insert failed: duplicate key stack detail';
    completeOrganizationOnboardingMock.mockResolvedValueOnce({
      error: rawError,
    });

    await submitOrganizationSetup();

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Organization setup could not be saved. Your details are still here; please try again.'
    );
    expect(screen.queryByText(rawError)).not.toBeInTheDocument();
    expect(dispatchClientDiagnosticMock).toHaveBeenCalledWith(
      'onboarding.organization.returned_error',
      { hasReturnedError: true }
    );
    expect(JSON.stringify(dispatchClientDiagnosticMock.mock.calls)).not.toContain(rawError);
    expect(screen.getByRole('button', { name: /create organization/i })).toBeEnabled();
  });

  it('logs unexpected organization creation failures and keeps retry available', async () => {
    const submitError = new Error('Action failed');
    completeOrganizationOnboardingMock.mockRejectedValueOnce(submitError);

    await submitOrganizationSetup();

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Organization setup could not be saved. Your details are still here; please try again.'
    );
    expect(screen.queryByText('Something went wrong. Please try again.')).not.toBeInTheDocument();
    expect(dispatchClientDiagnosticMock).toHaveBeenCalledWith(
      'onboarding.organization.submit_failed',
      submitError
    );
    expect(screen.getByRole('button', { name: /create organization/i })).toBeEnabled();
  });

  it('confirms organization trust page copy inline', async () => {
    await renderSuccessScreen();

    expect(screen.getByText('Organization trust page ready')).toBeInTheDocument();
    expect(screen.getByText('Trust page URL')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open trust page/i })).toHaveAttribute(
      'href',
      expect.stringContaining('/portfolio/org/acme')
    );
    expect(document.body.textContent ?? '').not.toMatch(/organization portfolio/i);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy link/i }));
      await Promise.resolve();
    });

    expect(clipboardWriteText).toHaveBeenCalledWith(expect.stringContaining('/portfolio/org/acme'));
    expect(screen.getByRole('status')).toHaveTextContent('Organization trust page link copied.');
  });

  it('keeps organization trust page copy failures recoverable', async () => {
    clipboardWriteText.mockRejectedValueOnce(new Error('Clipboard unavailable'));
    await renderSuccessScreen();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy link/i }));
      await Promise.resolve();
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Organization trust page link could not be copied. Try again.'
    );
    expect(screen.getByLabelText('Organization trust page link for manual copy')).toHaveValue(
      'http://localhost:3000/portfolio/org/acme'
    );
    expect(screen.getByRole('button', { name: /copy link/i })).toBeEnabled();
  });
});
