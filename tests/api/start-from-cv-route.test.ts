// @vitest-environment node

import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

const mocks = vi.hoisted(() => {
  class MockStartFromCvError extends Error {
    constructor(
      readonly code: string,
      readonly status: number
    ) {
      super(code);
      this.name = 'StartFromCvError';
    }
  }

  return {
    requireApiAuthContext: vi.fn(),
    createStartFromCvSession: vi.fn(),
    getStartFromCvSession: vi.fn(),
    extractStartFromCvSession: vi.fn(),
    acceptStartFromCvDrafts: vi.fn(),
    discardStartFromCvSession: vi.fn(),
    assertStartFromCvAccess: vi.fn(),
    StartFromCvError: MockStartFromCvError,
  };
});

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: (...args: unknown[]) => mocks.requireApiAuthContext(...args),
}));

vi.mock('@/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => Promise.resolve([]),
      }),
    }),
  },
}));

vi.mock('@/lib/ai/start-from-cv', () => ({
  StartFromCvError: mocks.StartFromCvError,
  StartFromCvConsentSchema: z
    .object({
      consentToProcessCv: z.literal(true),
      surface: z.literal('guest_first_proof_private_scaffolding'),
    })
    .strict(),
  resolveStartFromCvConfig: () => ({
    maxFileSizeBytes: 5 * 1024 * 1024,
  }),
  StartFromCvAcceptSchema: z
    .object({
      accepted: z
        .object({
          workContextDrafts: z.array(z.any()).default([]),
          educationContextDrafts: z.array(z.any()).default([]),
          volunteeringContextDrafts: z.array(z.any()).default([]),
          proofPackIdeaDrafts: z.array(z.any()).default([]),
          artifactLinkDrafts: z.array(z.any()).default([]),
          unsupportedSkillDrafts: z.array(z.any()).default([]),
        })
        .strict(),
    })
    .strict(),
  assertStartFromCvAccess: (...args: unknown[]) => mocks.assertStartFromCvAccess(...args),
  createStartFromCvSession: (...args: unknown[]) => mocks.createStartFromCvSession(...args),
  getStartFromCvSession: (...args: unknown[]) => mocks.getStartFromCvSession(...args),
  extractStartFromCvSession: (...args: unknown[]) => mocks.extractStartFromCvSession(...args),
  acceptStartFromCvDrafts: (...args: unknown[]) => mocks.acceptStartFromCvDrafts(...args),
  discardStartFromCvSession: (...args: unknown[]) => mocks.discardStartFromCvSession(...args),
}));

import { POST as createSession } from '@/app/api/ai/start-from-cv/sessions/route';
import { GET as getSession } from '@/app/api/ai/start-from-cv/sessions/[sessionId]/route';
import { POST as extractSession } from '@/app/api/ai/start-from-cv/sessions/[sessionId]/extract/route';
import { POST as acceptSession } from '@/app/api/ai/start-from-cv/sessions/[sessionId]/accept/route';
import { POST as discardSession } from '@/app/api/ai/start-from-cv/sessions/[sessionId]/discard/route';

const sessionId = '11111111-1111-4111-8111-111111111111';
const approvedSurface = 'guest_first_proof_private_scaffolding';

function jsonRequest(url: string, body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

function malformedJsonRequest(url: string) {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{',
  });
}

function params() {
  return { params: Promise.resolve({ sessionId }) };
}

