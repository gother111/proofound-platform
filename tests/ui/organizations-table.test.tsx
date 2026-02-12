import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrganizationsTable } from '@/components/admin/organizations/OrganizationsTable';

const apiFetchMock = vi.fn();

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/components/admin/organizations/OrgDetailModal', () => ({
  OrgDetailModal: () => null,
}));

describe('OrganizationsTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        organizations: [
          {
            id: 'org-verified',
            slug: 'verified-org',
            displayName: 'Verified Org',
            verified: true,
            industry: 'Tech',
            organizationSize: '11-50',
            createdAt: '2026-02-01T00:00:00.000Z',
            logoUrl: null,
            website: null,
          },
          {
            id: 'org-unverified',
            slug: 'unverified-org',
            displayName: 'Unverified Org',
            verified: false,
            industry: 'Education',
            organizationSize: '1-10',
            createdAt: '2026-02-01T00:00:00.000Z',
            logoUrl: null,
            website: null,
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      }),
    });
  });

  it('renders verification badge from org.verified truthiness', async () => {
    render(<OrganizationsTable />);

    expect(await screen.findByText('Verified')).toBeInTheDocument();
    expect(await screen.findByText('Unverified')).toBeInTheDocument();
  });
});
