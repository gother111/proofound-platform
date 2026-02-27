import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AddSkillDrawer } from '@/app/app/i/expertise/components/add-skill/AddSkillDrawer';

const toastMock = vi.fn();

const L1_DOMAIN = {
  catId: 1,
  slug: 'universal-capabilities',
  nameI18n: { en: 'Universal Capabilities' },
};

const L2_CATEGORY = {
  subcatId: 11,
  catId: 1,
  slug: 'communication',
  nameI18n: { en: 'Communication' },
};

const L3_SUBCATEGORY = {
  l3Id: 111,
  subcatId: 11,
  catId: 1,
  slug: 'written-communication',
  nameI18n: { en: 'Written Communication' },
};

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}));

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('@/lib/upload', () => ({
  uploadFile: vi.fn(),
  validateFile: vi.fn(() => ({ valid: true })),
}));

vi.mock('@/app/app/i/expertise/components/add-skill/useDebouncedSearch', () => ({
  useDebouncedSearch: () => ({
    query: '',
    results: [],
    loading: false,
    error: null,
    onChange: vi.fn(),
    reset: vi.fn(),
  }),
}));

vi.mock('@/app/app/i/expertise/components/add-skill/api', () => ({
  fetchL1Domains: vi.fn(async () => []),
  fetchL2Categories: vi.fn(async () => []),
  fetchL3Subcategories: vi.fn(async () => []),
  fetchL4Skills: vi.fn(async () => []),
  searchL4Skills: vi.fn(async () => []),
  addUserSkill: vi.fn(),
  deleteUserSkill: vi.fn(),
  attachSkillProof: vi.fn(),
}));

vi.mock('@/app/app/i/expertise/components/add-skill/AddSkillDrawerView', () => ({
  AddSkillDrawerView: (props: any) => (
    <div>
      <button onClick={() => props.handleL1Select(L1_DOMAIN)}>choose-l1</button>
      <button onClick={() => props.handleL2Select(L2_CATEGORY)}>choose-l2</button>
      <button onClick={() => props.handleL3Select(L3_SUBCATEGORY)}>choose-l3</button>
      <button
        onClick={() => {
          props.setSelectedL4({ code: 'SK-1', nameI18n: { en: 'Skill 1' } });
          props.setL4Search('Skill 1');
        }}
      >
        select-l4
      </button>

      <button onClick={() => props.onNavigateToStep(1)}>nav-1</button>
      <button onClick={() => props.onNavigateToStep(2)}>nav-2</button>
      <button onClick={() => props.onNavigateToStep(3)}>nav-3</button>
      <button onClick={() => props.onNavigateToStep(4)}>nav-4</button>

      <div data-testid="step">{props.step}</div>
      <div data-testid="selected-l2">
        {props.selectedL2 ? props.selectedL2.nameI18n.en : 'none'}
      </div>
      <div data-testid="selected-l3">
        {props.selectedL3 ? props.selectedL3.nameI18n.en : 'none'}
      </div>
      <div data-testid="selected-l4">{props.selectedL4 ? props.selectedL4.code : 'none'}</div>
      <div data-testid="l4-search">{props.l4Search || 'none'}</div>
    </div>
  ),
}));

describe('AddSkillDrawer step navigation resets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('jumping to Domain clears L2/L3/L4 selections', async () => {
    render(
      <AddSkillDrawer
        open
        onOpenChange={vi.fn()}
        domains={[L1_DOMAIN]}
        taxonomyReady
        onSkillAdded={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'choose-l1' }));
    fireEvent.click(screen.getByRole('button', { name: 'choose-l2' }));
    fireEvent.click(screen.getByRole('button', { name: 'choose-l3' }));
    fireEvent.click(screen.getByRole('button', { name: 'select-l4' }));

    await waitFor(() => expect(screen.getByTestId('step')).toHaveTextContent('4'));

    fireEvent.click(screen.getByRole('button', { name: 'nav-1' }));

    await waitFor(() => expect(screen.getByTestId('step')).toHaveTextContent('1'));
    expect(screen.getByTestId('selected-l2')).toHaveTextContent('none');
    expect(screen.getByTestId('selected-l3')).toHaveTextContent('none');
    expect(screen.getByTestId('selected-l4')).toHaveTextContent('none');
    expect(screen.getByTestId('l4-search')).toHaveTextContent('none');
  });

  it('jumping to Category clears L3/L4 and blocks details until subcategory is reselected', async () => {
    render(
      <AddSkillDrawer
        open
        onOpenChange={vi.fn()}
        domains={[L1_DOMAIN]}
        taxonomyReady
        onSkillAdded={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'choose-l1' }));
    fireEvent.click(screen.getByRole('button', { name: 'choose-l2' }));
    fireEvent.click(screen.getByRole('button', { name: 'choose-l3' }));
    fireEvent.click(screen.getByRole('button', { name: 'select-l4' }));

    await waitFor(() => expect(screen.getByTestId('step')).toHaveTextContent('4'));

    fireEvent.click(screen.getByRole('button', { name: 'nav-2' }));
    await waitFor(() => expect(screen.getByTestId('step')).toHaveTextContent('2'));
    expect(screen.getByTestId('selected-l3')).toHaveTextContent('none');
    expect(screen.getByTestId('selected-l4')).toHaveTextContent('none');
    expect(screen.getByTestId('l4-search')).toHaveTextContent('none');

    fireEvent.click(screen.getByRole('button', { name: 'nav-4' }));
    expect(screen.getByTestId('step')).toHaveTextContent('2');

    fireEvent.click(screen.getByRole('button', { name: 'choose-l3' }));
    await waitFor(() => expect(screen.getByTestId('step')).toHaveTextContent('4'));
  });
});
