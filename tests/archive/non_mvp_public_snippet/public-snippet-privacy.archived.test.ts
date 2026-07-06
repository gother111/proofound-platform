import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/db', () => ({
  db: {
    execute: vi.fn(),
  },
}));

import { db } from '@/db';
import {
  buildPublicSnippetViewModel,
  type PublicSnippet,
} from '@/archive/non_launch_lib/profile/public-snippet.archived';

function buildSnippet(fields: Record<string, unknown>): PublicSnippet {
  return {
    id: 'snippet-1',
    userId: 'user-1',
    fields,
    theme: 'light',
    format: 'card',
    expiresAt: null,
    createdAt: '2026-04-09T12:00:00.000Z',
    profileType: 'individual',
    orgId: null,
  };
}

describe('public snippet privacy defaults', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps experience and education hidden when no explicit public visibility exists', async () => {
    (db.execute as any).mockResolvedValueOnce([
      {
        display_name: 'Jane Doe',
        handle: 'jane',
        avatar_url: null,
        headline: null,
        tagline: null,
        bio: null,
        location: null,
        cover_image_url: null,
        field_visibility: null,
        redact_mode: false,
      },
    ]);

    const viewModel = await buildPublicSnippetViewModel(
      buildSnippet({
        experience: true,
        education: true,
      })
    );

    expect(viewModel?.experiences).toEqual([]);
    expect(viewModel?.education).toEqual([]);
    expect(db.execute).toHaveBeenCalledTimes(1);
  });

  it('includes private context only after explicit public opt-in', async () => {
    (db.execute as any)
      .mockResolvedValueOnce([
        {
          display_name: 'Jane Doe',
          handle: 'jane',
          avatar_url: null,
          headline: null,
          tagline: null,
          bio: null,
          location: null,
          cover_image_url: null,
          field_visibility: {
            displayName: 'public',
            experiences: 'public',
            education: 'public',
          },
          redact_mode: false,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'exp-1',
          title: 'Engineer',
          org_description: 'Built the system',
          duration: '2024',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'edu-1',
          institution: 'KTH',
          degree: 'MSc',
          duration: '2023',
        },
      ]);

    const viewModel = await buildPublicSnippetViewModel(
      buildSnippet({
        name: true,
        experience: true,
        education: true,
      })
    );

    expect(viewModel?.title).toBe('Jane Doe');
    expect(viewModel?.experiences).toHaveLength(1);
    expect(viewModel?.education).toHaveLength(1);
  });
});
