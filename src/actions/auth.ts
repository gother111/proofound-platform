'use server';

import {
  assertMockDatabaseAllowed,
  isMockSupabaseEnabled,
  resolveCanonicalSiteUrl,
  resolveSiteUrlFromHeaders,
} from '@/lib/env';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { buildFallbackAuthTemplate } from '@/lib/email/auth-templates';
// Rate limiting removed - server actions are protected by Vercel's built-in rate limiting
import { headers } from 'next/headers';
import type { AuthError } from '@supabase/supabase-js';
import { resolveUserHomePath } from '@/lib/auth';
import { emitLaunchTrace, startLaunchTrace } from '@/lib/launch/trace';
import { log } from '@/lib/log';
import { z } from 'zod';
import { mapSignUpValidationError, signUpSchema } from './auth.schema';
import { CONSENT_TYPES, getPolicyVersionForConsentType } from '@/lib/privacy/consent-contract';

const signInSchema = signUpSchema.pick({ email: true }).extend({
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
type AuthLinkType = 'signup' | 'recovery';

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
  void headersList;
  return resolveCanonicalSiteUrl();
}

function resolveOAuthSiteUrl(headersList: Headers): string {
  return resolveSiteUrlFromHeaders(headersList);
}

function sanitizeLocalRequestOrigin(value: string | null | undefined): string | null {
  if (!value) return null;

  try {
    const url = new URL(value.trim());
    const hostname = url.hostname.toLowerCase();
    if (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1')
    ) {
      return url.origin;
    }
  } catch {
    return null;
  }

  return null;
}

function sanitizeNextPath(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.includes('\\') ||
    /^[a-z][a-z\d+\-.]*:/i.test(trimmed)
  ) {
    return null;
  }

  return trimmed;
}

