'use server';

import { resolveSiteUrlFromHeaders } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { checkRateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';
import { headers } from 'next/headers';
import type { AuthError, SupabaseClient } from '@supabase/supabase-js';

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type SignInState = {
  error: string | null;
};

const resetPasswordSchema = z.object({
  email: z.string().email(),
});

const oauthProviderSchema = z.enum(['google']);

export type SignUpState = {
  error: string | null;
  success: boolean;
};

export type OAuthState = {
  error: string | null;
};

export async function signUp(
  _prevState: SignUpState | undefined,
  formData: FormData
): Promise<SignUpState> {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || 'unknown';
    const identifier = getRateLimitIdentifier(ip);

    const allowed = await checkRateLimit(identifier, 'signup');
    if (!allowed) {
      return {
        error: 'Too many requests. Please try again later.',
        success: false,
      };
    }

    const rawEmail = (formData.get('email') as string | null) ?? '';
    const email = rawEmail.trim().toLowerCase();
    const data = {
      email,
      password: (formData.get('password') as string | null) ?? '',
    };

    const result = signUpSchema.safeParse(data);
    if (!result.success) {
      return {
        error: 'Enter a valid email address and password with at least 8 characters.',
        success: false,
      };
    }

    const siteUrl = resolveSiteUrlFromHeaders(headersList);
    if (!siteUrl) {
      return {
        error: 'Unable to complete signup. Please try again later or contact support.',
        success: false,
      };
    }

    const supabase = await createClient();

    const { data: signUpResult, error } = await supabase.auth.signUp({
      email: result.data.email,
      password: result.data.password,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (error) {
      if (/already registered/i.test(error.message)) {
        return {
          error: 'An account with this email already exists. Try logging in instead.',
          success: false,
        };
      }

      return {
        error: error.message || 'We could not sign you up. Please try again.',
        success: false,
      };
    }

    const identities = signUpResult.user?.identities ?? [];
    if (identities.length === 0) {
      await resendVerificationEmail(supabase, result.data.email, siteUrl);
      return {
        error:
          'An account with this email already exists. We just sent a fresh verification link to your inbox.',
        success: false,
      };
    }

    revalidatePath('/', 'layout');

    return {
      error: null,
      success: true,
    };
  } catch (error) {
    console.error('Sign-up failed:', error);
    return {
      error: mapUnexpectedAuthError(error, 'sign up'),
      success: false,
    };
  }
}

export async function signIn(
  _prevState: SignInState | undefined,
  formData: FormData
): Promise<SignInState> {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || 'unknown';
    const identifier = getRateLimitIdentifier(ip);

    const allowed = await checkRateLimit(identifier, 'signin');
    if (!allowed) {
      return { error: 'Too many login attempts. Please wait a moment and try again.' };
    }

    const rawEmail = (formData.get('email') as string | null) ?? '';
    const email = rawEmail.trim().toLowerCase();
    const password = (formData.get('password') as string | null) ?? '';
    const data = {
      email,
      password,
    };

    const result = signInSchema.safeParse(data);
    if (!result.success) {
      return { error: 'Enter a valid email address and password.' };
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword(result.data);

    if (error) {
      const siteUrl = resolveSiteUrlFromHeaders(headersList);
      if (isEmailNotConfirmedError(error) && siteUrl) {
        await resendVerificationEmail(supabase, email, siteUrl);
      }
      return { error: mapSupabaseSignInError(error, email) };
    }

    revalidatePath('/', 'layout');
    redirect('/app/i/home');

    return { error: null };
  } catch (error) {
    console.error('Sign-in failed:', error);
    return { error: mapUnexpectedAuthError(error, 'log in') };
  }
}

function isEmailNotConfirmedError(error: AuthError): boolean {
  return (
    error.message === 'Email not confirmed' ||
    /confirm/gi.test(error.message) ||
    error.status === 422
  );
}

function mapSupabaseSignInError(error: AuthError, email?: string): string {
  if (error.status === 400 || error.status === 401) {
    return 'Email or password is incorrect.';
  }

  if (isEmailNotConfirmedError(error)) {
    const messagePrefix =
      'Please verify your email before logging in. Check your inbox for the verification link';
    return email ? `${messagePrefix} we just re-sent to ${email}.` : `${messagePrefix}.`;
  }

  switch (error.message) {
    case 'Invalid login credentials':
    case 'Invalid email or password':
      return 'Email or password is incorrect.';
    case 'Email not confirmed':
      return email
        ? `Please verify your email before logging in. Check your inbox for the verification link we just re-sent to ${email}.`
        : 'Please verify your email before logging in. Check your inbox for the verification link.';
    default:
      return 'We could not log you in. Please try again or reset your password.';
  }
}

async function resendVerificationEmail(supabase: SupabaseClient, email: string, siteUrl: string) {
  try {
    await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });
  } catch (resendError) {
    console.error('Failed to resend verification email:', resendError);
  }
}