describe('Start from CV API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireApiAuthContext.mockResolvedValue({
      user: {
        id: 'user-1',
        persona: 'individual',
        isBetaTesting: true,
      },
    });
    mocks.assertStartFromCvAccess.mockResolvedValue(undefined);
    mocks.createStartFromCvSession.mockResolvedValue({
      importSessionId: sessionId,
      sourceType: 'cv',
      extractionStatus: 'not_started',
      privacyWarnings: [],
      workContextDrafts: [],
      educationContextDrafts: [],
      volunteeringContextDrafts: [],
      proofPackIdeaDrafts: [],
      artifactLinkDrafts: [],
      unsupportedSkillDrafts: [],
      discardedUnsafeItems: [],
      requiresUserReview: true,
    });
    const completedSession = {
      importSessionId: sessionId,
      sourceType: 'cv',
      extractionStatus: 'completed',
      privacyWarnings: [],
      workContextDrafts: [],
      educationContextDrafts: [],
      volunteeringContextDrafts: [],
      proofPackIdeaDrafts: [],
      artifactLinkDrafts: [],
      unsupportedSkillDrafts: [],
      discardedUnsafeItems: [],
      requiresUserReview: true,
    };
    mocks.getStartFromCvSession.mockResolvedValue(completedSession);
    mocks.extractStartFromCvSession.mockResolvedValue(completedSession);
    mocks.acceptStartFromCvDrafts.mockResolvedValue(completedSession);
    mocks.discardStartFromCvSession.mockResolvedValue({ ok: true, deleted: true });
  });

  it('requires authentication before creating a session', async () => {
    mocks.requireApiAuthContext.mockResolvedValueOnce(null);

    const response = await createSession(
      jsonRequest('http://localhost/api/ai/start-from-cv/sessions', {
        consentToProcessCv: true,
        surface: approvedSurface,
      })
    );

    expect(response.status).toBe(401);
    expect(mocks.createStartFromCvSession).not.toHaveBeenCalled();
  });

  it('requires explicit consent before extraction can be started', async () => {
    const response = await createSession(
      jsonRequest('http://localhost/api/ai/start-from-cv/sessions', {
        consentToProcessCv: false,
        surface: approvedSurface,
      })
    );

    expect(response.status).toBe(400);
    expect(mocks.createStartFromCvSession).not.toHaveBeenCalled();
  });

  it('returns 400 for malformed session-create JSON without creating a session', async () => {
    const response = await createSession(
      malformedJsonRequest('http://localhost/api/ai/start-from-cv/sessions')
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: 'Invalid JSON body' });
    expect(mocks.createStartFromCvSession).not.toHaveBeenCalled();
  });

  it('returns a safe beta denial if access is unavailable for the account', async () => {
    mocks.createStartFromCvSession.mockRejectedValueOnce(
      new mocks.StartFromCvError('START_FROM_CV_NOT_INVITED', 403)
    );

    const response = await createSession(
      jsonRequest('http://localhost/api/ai/start-from-cv/sessions', {
        consentToProcessCv: true,
        surface: approvedSurface,
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error).toBe('Start from CV beta is not available for this account.');
  });

  it('rejects profile-context session creation without the approved private scaffolding surface', async () => {
    const response = await createSession(
      jsonRequest('http://localhost/api/ai/start-from-cv/sessions', {
        consentToProcessCv: true,
      })
    );

    expect(response.status).toBe(400);
    expect(mocks.createStartFromCvSession).not.toHaveBeenCalled();
  });

  it('rejects unsupported MIME types through the extraction boundary', async () => {
    mocks.extractStartFromCvSession.mockRejectedValueOnce(
      new mocks.StartFromCvError('UNSUPPORTED_MIME_TYPE', 400)
    );

    const response = await extractSession(
      jsonRequest(`http://localhost/api/ai/start-from-cv/sessions/${sessionId}/extract`, {
        file: {
          name: 'cv.docx',
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          base64: Buffer.from('docx').toString('base64'),
        },
      }),
      params()
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain('PDF, PNG, and JPG/JPEG');
  });

  it('rejects malformed extraction JSON before extraction starts', async () => {
    const response = await extractSession(
      malformedJsonRequest(`http://localhost/api/ai/start-from-cv/sessions/${sessionId}/extract`),
      params()
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe('Invalid JSON body.');
    expect(mocks.extractStartFromCvSession).not.toHaveBeenCalled();
  });

  it('passes supported PDF uploads into the extraction boundary', async () => {
    const pdfBytes = Buffer.from('%PDF-1.7 /Type /Page (Proofound launch corridor)');

    const response = await extractSession(
      jsonRequest(`http://localhost/api/ai/start-from-cv/sessions/${sessionId}/extract`, {
        file: {
          name: 'launch-cv.pdf',
          type: 'application/pdf',
          base64: pdfBytes.toString('base64'),
        },
      }),
      params()
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.extractionStatus).toBe('completed');
    expect(mocks.extractStartFromCvSession).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId,
        userId: 'user-1',
        persona: 'individual',
        file: expect.objectContaining({
          name: 'launch-cv.pdf',
          type: 'application/pdf',
          size: pdfBytes.length,
          bytes: expect.any(Uint8Array),
        }),
      })
    );
    const call = mocks.extractStartFromCvSession.mock.calls.at(-1)?.[0];
    expect(Buffer.from(call.file.bytes).toString('utf8')).toBe(pdfBytes.toString('utf8'));
  });

  it('rejects oversized extraction requests before parsing the upload body', async () => {
    const response = await extractSession(
      jsonRequest(
        `http://localhost/api/ai/start-from-cv/sessions/${sessionId}/extract`,
        {
          file: {
            name: 'too-large.pdf',
            type: 'application/pdf',
            base64: Buffer.from('%PDF-1.7').toString('base64'),
          },
        },
        {
          'content-length': String(20 * 1024 * 1024),
        }
      ),
      params()
    );
    const payload = await response.json();

    expect(response.status).toBe(413);
    expect(payload.error).toBe('Start from CV supports files up to the configured size limit.');
    expect(mocks.extractStartFromCvSession).not.toHaveBeenCalled();
  });

  it('keeps wrong-user access hidden behind not found', async () => {
    mocks.getStartFromCvSession.mockRejectedValueOnce(
      new mocks.StartFromCvError('START_FROM_CV_SESSION_NOT_FOUND', 404)
    );

    const response = await getSession(
      new NextRequest(`http://localhost/api/ai/start-from-cv/sessions/${sessionId}`),
      params()
    );

    expect(response.status).toBe(404);
  });

  it('accepts selected drafts without publishing or verification response fields', async () => {
    const response = await acceptSession(
      jsonRequest(`http://localhost/api/ai/start-from-cv/sessions/${sessionId}/accept`, {
        accepted: {
          workContextDrafts: [],
          educationContextDrafts: [],
          volunteeringContextDrafts: [],
          proofPackIdeaDrafts: [],
          artifactLinkDrafts: [],
          unsupportedSkillDrafts: [],
        },
      }),
      params()
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(JSON.stringify(payload)).not.toMatch(/score|rank|shortlist|publishedAt|verifiedAt/i);
  });

  it('returns 400 for malformed accept JSON without accepting drafts', async () => {
    const response = await acceptSession(
      malformedJsonRequest(`http://localhost/api/ai/start-from-cv/sessions/${sessionId}/accept`),
      params()
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: 'Invalid JSON body' });
    expect(mocks.acceptStartFromCvDrafts).not.toHaveBeenCalled();
  });

  it('deletes an import session', async () => {
    const response = await discardSession(
      jsonRequest(`http://localhost/api/ai/start-from-cv/sessions/${sessionId}/discard`, {
        deleteSession: true,
      }),
      params()
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true, deleted: true });
  });

  it('returns 400 for malformed discard JSON without discarding the session', async () => {
    const response = await discardSession(
      malformedJsonRequest(`http://localhost/api/ai/start-from-cv/sessions/${sessionId}/discard`),
      params()
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: 'Invalid JSON body' });
    expect(mocks.discardStartFromCvSession).not.toHaveBeenCalled();
  });
});
