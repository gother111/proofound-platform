// @vitest-environment node

import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireApiAuthContext: vi.fn(),
  parseJobDescription: vi.fn(),
  validateSkillSuggestions: vi.fn(),
  logInfo: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: (...args: unknown[]) => mocks.requireApiAuthContext(...args),
}));

vi.mock('@/lib/ai/jd-parser', () => ({
  parseJobDescription: (...args: unknown[]) => mocks.parseJobDescription(...args),
  validateSkillSuggestions: (...args: unknown[]) => mocks.validateSkillSuggestions(...args),
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: (...args: unknown[]) => mocks.logInfo(...args),
    error: (...args: unknown[]) => mocks.logError(...args),
  },
}));

import { POST } from '@/app/api/expertise/jd-to-l4/route';

const LONG_ENOUGH_JD =
  'We need a senior Python engineer with Django, AWS, SQL, and strong communication skills for launch-critical backend systems.';

function request(body: unknown) {
  return new NextRequest('http://localhost/api/expertise/jd-to-l4', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function rawRequest(body: string) {
  return new NextRequest('http://localhost/api/expertise/jd-to-l4', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  });
}

describe('POST /api/expertise/jd-to-l4', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireApiAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
      },
    });
    mocks.parseJobDescription.mockResolvedValue([
      {
        l4_id: 'python',
        l4_name: 'Python',
        proficiency_level: 4,
        confidence: 0.9,
        why: 'Python appears in the requirements.',
        source_text: 'Python',
        is_required: true,
      },
    ]);
    mocks.validateSkillSuggestions.mockResolvedValue([
      {
        l4_id: 'python',
        l4_name: 'Python',
        proficiency_level: 4,
        confidence: 0.9,
        why: 'Python appears in the requirements.',
        source_text: 'Python',
        is_required: true,
      },
    ]);
  });

  it('requires authentication before reading or parsing job-description text', async () => {
    mocks.requireApiAuthContext.mockResolvedValueOnce(null);

    const response = await POST(request({ jdText: LONG_ENOUGH_JD }));

    expect(response.status).toBe(401);
    expect(mocks.parseJobDescription).not.toHaveBeenCalled();
    expect(mocks.validateSkillSuggestions).not.toHaveBeenCalled();
  });

  it('rejects missing or too-short job descriptions before parser access', async () => {
    const missingResponse = await POST(request({}));
    const shortResponse = await POST(request({ jdText: 'Too short' }));

    expect(missingResponse.status).toBe(400);
    expect(shortResponse.status).toBe(400);
    expect(mocks.parseJobDescription).not.toHaveBeenCalled();
    expect(mocks.validateSkillSuggestions).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON before parser access', async () => {
    const response = await POST(rawRequest('{"jdText":'));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: 'Invalid JSON body' });
    expect(mocks.parseJobDescription).not.toHaveBeenCalled();
    expect(mocks.validateSkillSuggestions).not.toHaveBeenCalled();
  });

  it('rejects overlong job descriptions before parser access', async () => {
    const response = await POST(request({ jdText: 'a'.repeat(10001) }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toMatch(/too long/i);
    expect(mocks.parseJobDescription).not.toHaveBeenCalled();
    expect(mocks.validateSkillSuggestions).not.toHaveBeenCalled();
  });

  it('parses locally, validates taxonomy suggestions, and logs metadata only', async () => {
    const response = await POST(request({ jdText: LONG_ENOUGH_JD }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      suggestions: [
        {
          l4_id: 'python',
          l4_name: 'Python',
        },
      ],
    });
    expect(payload.parsedAt).toEqual(expect.any(String));
    expect(mocks.parseJobDescription).toHaveBeenCalledWith(LONG_ENOUGH_JD);
    expect(mocks.validateSkillSuggestions).toHaveBeenCalledWith([
      expect.objectContaining({
        l4_id: 'python',
        l4_name: 'Python',
      }),
    ]);
    expect(JSON.stringify(mocks.logInfo.mock.calls)).toContain('"textLength"');
    expect(JSON.stringify(mocks.logInfo.mock.calls)).not.toContain(LONG_ENOUGH_JD);
  });

  it('returns a generic error if parser validation fails', async () => {
    mocks.parseJobDescription.mockRejectedValueOnce(new Error('raw JD parser stack with details'));

    const response = await POST(request({ jdText: LONG_ENOUGH_JD }));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({
      error: 'Failed to parse job description',
    });
    expect(JSON.stringify(payload)).not.toContain('raw JD parser stack');
  });
});
