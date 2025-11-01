'use server';

import { normalizeSiteUrl, resolveSiteUrlFromHeaders, stripTrailingSlash } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { checkRateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';
import { headers } from 'next/headers';
import type { AuthError } from '@supabase/supabase-js';
import { resolveUserHomePath } from '@/lib/auth';

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  persona: z.enum(['individual', 'org_member']),
  gdprConsent: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the Privacy Policy and Terms of Service',
  }),
  marketingOptIn: z.boolean().optional(),
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

const oauthProviderSchema = z.enum(['google', 'linkedin_oidc']);

export type SignUpState = {
  error: string | null;
  success: boolean;
};

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type OAuthState = {
  error: string | null;
};

function isRedirectError(error: unknown): error is { digest: string } {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT');
}

function resolveRequestSiteUrl(headersList: Headers): string {
  const siteUrlFromHeaders = resolveSiteUrlFromHeaders(headersList);
  if (siteUrlFromHeaders) {
    return stripTrailingSlash(siteUrlFromHeaders);
  }

  const origin = normalizeSiteUrl(headersList.get('origin'), { allowPreviewHosts: true });
  if (origin) {
    return stripTrailingSlash(origin);
  }

  return '';
}

export async function signUp(
  prevState: SignUpState | undefined,
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

    const personaChoice = (formData.get('persona') as string | null)?.trim();
    const normalizedPersona = personaChoice === 'organization' ? 'org_member' : personaChoice;

    // Parse consent fields from form
    const gdprConsentRaw = formData.get('gdprConsent') as string | null;
    const marketingOptInRaw = formData.get('marketingOptIn') as string | null;

    const data = {
      email,
      password: (formData.get('password') as string | null) ?? '',
      persona: normalizedPersona,
      gdprConsent: gdprConsentRaw === 'true',
      marketingOptIn: marketingOptInRaw === 'true',
    };

    const result = signUpSchema.safeParse(data);
    if (!result.success) {
      return {
        error: 'Enter a valid email, password (8+ characters), and account type.',
        success: false,
      };
    }

    const siteUrl = resolveRequestSiteUrl(headersList);
    if (!siteUrl) {
      return {
        error: 'Unable to complete signup. Please try again later or contact support.',
        success: false,
      };
    }

    const supabase = await createClient({ allowCookieWrite: true });

    const { data: signUpResult, error } = await supabase.auth.signUp({
      email: result.data.email,
      password: result.data.password,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
        data: {
          persona: result.data.persona,
        },
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

    // Verify profile was created by trigger, create manually if needed
    if (signUpResult.user) {
      const { data: profileCheck } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', signUpResult.user.id)
        .maybeSingle();

      if (!profileCheck) {
        // Trigger didn't fire - create profile manually as fallback
        console.warn('Profile trigger did not fire, creating profile manually');
        await supabase.from('profiles').insert({
          id: signUpResult.user.id,
          persona: result.data.persona,
          display_name: result.data.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      // Store GDPR consent records (audit trail)
      // Use service role since user session doesn't exist yet (email confirmation required)
      try {
        const { createAdminClient } = await import('@/lib/supabase/admin');
        const serviceSupabase = createAdminClient();
        
        // Hash PII for audit trail
        const { anonymizeIP, anonymizeUserAgent } = await import('@/lib/utils/privacy');
        const ipHash = anonymizeIP(ip);
        const userAgentHash = anonymizeUserAgent(headersList.get('user-agent') || 'unknown');
        
        // Current policy version
        const policyVersion = 'v1.0.2025-10-30';
        
        // Prepare consent records
        const consentRecords = [
          {
            profile_id: signUpResult.user.id,
            consent_type: 'gdpr_privacy_policy',
            consented: true,
            consented_at: new Date().toISOString(),
            ip_hash: ipHash,
            user_agent_hash: userAgentHash,
            version: policyVersion,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            profile_id: signUpResult.user.id,
            consent_type: 'gdpr_terms_of_service',
            consented: true,
            consented_at: new Date().toISOString(),
            ip_hash: ipHash,
            user_agent_hash: userAgentHash,
            version: policyVersion,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            profile_id: signUpResult.user.id,
            consent_type: 'marketing_emails',
            consented: result.data.marketingOptIn ?? false,
            consented_at: new Date().toISOString(),
            ip_hash: ipHash,
            user_agent_hash: userAgentHash,
            version: policyVersion,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
        
        // Store consent records directly using service role
        const { error: consentError } = await serviceSupabase
          .from('user_consents')
          .insert(consentRecords);
          
        if (consentError) {
          console.error('Failed to store consent records:', consentError);
          // This is a critical GDPR compliance issue - we should not continue silently
          throw new Error(`GDPR compliance error: Failed to store consent records - ${consentError.message}`);
        }
        
        console.log('GDPR consent records stored successfully for user:', signUpResult.user.id);
      } catch (consentError) {
        // This is a critical GDPR compliance failure - log and re-throw
        console.error('CRITICAL: GDPR consent storage failed:', consentError);
        throw new Error(`GDPR compliance error: Unable to store required consent records. Signup cannot proceed.`);
      }
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

    const supabase = await createClient({ allowCookieWrite: true });

    const { error } = await supabase.auth.signInWithPassword(result.data);

    if (error) {
      const siteUrl = resolveRequestSiteUrl(headersList);
      if (isEmailNotConfirmedError(error) && siteUrl) {
        await resendVerificationEmail(supabase, email, siteUrl);
      }
      return { error: mapSupabaseSignInError(error, email) };
    }

    const destination = await resolveUserHomePath();

    revalidatePath('/', 'layout');
    redirect(destination);

    return { error: null };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
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

function mapUnexpectedAuthError(error: unknown, action: 'sign up' | 'log in') {
  if (isEnvMisconfigError(error)) {
    return 'Authentication service is not configured. See README → Environment setup.';
  }

  const message = getErrorMessage(error);

  if (message) {
    if (
      /supabase server client is missing required/i.test(message) ||
      /Supabase Auth is not configured/i.test(message)
    ) {
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
  const supabase = await createClient({ allowCookieWrite: true });
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

  const siteUrl = resolveRequestSiteUrl(headersList);
  if (!siteUrl) {
    return { error: 'Unable to send reset email. Please try again later.' };
  }

  const supabase = await createClient({ allowCookieWrite: true });

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

  const supabase = await createClient({ allowCookieWrite: true });

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

  const supabase = await createClient({ allowCookieWrite: true });

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
    const siteUrl = resolveRequestSiteUrl(headersList);

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
    if (isRedirectError(error)) {
      throw error;
    }
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
