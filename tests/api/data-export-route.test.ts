import { describe, expect, it } from 'vitest';

import { GET } from '@/app/api/data-export/route';
import { GET as canonicalGet, dynamic } from '@/app/api/user/export/route';

describe('/api/data-export', () => {
  it('reuses the canonical user export handler', () => {
    expect(GET).toBe(canonicalGet);
    expect(dynamic).toBe('force-dynamic');
  });
});
