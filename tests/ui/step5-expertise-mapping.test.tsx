import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Step5ExpertiseMapping } from '@/components/matching/assignment-steps/Step5ExpertiseMapping';

const toastErrorMock = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    error: (...args: any[]) => toastErrorMock(...args),
    success: vi.fn(),
  },
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor, ...rest }: any) => (
    <label htmlFor={htmlFor ?? rest.id ?? 'mock-id'} {...rest}>
      {children}
    </label>
  ),
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: any) => <textarea {...props} />,
}));

vi.mock('@/components/ui/button', () => ({
  Button: (props: any) => <button {...props} />,
}));

vi.mock('@/components/ui/progress', () => ({
  Progress: (props: any) => <div data-testid="progress" {...props} />,
}));

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, ...rest }: any) => (
    <input
      type="checkbox"
      checked={!!checked}
      onChange={(event) => onCheckedChange?.(event.target.checked)}
      {...rest}
    />
  ),
}));

vi.mock('@/components/ui/slider', () => ({
  Slider: ({ value, onValueChange, min = 1, max = 5, step = 1, ...rest }: any) => (
    <input
      type="range"
      value={value?.[0] ?? min}
      min={min}
      max={max}
      step={step}
      onChange={(event) => onValueChange?.([Number(event.target.value)])}
      {...rest}
    />
  ),
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...rest }: any) => <span {...rest}>{children}</span>,
}));

type FormState = {
  mustHaveSkills: any[];
  niceToHaveSkills: any[];
  educationRequired: boolean;
  educationJustification: string;
};

function createFormState(initial?: Partial<FormState>) {
  const state: FormState = {
    mustHaveSkills: [],
    niceToHaveSkills: [],
    educationRequired: false,
    educationJustification: '',
    ...initial,
  };

  const form = {
    watch: (field: keyof FormState) => state[field],
    setValue: (field: keyof FormState, value: any) => {
      (state as any)[field] = value;
    },
  } as any;

  return { state, form };
}

describe('Step5ExpertiseMapping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('searches taxonomy and adds selected L4 skill as must-have with metadata', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/expertise/taxonomy?search=react')) {
        return {
          ok: true,
          json: async () => ({
            l4_skills: [
              {
                code: '03.02.01.100',
                nameI18n: { en: 'React' },
                catId: 3,
                subcatId: 2,
                l3Id: 1,
                l1: { catId: 3, nameI18n: { en: 'Tools & Technologies' } },
                l2: { catId: 3, subcatId: 2, nameI18n: { en: 'Frontend' } },
                l3: { catId: 3, subcatId: 2, l3Id: 1, nameI18n: { en: 'Web Frameworks' } },
              },
            ],
          }),
        } as Response;
      }

      return {
        ok: true,
        json: async () => ({ l4_skills: [] }),
      } as Response;
    });

    (global as any).fetch = fetchMock;

    const { state, form } = createFormState();

    render(
      <Step5ExpertiseMapping
        form={form}
        onSubmit={() => {}}
        onBack={() => {}}
        isSubmitting={false}
      />
    );

    expect(screen.getByLabelText('Search skills')).toBeInTheDocument();
    expect(screen.queryByLabelText('Search L4 skills')).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/type a skill name/i), {
      target: { value: 'react' },
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/expertise/taxonomy?search=react');

    fireEvent.click(screen.getAllByRole('button', { name: /must-have/i })[0]);

    expect(state.mustHaveSkills).toHaveLength(1);
    expect(state.mustHaveSkills[0]).toEqual(
      expect.objectContaining({
        id: '03.02.01.100',
        label: 'React',
        level: 3,
        catId: 3,
        subcatId: 2,
        l3Id: 1,
        l1Label: 'Tools & Technologies',
        l2Label: 'Frontend',
        l3Label: 'Web Frameworks',
      })
    );
  });

  it('prevents duplicates across must-have and nice-to-have lists', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/expertise/taxonomy?search=python')) {
        return {
          ok: true,
          json: async () => ({
            l4_skills: [
              {
                code: '03.01.01.200',
                nameI18n: { en: 'Python' },
                l1: { nameI18n: { en: 'Tools & Technologies' } },
                l2: { nameI18n: { en: 'Programming Languages' } },
                l3: { nameI18n: { en: 'General Purpose' } },
              },
            ],
          }),
        } as Response;
      }

      return {
        ok: true,
        json: async () => ({ l4_skills: [] }),
      } as Response;
    });

    (global as any).fetch = fetchMock;

    const { state, form } = createFormState();

    const { rerender } = render(
      <Step5ExpertiseMapping
        form={form}
        onSubmit={() => {}}
        onBack={() => {}}
        isSubmitting={false}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/type a skill name/i), {
      target: { value: 'python' },
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    fireEvent.click(screen.getAllByRole('button', { name: /must-have/i })[0]);
    expect(state.mustHaveSkills).toHaveLength(1);

    rerender(
      <Step5ExpertiseMapping
        form={form}
        onSubmit={() => {}}
        onBack={() => {}}
        isSubmitting={false}
      />
    );

    expect(screen.getAllByRole('button', { name: /nice-to-have/i })[0]).toBeDisabled();
    expect(state.niceToHaveSkills).toHaveLength(0);
    expect(toastErrorMock).not.toHaveBeenCalled();
  });

  it('auto-resolves legacy prefilled skill ids to taxonomy code and metadata', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/expertise/taxonomy?search=typescript')) {
        return {
          ok: true,
          json: async () => ({
            l4_skills: [
              {
                code: '03.01.01.001',
                slug: 'typescript',
                nameI18n: { en: 'TypeScript' },
                catId: 3,
                subcatId: 1,
                l3Id: 1,
                l1: { catId: 3, nameI18n: { en: 'Tools & Technologies' } },
                l2: { catId: 3, subcatId: 1, nameI18n: { en: 'Programming' } },
                l3: { catId: 3, subcatId: 1, l3Id: 1, nameI18n: { en: 'Typed Languages' } },
              },
            ],
          }),
        } as Response;
      }

      return {
        ok: true,
        json: async () => ({ l4_skills: [] }),
      } as Response;
    });

    (global as any).fetch = fetchMock;

    const { state, form } = createFormState({
      mustHaveSkills: [{ id: 'typescript', label: 'TypeScript', level: 4 }],
    });

    render(
      <Step5ExpertiseMapping
        form={form}
        onSubmit={() => {}}
        onBack={() => {}}
        isSubmitting={false}
      />
    );

    await waitFor(() => {
      expect(state.mustHaveSkills[0].id).toBe('03.01.01.001');
    });

    expect(state.mustHaveSkills[0]).toEqual(
      expect.objectContaining({
        label: 'TypeScript',
        catId: 3,
        subcatId: 1,
        l3Id: 1,
        l1Label: 'Tools & Technologies',
        l2Label: 'Programming',
        l3Label: 'Typed Languages',
      })
    );
  });

  it('shows warning when legacy skills cannot be auto-mapped', async () => {
    const fetchMock = vi.fn(async () => {
      return {
        ok: true,
        json: async () => ({ l4_skills: [] }),
      } as Response;
    });

    (global as any).fetch = fetchMock;

    const { form } = createFormState({
      mustHaveSkills: [{ id: 'legacy-unknown', label: 'Legacy Unknown', level: 3 }],
    });

    render(
      <Step5ExpertiseMapping
        form={form}
        onSubmit={() => {}}
        onBack={() => {}}
        isSubmitting={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/could not be auto-mapped/i)).toBeInTheDocument();
    });

    expect(screen.getAllByText('legacy-unknown').length).toBeGreaterThan(0);
  });
});
