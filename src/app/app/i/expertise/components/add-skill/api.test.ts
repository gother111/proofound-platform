import { afterEach, describe, expect, it, vi } from 'vitest';

import { searchL4Skills } from './api';

describe('searchL4Skills', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws with backend error details when taxonomy search fails', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ error: 'Failed to fetch skills', details: 'RPC unavailable' }),
        {
          status: 500,
          headers: { 'content-type': 'application/json' },
        }
      )
    );

    await expect(searchL4Skills('swedish')).rejects.toThrow(
      'Failed to fetch skills RPC unavailable'
    );
  });

  it('returns L4 skills when taxonomy search succeeds', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          l4_skills: [
            {
              code: '04.105.840.95013',
              nameI18n: { en: 'Swedish language proficiency' },
              catId: 4,
              subcatId: 105,
              l3Id: 840,
            },
          ],
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }
      )
    );

    const skills = await searchL4Skills('swedish');

    expect(skills).toHaveLength(1);
    expect(skills[0].nameI18n?.en).toBe('Swedish language proficiency');
  });
});
