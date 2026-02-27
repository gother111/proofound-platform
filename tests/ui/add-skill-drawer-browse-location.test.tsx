import type { ComponentProps } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BrowseModePanel } from '@/app/app/i/expertise/components/add-skill/BrowseModePanel';
import type {
  L1Domain,
  L2Category,
  L3Subcategory,
} from '@/app/app/i/expertise/components/add-skill/types';

const L1_DOMAIN: L1Domain = {
  catId: 1,
  slug: 'universal-capabilities',
  nameI18n: { en: 'Universal Capabilities' },
};

const L2_CATEGORY: L2Category = {
  subcatId: 11,
  catId: 1,
  slug: 'communication',
  nameI18n: { en: 'Communication' },
};

const L3_SUBCATEGORY: L3Subcategory = {
  l3Id: 111,
  subcatId: 11,
  catId: 1,
  slug: 'written-communication',
  nameI18n: { en: 'Written Communication' },
};

function createProps(overrides: Partial<ComponentProps<typeof BrowseModePanel>> = {}) {
  return {
    step: 1,
    loadedDomains: [],
    domainsLoading: false,
    handleL1Select: vi.fn(),
    selectedL1: null,
    l2Categories: [],
    l2Loading: false,
    handleL2Select: vi.fn(),
    selectedL2: null,
    l3Subcategories: [],
    l3Loading: false,
    handleL3Select: vi.fn(),
    selectedL3: null,
    l4Skills: [],
    l4Search: '',
    setL4Search: vi.fn(),
    l4Loading: false,
    showL4Dropdown: false,
    setShowL4Dropdown: vi.fn(),
    selectedL4: null,
    setSelectedL4: vi.fn(),
    setL4Name: vi.fn(),
    level: 2,
    setLevel: vi.fn(),
    lastUsedDate: '',
    setLastUsedDate: vi.fn(),
    proofSource: 'url' as const,
    setProofSource: vi.fn(),
    proofUrl: '',
    setProofUrl: vi.fn(),
    proofFilePath: '',
    proofFileName: '',
    proofUploadError: '',
    proofUploading: false,
    onProofFileSelected: vi.fn(),
    proofNotes: '',
    setProofNotes: vi.fn(),
    proofIssuedDate: '',
    setProofIssuedDate: vi.fn(),
    proofExpiresDate: '',
    setProofExpiresDate: vi.fn(),
    requestVerification: false,
    setRequestVerification: vi.fn(),
    verificationEmail: '',
    setVerificationEmail: vi.fn(),
    verificationSource: 'peer' as const,
    setVerificationSource: vi.fn(),
    verificationMessage: '',
    setVerificationMessage: vi.fn(),
    saving: false,
    handleSave: vi.fn(),
    handleBack: vi.fn(),
    ...overrides,
  };
}

describe('BrowseModePanel current location context', () => {
  it('shows selected domain and placeholders on step 2', () => {
    render(
      <BrowseModePanel
        {...createProps({
          step: 2,
          selectedL1: L1_DOMAIN,
        })}
      />
    );

    const location = screen.getByTestId('browse-current-location');
    expect(within(location).getByText('Current location')).toBeInTheDocument();
    expect(within(location).getByText('Universal Capabilities')).toBeInTheDocument();
    expect(within(location).getAllByText('Not selected')).toHaveLength(2);
  });

  it('shows domain and category context on step 3 and updates helper copy', () => {
    render(
      <BrowseModePanel
        {...createProps({
          step: 3,
          selectedL1: L1_DOMAIN,
          selectedL2: L2_CATEGORY,
        })}
      />
    );

    const location = screen.getByTestId('browse-current-location');
    expect(within(location).getByText('Universal Capabilities')).toBeInTheDocument();
    expect(within(location).getByText('Communication')).toBeInTheDocument();
    expect(within(location).getAllByText('Not selected')).toHaveLength(1);
    expect(screen.getByText(/Universal Capabilities\s*->\s*Communication/)).toBeInTheDocument();
  });

  it('shows full context on step 4 when domain/category/subcategory are selected', () => {
    render(
      <BrowseModePanel
        {...createProps({
          step: 4,
          selectedL1: L1_DOMAIN,
          selectedL2: L2_CATEGORY,
          selectedL3: L3_SUBCATEGORY,
        })}
      />
    );

    const location = screen.getByTestId('browse-current-location');
    expect(within(location).getByText('Universal Capabilities')).toBeInTheDocument();
    expect(within(location).getByText('Communication')).toBeInTheDocument();
    expect(within(location).getByText('Written Communication')).toBeInTheDocument();
    expect(within(location).queryByText('Not selected')).not.toBeInTheDocument();
    expect(screen.getByText(/Your current location is shown above\./)).toBeInTheDocument();
  });

  it('keeps placeholders visible on step 4 when some parent context is missing', () => {
    render(
      <BrowseModePanel
        {...createProps({
          step: 4,
          selectedL1: L1_DOMAIN,
          selectedL2: null,
          selectedL3: null,
        })}
      />
    );

    const location = screen.getByTestId('browse-current-location');
    expect(within(location).getByText('Universal Capabilities')).toBeInTheDocument();
    expect(within(location).getAllByText('Not selected')).toHaveLength(2);
    expect(screen.getByText(/Your current location is shown above\./)).toBeInTheDocument();
  });
});
