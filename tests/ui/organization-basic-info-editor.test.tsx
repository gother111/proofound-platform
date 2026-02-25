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
  tagline: null,
  mission: 'Trust first',
  vision: 'Better matching',
  missionLinks: { values: ['Integrity'], causes: ['Climate Justice'] },
  visionLinks: { values: ['Integrity'], causes: ['Climate Justice'] },
  industry: null,
  organizationSize: null,
  impactArea: null,
  legalForm: null,
  foundedDate: null,
  website: null,
  values: ['Integrity'],
  causes: ['Climate Justice'],
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

    fireEvent.change(screen.getByLabelText(/Add Core Value/i), {
      target: { value: 'Transparency' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Add Value/i }));
    fireEvent.change(screen.getByLabelText(/Tagline/i), { target: { value: 'Trust-led hiring' } });
    fireEvent.change(screen.getByLabelText(/Industry/i), { target: { value: 'Technology' } });
    fireEvent.change(screen.getByLabelText(/Organization Size/i), { target: { value: '11-50' } });
    fireEvent.change(screen.getByLabelText(/Impact Area/i), { target: { value: 'Education' } });
    fireEvent.change(screen.getByLabelText(/Legal Form/i), { target: { value: 'llc' } });
    fireEvent.change(screen.getByLabelText(/Founded Date/i), { target: { value: '2024-01-15' } });
    fireEvent.change(screen.getByLabelText(/Website/i), { target: { value: 'example.com' } });
    fireEvent.submit(screen.getByRole('button', { name: /save changes/i }).closest('form')!);

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(1));

    const [, requestInit] = apiFetchMock.mock.calls[0];
    const payload = JSON.parse(requestInit.body);

    expect(payload.website).toBe('https://example.com/');
    expect(payload.values).toEqual(['Integrity', 'Transparency']);
    expect(payload.missionLinks).toEqual({ values: ['Integrity'], causes: ['Climate Justice'] });
    expect(payload.visionLinks).toEqual({ values: ['Integrity'], causes: ['Climate Justice'] });
    expect(payload.tagline).toBe('Trust-led hiring');
    expect(payload.industry).toBe('Technology');
    expect(payload.organizationSize).toBe('11-50');
    expect(payload.impactArea).toBe('Education');
    expect(payload.legalForm).toBe('llc');
    expect(payload.foundedDate).toBe('2024-01-15');
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Organization updated',
        description: 'Basic information has been saved successfully.',
      })
    );
  });

  it('blocks mission and vision save when core value or cause prerequisites are missing', async () => {
    render(
      <OrganizationBasicInfoEditor
        org={{
          ...org,
          values: [],
          causes: [],
          missionLinks: { values: [], causes: [] },
          visionLinks: { values: [], causes: [] },
        }}
        canEdit={true}
      />
    );

    fireEvent.change(screen.getByLabelText(/Mission Statement/i), {
      target: { value: 'Build trust first teams' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /save changes/i }).closest('form')!);

    expect(apiFetchMock).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Missing prerequisites',
        description:
          'Add at least one core value and at least one cause before setting mission or vision.',
        variant: 'destructive',
      })
    );
    expect(
      screen.getByText(/Add at least one value before setting mission or vision/i)
    ).toBeInTheDocument();
  });

  it('blocks save when mission/vision links are missing', async () => {
    render(
      <OrganizationBasicInfoEditor
        org={{
          ...org,
          mission: null,
          vision: null,
          missionLinks: { values: [], causes: [] },
          visionLinks: { values: [], causes: [] },
        }}
        canEdit={true}
      />
    );

    fireEvent.change(screen.getByLabelText(/Mission Statement/i), {
      target: { value: 'Build trust first teams' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /save changes/i }).closest('form')!);

    expect(apiFetchMock).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Missing mission/vision links',
      })
    );
  });
});
