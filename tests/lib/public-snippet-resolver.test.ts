import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/db', () => ({
  db: {
    execute: vi.fn(),
  },
}));

import { db } from '@/db';
import { resolvePublicSnippet } from '@/lib/profile/public-snippet-resolver';

const executeMock = vi.mocked(db.execute);

beforeEach(() => {
  executeMock.mockReset();
});

describe('public-snippet-resolver', () => {
  it('rejects malformed tokens before querying the database', async () => {
    const result = await resolvePublicSnippet('bad token with spaces');

    expect(result.status).toBe('not_found');
    expect(executeMock).not.toHaveBeenCalled();
  });

  it('returns not_found for missing token records', async () => {
    executeMock.mockResolvedValueOnce({ rows: [] } as any);

    const result = await resolvePublicSnippet('validToken123');

    expect(result.status).toBe('not_found');
  });

  it('returns expired when snippet has passed expires_at', async () => {
    executeMock.mockResolvedValueOnce({
      rows: [
        {
          id: 'snippet-1',
          user_id: 'user-1',
          share_token: 'validToken123',
          fields: { name: true },
          theme: 'auto',
          format: 'card',
          expires_at: '2020-01-01T00:00:00.000Z',
          handle: 'jane',
          display_name: 'Jane',
          avatar_url: null,
          headline: null,
          bio: null,
          location: null,
          values: null,
          causes: null,
        },
      ],
    } as any);

    const result = await resolvePublicSnippet('validToken123');

    expect(result.status).toBe('expired');
  });

  it('returns only selected fields and excludes disabled private fields', async () => {
    executeMock
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'snippet-1',
            user_id: 'user-1',
            share_token: 'validToken123',
            fields: {
              name: true,
              headline: false,
              bio: false,
              skills: true,
              topSkills: 3,
              experience: false,
              education: false,
              location: true,
              profileImage: true,
              values: true,
              causes: true,
            },
            theme: 'auto',
            format: 'card',
            expires_at: null,
            handle: 'jane',
            display_name: 'Jane Doe',
            avatar_url: 'https://cdn.example.com/avatar.png',
            headline: 'Hidden headline',
            bio: 'Hidden bio',
            location: 'Stockholm',
            values: [{ icon: '🌱', label: 'Impact' }, { label: 'Evidence' }],
            causes: ['Climate'],
          },
        ],
      } as any)
      .mockResolvedValueOnce({
        rows: [
          { id: 's1', level: 5, name: 'TypeScript' },
          { id: 's2', level: 4, name: 'React' },
        ],
      } as any);

    const result = await resolvePublicSnippet('validToken123');

    expect(result.status).toBe('ok');
    if (result.status !== 'ok') {
      throw new Error('Expected status ok');
    }

    expect(result.snippet.profile.name).toBe('Jane Doe');
    expect(result.snippet.profile.profileImage).toBe('https://cdn.example.com/avatar.png');
    expect(result.snippet.profile.location).toBe('Stockholm');
    expect(result.snippet.profile.headline).toBeUndefined();
    expect(result.snippet.profile.bio).toBeUndefined();
    expect(result.snippet.profile.skills).toEqual([
      { id: 's1', level: 5, name: 'TypeScript' },
      { id: 's2', level: 4, name: 'React' },
    ]);
    expect(result.snippet.profile.values).toEqual([
      { icon: '🌱', label: 'Impact' },
      { label: 'Evidence' },
    ]);
    expect(result.snippet.profile.causes).toEqual(['Climate']);
    expect(result.snippet.profile.experience).toBeUndefined();
    expect(result.snippet.profile.education).toBeUndefined();
    expect(executeMock).toHaveBeenCalledTimes(2);
  });
});
