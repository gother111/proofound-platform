import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { POST } from '@/app/api/expertise/cv-import/wizard-apply/route';
import { createClient } from '@/lib/supabase/server';
import { applyWizardSelections } from '@/lib/expertise/cv-import-wizard-apply';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/expertise/cv-import-wizard-apply', () => ({
  applyWizardSelections: vi.fn(),
}));

vi.mock('@/lib/expertise/cv-import-wizard-types', () => ({
  CvImportWizardApplyRequestSchema: {
    parse: (value: unknown) => value,
  },
}));

describe('cv-import wizard apply route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 for unauthenticated users', async () => {
    (createClient as any).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: null } }),
      },
    });

    const request = new NextRequest('http://localhost/api/expertise/cv-import/wizard-apply', {
      method: 'POST',
      body: JSON.stringify({ documents: [] }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('applies approved wizard payload for authenticated users', async () => {
    (createClient as any).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: 'user-1' } } }),
      },
    });

    (applyWizardSelections as any).mockResolvedValue({
      imported_counts: {
        skills: 2,
        work_experiences: 1,
        learning_experiences: 1,
        volunteering: 0,
        languages: 1,
      },
      skipped_counts: {
        skills: 0,
        work_experiences: 0,
        learning_experiences: 0,
        volunteering: 0,
        languages: 0,
      },
      warnings: [],
    });

    const request = new NextRequest('http://localhost/api/expertise/cv-import/wizard-apply', {
      method: 'POST',
      body: JSON.stringify({
        documents: [
          {
            document_id: 'doc-1',
            file_name: 'cv.pdf',
            work_experiences: [],
            learning_experiences: [],
            volunteering: [],
            languages: [],
            skill_ids: ['skill_react', 'skill_typescript'],
          },
        ],
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.imported_counts.skills).toBe(2);
    expect(applyWizardSelections).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ documents: expect.any(Array) })
    );
  });

  it('returns 500 when wizard apply service throws an unexpected error', async () => {
    (createClient as any).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: 'user-1' } } }),
      },
    });

    (applyWizardSelections as any).mockRejectedValue(new Error('db unavailable'));

    const request = new NextRequest('http://localhost/api/expertise/cv-import/wizard-apply', {
      method: 'POST',
      body: JSON.stringify({
        documents: [
          {
            document_id: 'doc-1',
            file_name: 'cv.pdf',
            work_experiences: [],
            learning_experiences: [],
            volunteering: [],
            languages: [],
            skill_ids: [],
          },
        ],
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to apply CV wizard selections');
  });
});