export async function signUp(
  prevState: SignUpState | undefined,
  formData: FormData
): Promise<SignUpState> {
  const personaChoice = (formData.get('persona') as string | null)?.trim();
  const normalizedPersona = personaChoice === 'organization' ? 'org_member' : personaChoice;
  const trace = startLaunchTrace({
    flow: 'auth',
    actorType: 'anonymous',
    objectRefs: {
      persona: normalizedPersona ?? null,
    },
  });

  try {
    const headersList = await headers();

    const rawEmail = (formData.get('email') as string | null) ?? '';
    const email = rawEmail.trim().toLowerCase();
    const nextPath = sanitizeNextPath((formData.get('next') as string | null) ?? null);

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
      log.warn('auth.signup.validation_failed', {
        issues: result.error.format(),
        persona: normalizedPersona ?? null,
      });
      emitLaunchTrace(trace, {
        outcome: 'rejected',
        state: 'signup_validation_failed',
        failureClass: 'invalid_signup_payload',
      });
      return {
        error: mapSignUpValidationError(result.error),
        success: false,
      };
    }

    const siteUrl = resolveRequestSiteUrl(headersList);
    if (!siteUrl) {
      emitLaunchTrace(trace, {
        outcome: 'failure',
        state: 'signup_site_url_missing',
        failureClass: 'site_url_unavailable',
      });
      return {
        error: 'Unable to complete signup. Please try again later or contact support.',
        success: false,
      };
    }

    const supabase = await createClient({ allowCookieWrite: true });
    const isMockAuth = isMockSupabaseEnabled();

    let { data: signUpResult, error } = await supabase.auth.signUp({
      email: result.data.email,
      password: result.data.password,
      options: {
        emailRedirectTo: nextPath
          ? `${siteUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`
          : `${siteUrl}/auth/callback`,
        data: {
          persona: result.data.persona,
        },
      },
    });

    if (error) {
      log.error('auth.signup.provider_failed', { error });
      if (/already registered/i.test(error.message)) {
        emitLaunchTrace(trace, {
          outcome: 'rejected',
          state: 'signup_duplicate_account',
          failureClass: 'duplicate_account',
        });
        return {
          error: 'An account with this email already exists. Try logging in instead.',
          success: false,
        };
      }

      if (isSignUpEmailDeliveryFailure(error)) {
        const fallbackSent = await sendAuthLinkFallbackViaResend({
          type: 'signup',
          email: result.data.email,
          password: result.data.password,
          persona: result.data.persona,
          siteUrl,
          nextPath,
        });

        if (fallbackSent) {
          emitLaunchTrace(trace, {
            outcome: 'success',
            state: 'signup_fallback_email_sent',
          });
          return { error: null, success: true };
        }
      }

      if (shouldTreatSignUpErrorAsRetry(error)) {
        emitLaunchTrace(trace, {
          outcome: 'failure',
          state: 'signup_email_delivery_retryable',
          failureClass: 'email_delivery_retryable',
        });
        return {
          error:
            'We are temporarily unable to send verification emails. Please wait a minute and try again.',
          success: false,
        };
      }

      emitLaunchTrace(trace, {
        outcome: 'failure',
        state: 'signup_provider_failed',
        failureClass: 'provider_signup_failed',
      });
      return {
        error: error.message || 'We could not sign you up. Please try again.',
        success: false,
      };
    }

    const identities = signUpResult.user?.identities ?? [];
    if (identities.length === 0) {
      const verificationEmail = signUpResult.user?.email ?? result.data.email;
      const resent = await resendVerificationEmail(supabase, verificationEmail, siteUrl, nextPath);
      emitLaunchTrace(trace, {
        outcome: resent ? 'success' : 'failure',
        state: resent ? 'verification_resent' : 'verification_resend_failed',
        failureClass: resent ? null : 'verification_resend_failed',
      });
      return {
        error: resent
          ? 'An account with this email already exists. We just sent a fresh verification link to your inbox.'
          : 'An account with this email already exists. We were unable to resend a verification link right now.',
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
        log.warn('auth.signup.profile_trigger_missing', {
          userId: signUpResult.user.id,
        });
        await supabase.from('profiles').insert({
          id: signUpResult.user.id,
          persona: result.data.persona,
          display_name: result.data.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      // Store GDPR consent records in real environments.
      // In mock mode we skip this branch so local/E2E auth tests don't require production privacy salts.
      if (!isMockAuth) {
        // Use service role since user session doesn't exist yet (email confirmation required)
        try {
          const { createAdminClient } = await import('@/lib/supabase/admin');
          const serviceSupabase = createAdminClient();

          // Hash PII for audit trail
          const { anonymizeIP, anonymizeUserAgent } = await import('@/lib/utils/privacy');
          const ip =
            headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
          const ipHash = anonymizeIP(ip);
          const userAgentHash = anonymizeUserAgent(headersList.get('user-agent') || 'unknown');

          // Prepare consent records
          const consentRecords = [
            {
              profile_id: signUpResult.user.id,
              consent_type: CONSENT_TYPES.PRIVACY,
              consented: true,
              consented_at: new Date().toISOString(),
              ip_hash: ipHash,
              user_agent_hash: userAgentHash,
              version: getPolicyVersionForConsentType(CONSENT_TYPES.PRIVACY),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              profile_id: signUpResult.user.id,
              consent_type: CONSENT_TYPES.TOS,
              consented: true,
              consented_at: new Date().toISOString(),
              ip_hash: ipHash,
              user_agent_hash: userAgentHash,
              version: getPolicyVersionForConsentType(CONSENT_TYPES.TOS),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              profile_id: signUpResult.user.id,
              consent_type: CONSENT_TYPES.MARKETING,
              consented: result.data.marketingOptIn ?? false,
              consented_at: new Date().toISOString(),
              ip_hash: ipHash,
              user_agent_hash: userAgentHash,
              version: getPolicyVersionForConsentType(CONSENT_TYPES.MARKETING),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ];

          const { error: consentError } = await serviceSupabase
            .from('user_consents')
            .insert(consentRecords);

          if (consentError) {
            log.error('auth.signup.consent_records_insert_failed', {
              error: consentError,
              userId: signUpResult.user.id,
            });
            throw new Error(
              `GDPR compliance error: Failed to store consent records - ${consentError.message}`
            );
          }

          const { syncConsentObligation } = await import('@/lib/workflow/service');
          const signUpUserId = signUpResult.user?.id;
          if (!signUpUserId) {
            throw new Error('Signup completed without a persisted user id');
          }
          await Promise.all(
            consentRecords.map((record) =>
              syncConsentObligation({
                profileId: signUpUserId,
                consentType: record.consent_type,
                grantedConsentId: null,
                consented: record.consented,
                version: record.version,
                actorType: 'system',
              })
            )
          );

          log.info('auth.signup.consent_records_stored', {
            userId: signUpResult.user.id,
          });
        } catch (consentError) {
          log.error('auth.signup.consent_storage_failed', {
            error: consentError,
            userId: signUpResult.user?.id ?? null,
          });
          throw new Error(
            `GDPR compliance error: Unable to store required consent records. Signup cannot proceed.`
          );
        }
      }

      // Track user signup event for TTFQI and TTV metrics
      try {
        const { emitUserSignup } = await import('@/lib/analytics/events');
        await emitUserSignup(signUpResult.user.id, 'email', {
          persona: result.data.persona,
          marketingOptIn: result.data.marketingOptIn,
        });
      } catch (analyticsError) {
        // Log but don't fail signup
        log.warn('auth.signup.analytics_emit_failed', {
          error: analyticsError,
          userId: signUpResult.user.id,
        });
      }
    }

    revalidatePath('/', 'layout');

    emitLaunchTrace(trace, {
      outcome: 'success',
      state: 'signup_completed',
      details: {
        persona: result.data.persona,
      },
    });

    return {
      error: null,
      success: true,
    };
  } catch (error) {
    log.error('auth.signup.failed', { error });
    emitLaunchTrace(trace, {
      outcome: 'failure',
      state: 'signup_unhandled_error',
      failureClass: 'unhandled_auth_error',
    });
    if (error instanceof Error && error.message.includes('ENV_MISCONFIG')) {
      return {
        error:
          'Signup is temporarily unavailable due to a configuration issue. Please try again shortly or contact support.',
        success: false,
      };
    }
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

    const rawEmail = (formData.get('email') as string | null) ?? '';
    const email = rawEmail.trim().toLowerCase();
    const password = (formData.get('password') as string | null) ?? '';
    const nextPath = sanitizeNextPath((formData.get('next') as string | null) ?? null);
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
        await resendVerificationEmail(supabase, email, siteUrl, nextPath);
      }
      return { error: mapSupabaseSignInError(error, email) };
    }

    const destination = nextPath || (await resolveUserHomePath(supabase));

    revalidatePath('/', 'layout');
    redirect(destination);

    return { error: null };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    log.error('auth.signin.failed', { error });
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
  siteUrl: string,
  nextPath?: string | null
) {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: nextPath
          ? `${siteUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`
          : `${siteUrl}/auth/callback`,
      },
    });

    if (error) {
      log.warn('auth.verification.resend_failed', { error });
      return false;
    }

    return true;
  } catch (resendError) {
    log.warn('auth.verification.resend_exception', { error: resendError });
    return false;
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

  const data = {
    email: formData.get('email') as string,
  };

  const result = resetPasswordSchema.safeParse(data);
  if (!result.success) {
    return { error: 'Invalid email' };
  }

  if (isMockSupabaseEnabled()) {
    assertMockDatabaseAllowed('Password reset');
    return { success: true };
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
    if (isRecoveryEmailDeliveryFailure(error)) {
      const fallbackSent = await sendAuthLinkFallbackViaResend({
        type: 'recovery',
        email: result.data.email,
        siteUrl,
      });

      if (fallbackSent) {
        return { success: true };
      }
    }

    // Keep response non-enumerating and resilient to transient provider throttling.
    if (shouldTreatPasswordResetErrorAsSuccess(error)) {
      log.warn('auth.password_reset.masked_provider_error', {
        status: error.status,
        message: error.message,
      });
      return { success: true };
    }

    return { error: error.message };
  }

  return { success: true };
}

