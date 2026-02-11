import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrganizationBasicInfoEditor } from '@/components/organization/OrganizationBasicInfoEditor';

const toastMock = vi.fn();
const refreshMock = vi.fn();
const apiFetchMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}));

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: any[]) => apiFetchMock(...args),
}));

vi.mock('@/components/ui/card', () => ({
  Card: (props: any) => <div {...props} />,
  CardHeader: (props: any) => <div {...props} />,
  CardContent: (props: any) => <div {...props} />,
  CardTitle: (props: any) => <div {...props} />,
}));

vi.mock('@/components/ui/button', () => ({
  Button: (props: any) => <button {...props} />,
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor, ...rest }: any) => (
    <label htmlFor={htmlFor ?? rest.id ?? 'mock-id'} {...rest}>
      {children}
    </label>
  ),
}));

const org = {
  id: 'org-1',
  displayName: 'Proofound',
  legalName: 'Proofound LLC',
  mission: 'Trust first',
  vision: 'Better matching',
  website: null,
};

describe('OrganizationBasicInfoEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows destructive toast when API update fails', async () => {
    apiFetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Failed to update organization from API' }),
    });

    render(<OrganizationBasicInfoEditor org={org} canEdit={true} />);

    fireEvent.submit(screen.getByRole('button', { name: /save changes/i }).closest('form')!);

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Error',
        description: 'Failed to update organization from API',
        variant: 'destructive',
      })
    );
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it('normalizes website, refreshes router, and closes editor on success', async () => {
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ organization: { id: 'org-1' } }),
    });
    const onSaved = vi.fn();

    render(<OrganizationBasicInfoEditor org={org} canEdit={true} onSaved={onSaved} />);

    fireEvent.change(screen.getByLabelText(/Website/i), { target: { value: 'example.com' } });
    fireEvent.submit(screen.getByRole('button', { name: /save changes/i }).closest('form')!);

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));

    const [, requestInit] = apiFetchMock.mock.calls[0];
    const payload = JSON.parse(requestInit.body);

    expect(payload.website).toBe('https://example.com/');
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Organization updated',
        description: 'Basic information has been saved successfully.',
      })
    );
  });
});