function mapUnexpectedAuthError(error: unknown, action: 'sign up' | 'log in') {
  if (isEnvMisconfigError(error)) {
    return 'Authentication service is not configured. See README → Environment setup.';
  }

  const message = getErrorMessage(error);

  if (message) {
    if (/supabase server client is missing required/i.test(message) || /Supabase Auth is not configured/i.test(message)) {
      return 'Authentication service is not configured correctly. Please contact support.';
    }

    const actionDescription = action === 'sign up' ? 'sign you up' : 'log you in';
    return `We could not ${actionDescription} because the authentication service returned an unexpected error: ${message}`;
  }

  return action === 'sign up'
    ? 'We could not sign you up right now. Please try again.'
    : 'We could not log you in right now. Please try again.';
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function requestPasswordReset(formData: FormData) {
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') || 'unknown';
  const identifier = getRateLimitIdentifier(ip);

  const allowed = await checkRateLimit(identifier, 'reset-password');
  if (!allowed) {
    return { error: 'Too many requests. Please try again later.' };
  }

  const data = {
    email: formData.get('email') as string,
  };

  const result = resetPasswordSchema.safeParse(data);
  if (!result.success) {
    return { error: 'Invalid email' };
  }

  const siteUrl = resolveSiteUrlFromHeaders(headersList);
  if (!siteUrl) {
    return { error: 'Unable to send reset email. Please try again later.' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(result.data.email, {
    redirectTo: `${siteUrl}/reset-password/confirm`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function confirmPasswordReset(formData: FormData) {
  const password = formData.get('password') as string;

  if (!password || password.length < 8) {
    return { error: 'Password must be at least 8 characters' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function verifyEmail(formData: FormData) {
  const token = formData.get('token') as string;

  if (!token) {
    return { error: 'No verification token provided' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: 'email',
  });

  if (error) {
    return { error: 'Invalid or expired verification link' };
  }

  return { success: true };
}

export async function signInWithOAuth(
  _prevState: OAuthState | undefined,
  formData: FormData
): Promise<OAuthState> {
  try {
    const provider = formData.get('provider');
    const result = oauthProviderSchema.safeParse(provider);

    if (!result.success) {
      return { error: 'Unsupported sign-in provider.' };
    }

    const headersList = await headers();
    const siteUrl = resolveSiteUrlFromHeaders(headersList);

    if (!siteUrl) {
      return { error: 'Unable to start the sign-in flow. Please try again later.' };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: result.data,
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (error) {
      if (/not enabled/i.test(error.message)) {
        return {
          error: 'This sign-in provider is not available. Please use email and password instead.',
        };
      }

      return { error: mapUnexpectedOAuthError(error) };
    }

    if (data?.url) {
      redirect(data.url);
    }

    return { error: 'We could not start the sign-in flow. Please try again.' };
  } catch (error) {
    console.error('OAuth sign-in failed:', error);
    return { error: mapUnexpectedOAuthError(error) };
  }
}

function mapUnexpectedOAuthError(error: unknown) {
  if (isEnvMisconfigError(error)) {
    return 'Authentication service is not configured. See README → Environment setup.';
  }

  const message = getErrorMessage(error);

  if (message) {
    if (
      /supabase server client is missing required/i.test(message) ||
      /Supabase Auth is not configured/i.test(message) ||
      /auth-relay supabase project url/i.test(message) ||
      /redirect.*(not|missing)/i.test(message)
    ) {
      return 'Authentication service is not configured correctly. Please contact support.';
    }

    return `We could not start the sign-in flow because the authentication service returned an unexpected error: ${message}`;
  }

  return 'We could not start the sign-in flow right now. Please try again.';
}

function getErrorMessage(error: unknown): string | null {
  if (!error) {
    return null;
  }

  if (error instanceof Error) {
    return error.message?.trim() || null;
  }

  if (typeof error === 'string') {
    const trimmed = error.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') {
      const trimmed = message.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
  }

  return null;
}

function isEnvMisconfigError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'ENV_MISCONFIG'
  );
}
