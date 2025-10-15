'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { checkRateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';
import { headers } from 'next/headers';
import type { AuthError } from '@supabase/supabase-js';

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

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type OAuthState = {
  error: string | null;
};

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

function normalizeSiteUrl(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsedUrl = new URL(candidate);
    const normalized = `${parsedUrl.origin}${parsedUrl.pathname}`;
    return stripTrailingSlash(normalized);
  } catch {
    return null;
  }
}

function resolveConfiguredSiteUrl(): string | null {
  const explicitEnv =
    normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL) ??
    normalizeSiteUrl(process.env.SITE_URL) ??
    normalizeSiteUrl(process.env.PUBLIC_SITE_URL);

  if (explicitEnv) {
    return explicitEnv;
  }

  const vercelProjectUrl =
    normalizeSiteUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    normalizeSiteUrl(process.env.NEXT_PUBLIC_VERCEL_URL);

  if (vercelProjectUrl) {
    return vercelProjectUrl;
  }

  return null;
}

function resolveSiteUrl(headersList: Headers): string | null {
  const configuredSiteUrl = resolveConfiguredSiteUrl();
  if (configuredSiteUrl) {
    return configuredSiteUrl;
  }

  const origin = normalizeSiteUrl(headersList.get('origin'));
  if (origin) {
    return origin;
  }

  const forwardedHost = headersList.get('x-forwarded-host');
  if (forwardedHost) {
    const forwardedProto = headersList.get('x-forwarded-proto') ?? 'https';
    const forwardedUrl = normalizeSiteUrl(`${forwardedProto}://${forwardedHost}`);
    if (forwardedUrl) {
      return forwardedUrl;
    }
  }

  const host = headersList.get('host');
  if (host) {
    const proto = resolveProtocol(headersList, host);
    const hostUrl = normalizeSiteUrl(`${proto}://${host}`);
    if (hostUrl) {
      return hostUrl;
    }
  }

  const referer = headersList.get('referer');
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const normalizedReferer = normalizeSiteUrl(refererUrl.origin);
      if (normalizedReferer) {
        return normalizedReferer;
      }
    } catch (error) {
      // Ignore malformed referer header values
    }
  }

  const vercelUrl = normalizeSiteUrl(process.env.VERCEL_URL);
  if (vercelUrl) {
    return vercelUrl;
  }

  return null;
}

function resolveProtocol(headersList: Headers, host: string): string {
  const forwardedProto = headersList.get('x-forwarded-proto');
  if (forwardedProto) {
    return forwardedProto;
  }

  if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) {
    return 'http';
  }

  return 'https';
}

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

    const siteUrl = resolveSiteUrl(headersList);
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
      const verificationEmail = signUpResult.user?.email ?? result.data.email;
      await resendVerificationEmail(supabase, verificationEmail, siteUrl);
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
    return {
      error: 'We could not sign you up right now. Please try again.',
      success: false,
    };
  }
}

export async function signIn(
  _prevState: SignInState | undefined,
  formData: FormData
): Promise<SignInState> {
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
    const siteUrl = resolveSiteUrl(headersList);
    if (isEmailNotConfirmedError(error) && siteUrl) {
      await resendVerificationEmail(supabase, email, siteUrl);
    }
    return { error: mapSupabaseSignInError(error, email) };
  }

  revalidatePath('/', 'layout');
  redirect('/app/i/home');

  return { error: null };
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

async function resendVerificationEmail(
  supabase: ServerSupabaseClient,
  email: string,
  siteUrl: string
) {
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

  const siteUrl = resolveSiteUrl(headersList);
  if (!siteUrl) {
    return { error: 'Unable to send reset email. Please try again later.' };
  }

  const supabase = await createClient();

  const callbackUrl = new URL('/auth/callback', siteUrl);
  callbackUrl.searchParams.set('next', '/reset-password/confirm');

  const { error } = await supabase.auth.resetPasswordForEmail(result.data.email, {
    redirectTo: callbackUrl.toString(),
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
    if (
      error.message === 'Auth session missing' ||
      /session/i.test(error.message) ||
      error.status === 401
    ) {
      return { error: 'This reset link is invalid or has expired. Please request a new one.' };
    }

    return { error: 'We were unable to reset your password. Please try again.' };
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
  const provider = formData.get('provider');
  const result = oauthProviderSchema.safeParse(provider);

  if (!result.success) {
    return { error: 'Unsupported sign-in provider.' };
  }

  const headersList = await headers();
  const siteUrl = resolveSiteUrl(headersList);

  if (!siteUrl) {
    return { error: 'Unable to start the sign-in flow. Please try again later.' };
  }

  const supabase = await createClient();
  let data: Awaited<ReturnType<typeof supabase.auth.signInWithOAuth>>['data'];
  let error: Awaited<ReturnType<typeof supabase.auth.signInWithOAuth>>['error'];

  try {
    ({ data, error } = await supabase.auth.signInWithOAuth({
      provider: result.data,
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
      },
    }));
  } catch (signInError) {
    console.error('Failed to start OAuth sign-in flow:', signInError);
    return { error: 'We could not start the sign-in flow. Please try again.' };
  }

  if (error) {
    if (/not enabled/i.test(error.message)) {
      return {
        error: 'This sign-in provider is not available. Please use email and password instead.',
      };
    }

    return { error: 'We could not start the sign-in flow. Please try again.' };
  }

  if (data?.url) {
    redirect(data.url);
  }

  return { error: 'We could not start the sign-in flow. Please try again.' };
}
