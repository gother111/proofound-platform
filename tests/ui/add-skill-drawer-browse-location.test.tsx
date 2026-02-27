import type { ComponentProps } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
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
    onNavigateToStep: vi.fn(),
    handleBack: vi.fn(),
    ...overrides,
  };
}

describe('BrowseModePanel clickable inline location navigation', () => {
  it('renders inline location row and removes separate location tile', () => {
    render(
      <BrowseModePanel
        {...createProps({
          step: 3,
          selectedL1: L1_DOMAIN,
          selectedL2: L2_CATEGORY,
          selectedL3: L3_SUBCATEGORY,
        })}
      />
    );

    const inlineLocation = screen.getByTestId('browse-current-location-inline');
    expect(inlineLocation).toBeInTheDocument();
    expect(screen.queryByText('Current location')).not.toBeInTheDocument();

    expect(within(inlineLocation).getByText('Universal Capabilities')).toBeInTheDocument();
    expect(within(inlineLocation).getByText('Communication')).toBeInTheDocument();
    expect(within(inlineLocation).getByText('Written Communication')).toBeInTheDocument();
  });

  it('uses clickable location chips and blocks disabled chip navigation', () => {
    const onNavigateToStep = vi.fn();

    render(
      <BrowseModePanel
        {...createProps({
          step: 2,
          selectedL1: L1_DOMAIN,
          selectedL2: null,
          selectedL3: null,
          onNavigateToStep,
        })}
      />
    );

    fireEvent.click(screen.getByTestId('browse-location-domain'));
    expect(onNavigateToStep).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByTestId('browse-location-category'));
    expect(onNavigateToStep).toHaveBeenCalledWith(2);

    const subcategoryChip = screen.getByTestId('browse-location-subcategory');
    expect(subcategoryChip).toBeDisabled();
    fireEvent.click(subcategoryChip);
    expect(onNavigateToStep).not.toHaveBeenCalledWith(3);
  });

  it('enables reachable step circles and disables details until full context exists', () => {
    const onNavigateToStep = vi.fn();

    const { rerender } = render(
      <BrowseModePanel
        {...createProps({
          step: 3,
          selectedL1: L1_DOMAIN,
          selectedL2: L2_CATEGORY,
          selectedL3: null,
          onNavigateToStep,
        })}
      />
    );

    const detailsStepWithoutL3 = screen.getByTestId('browse-step-4');
    expect(detailsStepWithoutL3).toBeDisabled();
    fireEvent.click(detailsStepWithoutL3);
    expect(onNavigateToStep).not.toHaveBeenCalledWith(4);

    fireEvent.click(screen.getByTestId('browse-step-1'));
    fireEvent.click(screen.getByTestId('browse-step-2'));
    fireEvent.click(screen.getByTestId('browse-step-3'));
    expect(onNavigateToStep).toHaveBeenCalledWith(1);
    expect(onNavigateToStep).toHaveBeenCalledWith(2);
    expect(onNavigateToStep).toHaveBeenCalledWith(3);

    rerender(
      <BrowseModePanel
        {...createProps({
          step: 4,
          selectedL1: L1_DOMAIN,
          selectedL2: L2_CATEGORY,
          selectedL3: L3_SUBCATEGORY,
          onNavigateToStep,
        })}
      />
    );

    const detailsStepWithL3 = screen.getByTestId('browse-step-4');
    expect(detailsStepWithL3).not.toBeDisabled();
    fireEvent.click(detailsStepWithL3);
    expect(onNavigateToStep).toHaveBeenCalledWith(4);
  });
});
