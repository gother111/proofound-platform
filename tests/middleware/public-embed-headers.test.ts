import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';

describe('middleware headers for public snippet embed', () => {
  it('allows embedding only for /p/{token}/embed', async () => {
    const embedRequest = new NextRequest('http://localhost:3000/p/abc123/embed');
    const embedResponse = await middleware(embedRequest);

    const embedCsp = embedResponse.headers.get('content-security-policy') || '';
    expect(embedResponse.headers.get('x-frame-options')).toBe('ALLOWALL');
    expect(embedCsp).toContain('frame-ancestors *');

    const regularRequest = new NextRequest('http://localhost:3000/app/i/profile');
    const regularResponse = await middleware(regularRequest);

    const regularCsp = regularResponse.headers.get('content-security-policy') || '';
    expect(regularResponse.headers.get('x-frame-options')).toBe('DENY');
    expect(regularCsp).toContain("frame-ancestors 'none'");
  });
});