function shouldTreatPasswordResetErrorAsSuccess(error: AuthError): boolean {
  const message = error.message.toLowerCase();

  return (
    error.status === 429 ||
    /rate limit|too many requests|throttle/.test(message) ||
    /for security purposes/.test(message)
  );
}

function shouldTreatSignUpErrorAsRetry(error: AuthError): boolean {
  const message = error.message.toLowerCase();

  return (
    error.status === 429 ||
    /error sending confirmation email/.test(message) ||
    /over the email limit|rate limit|too many requests|throttle/.test(message)
  );
}

function isSignUpEmailDeliveryFailure(error: AuthError): boolean {
  return /error sending confirmation email/i.test(error.message);
}

function isRecoveryEmailDeliveryFailure(error: AuthError): boolean {
  return /error sending recovery email/i.test(error.message);
}

async function sendAuthLinkFallbackViaResend(params: {
  type: AuthLinkType;
  email: string;
  siteUrl: string;
  nextPath?: string | null;
  password?: string;
  persona?: string;
}): Promise<boolean> {
  const callbackUrl =
    params.type === 'signup'
      ? params.nextPath
        ? `${params.siteUrl}/auth/callback?next=${encodeURIComponent(params.nextPath)}`
        : `${params.siteUrl}/auth/callback`
      : `${params.siteUrl}/auth/callback?next=${encodeURIComponent('/reset-password/confirm')}`;

  try {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const { sendEmail } = await import('@/lib/email/sender');
    const adminSupabase = createAdminClient();

    const generatePayload: Record<string, unknown> = {
      type: params.type,
      email: params.email,
      options: {
        redirectTo: callbackUrl,
      },
    };

    if (params.type === 'signup') {
      generatePayload.password = params.password;
      generatePayload.options = {
        redirectTo: callbackUrl,
        data: params.persona ? { persona: params.persona } : undefined,
      };
    }

    const { data, error } = await adminSupabase.auth.admin.generateLink(generatePayload as any);

    if (error) {
      log.error('auth.fallback_link.generate_failed', {
        type: params.type,
        error,
      });
      return false;
    }

    const actionLink = data?.properties?.action_link;
    if (!actionLink) {
      log.error('auth.fallback_link.missing_action_link', {
        type: params.type,
      });
      return false;
    }

    const content = buildFallbackAuthTemplate(params.type, actionLink);
    const sendResult = await sendEmail({
      to: params.email,
      subject: content.subject,
      html: content.html,
      text: content.text,
    });

    if (!sendResult.success) {
      log.error('auth.fallback_link.email_send_failed', {
        type: params.type,
        error: sendResult.error,
      });
      return false;
    }

    return true;
  } catch (fallbackError) {
    log.error('auth.fallback_link.flow_failed', {
      type: params.type,
      error: fallbackError,
    });
    return false;
  }
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
  const verificationTypeRaw = formData.get('type');
  const verificationType = verificationTypeRaw === 'signup' ? 'signup' : 'email';

  if (!token) {
    return { error: 'No verification token provided' };
  }

  const supabase = await createClient({ allowCookieWrite: true });

  const { error } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: verificationType,
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
    const siteUrl =
      sanitizeLocalRequestOrigin((formData.get('requestOrigin') as string | null) ?? null) ??
      resolveOAuthSiteUrl(headersList);
    const nextPath = sanitizeNextPath((formData.get('next') as string | null) ?? null);

    if (!siteUrl) {
      return { error: 'Unable to start the sign-in flow. Please try again later.' };
    }

    // Allow Supabase to set the PKCE verifier + auth cookies for the OAuth flow
    const supabase = await createClient({ allowCookieWrite: true });
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: result.data,
      options: {
        redirectTo: nextPath
          ? `${siteUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`
          : `${siteUrl}/auth/callback`,
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
    log.error('auth.oauth.failed', { error });
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

    return 'We could not start the sign-in flow right now. Please try again or use email and password.';
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
