import { describe, expect, it, vi } from 'vitest';

// Ensure Vite SSR helper exists before importing any app modules
(globalThis as any).__vite_ssr_exportName__ =
  (globalThis as any).__vite_ssr_exportName__ || ((_: string, value: any) => value);

// Mock next/server to avoid Next runtime in Vitest
vi.mock('next/server', async () => {
  const actual = await vi.importActual<typeof import('next/server')>('next/server');
  return actual;
});

import { NextRequest } from 'next/server';
import { GET } from '../src/app/api/assignment-templates/route.ts';

describe('assignment template API routes', () => {
  it('returns a launch gate by default', async () => {
    const response = await GET(
      new NextRequest('http://localhost/api/assignment-templates?orgSlug=acme')
    );
    const payload = await response.json();

    expect(response.status).toBe(410);
    expect(payload.error).toContain('Assignment templates API');
  });
});
