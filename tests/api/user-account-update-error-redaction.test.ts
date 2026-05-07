import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { PUT as updateEmail } from '@/app/api/user/email/route';
import { PUT as updatePassword } from '@/app/api/user/password/route';

const createClientMock = vi.mocked(createClient);

function makeRequest(path: string, body: Record<string, unknown>) {
  return new NextRequest(`https://proofound.io${path}`, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

describe('account update auth-provider error redaction', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.LOG_LEVEL = 'debug';
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('returns a generic email-update error without logging provider account state', async () => {
    const updateError = new Error('User already registered: target@example.com');
    const updateUser = vi.fn().mockResolvedValue({ data: null, error: updateError });

    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1', email: 'owner@example.com' } },
          error: null,
        }),
        updateUser,
      },
    } as any);

    const response = await updateEmail(
      makeRequest('/api/user/email', { email: 'target@example.com' })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Unable to update email. Please check the address or try again later.',
    });
    expect(updateUser).toHaveBeenCalledWith({ email: 'target@example.com' });

    const logged = consoleErrorSpy.mock.calls.flat().join('\n');
    expect(logged).toContain('user.email.update_failed');
    expect(logged).not.toContain('target@example.com');
    expect(logged).not.toContain('User already registered');
  });

  it('returns a generic password-update error without logging provider details', async () => {
    const updateError = new Error('Provider refused password change for owner@example.com');
    const signInWithPassword = vi.fn().mockResolvedValue({ error: null });
    const updateUser = vi.fn().mockResolvedValue({ data: null, error: updateError });

    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1', email: 'owner@example.com' } },
          error: null,
        }),
        signInWithPassword,
        updateUser,
      },
    } as any);

    const response = await updatePassword(
      makeRequest('/api/user/password', {
        currentPassword: 'correct-current-password',
        newPassword: 'new-secure-password',
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Unable to update password. Please try again later.',
    });
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'owner@example.com',
      password: 'correct-current-password',
    });
    expect(updateUser).toHaveBeenCalledWith({ password: 'new-secure-password' });

    const logged = consoleErrorSpy.mock.calls.flat().join('\n');
    expect(logged).toContain('user.password.update_failed');
    expect(logged).not.toContain('owner@example.com');
    expect(logged).not.toContain('Provider refused password change');
  });
});
