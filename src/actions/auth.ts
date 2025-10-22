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
import { ensureOrgSlugForId } from '@/lib/orgs';
import { PERSONA, normalizePersonaToken, type PersonaValue } from '@/constants/persona';

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  persona: z.enum([PERSONA.INDIVIDUAL, PERSONA.ORG_MEMBER]),
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
    const rawPersona = normalizePersonaToken(formData.get('persona'));
    const persona = rawPersona === PERSONA.ORG_MEMBER ? PERSONA.ORG_MEMBER : PERSONA.INDIVIDUAL;
    const data = {
      email,
      password: (formData.get('password') as string | null) ?? '',
      persona,
    };

    const result = signUpSchema.safeParse(data);
    if (!result.success) {
      return {
        error: 'Enter a valid email address and password with at least 8 characters.',
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

    if (signUpResult.user?.id) {
      const { error: personaUpsertError } = await supabase.from('profiles').upsert(
        {
          id: signUpResult.user.id,
          persona: result.data.persona,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

      if (personaUpsertError) {
        console.warn('[signUp] failed to persist persona selection', {
          userId: signUpResult.user.id,
          error: String(personaUpsertError),
        });
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
    const personaSelectionRaw = (formData.get('persona') as string | null) ?? '';
    const normalizedSelection = personaSelectionRaw
      ? normalizePersonaToken(personaSelectionRaw)
      : null;
    const personaSelection: PersonaValue | null = normalizedSelection
      ? normalizedSelection === PERSONA.UNKNOWN
        ? null
        : normalizedSelection
      : null;

    const organizationSlugInput = ((formData.get('organizationSlug') as string | null) ?? '')
      .trim()
      .toLowerCase();

    if (organizationSlugInput && !/^[a-z0-9-]+$/.test(organizationSlugInput)) {
      return {
        error: 'Enter a valid organization slug (use lowercase letters, numbers, and hyphens).',
      };
    }

    const organizationSlug = organizationSlugInput.length > 0 ? organizationSlugInput : null;

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
      const siteUrl = resolveRequestSiteUrl(headersList);
      if (isEmailNotConfirmedError(error) && siteUrl) {
        await resendVerificationEmail(supabase, email, siteUrl);
      }
      return { error: mapSupabaseSignInError(error, email) };
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let destination: string | null = null;

    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('persona')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.warn('[signIn] failed to load profile persona', {
          userId: user.id,
          error: String(profileError),
        });
      }

      let storedPersona = profile?.persona ? normalizePersonaToken(profile.persona) : null;

      if (!profile && !profileError) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({ id: user.id, persona: PERSONA.UNKNOWN });

        if (insertError) {
          console.warn('[signIn] failed to insert profile row', {
            userId: user.id,
            error: String(insertError),
          });
        } else {
          storedPersona = PERSONA.UNKNOWN;
        }
      } else if (profile?.persona && storedPersona && profile.persona !== storedPersona) {
        const { error: canonicalizeError } = await supabase
          .from('profiles')
          .update({ persona: storedPersona, updated_at: new Date().toISOString() })
          .eq('id', user.id);

        if (canonicalizeError) {
          console.warn('[signIn] failed to canonicalize stored persona', {
            userId: user.id,
            error: String(canonicalizeError),
          });
        }
      }

      type MembershipRecord = {
        status: string | null;
        role: string | null;
        joined_at: string | null;
        organization: { id: string; slug: string | null; display_name: string | null } | null;
      };

      const { data: membershipsData, error: membershipError } = await supabase
        .from('organization_members')
        .select('status, role, joined_at, organization:organizations(id, slug, display_name)')
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false });

      if (membershipError) {
        console.warn('[signIn] failed to load membership status', {
          userId: user.id,
          error: String(membershipError),
        });
      }

      const memberships: MembershipRecord[] = (membershipsData ?? []).map((membership) => {
        const organizationData = Array.isArray(membership.organization)
          ? membership.organization[0]
          : membership.organization;

        return {
          status: membership.status ?? null,
          role: membership.role ?? null,
          joined_at: membership.joined_at ?? null,
          organization: organizationData
            ? {
                id: String(organizationData.id),
                slug: typeof organizationData.slug === 'string' ? organizationData.slug : null,
                display_name:
                  typeof organizationData.display_name === 'string'
                    ? organizationData.display_name
                    : null,
              }
            : null,
        };
      });
      const activeMemberships = memberships.filter(
        (membership) => membership.status === 'active' && membership.organization
      );

      const persistPersonaIfNeeded = async (personaToPersist: PersonaValue | null) => {
        if (!personaToPersist || personaToPersist === storedPersona) {
          return;
        }
        const { error: personaUpdateError } = await supabase
          .from('profiles')
          .update({ persona: personaToPersist, updated_at: new Date().toISOString() })
          .eq('id', user.id);

        if (personaUpdateError) {
          console.warn('[signIn] failed to persist persona preference', {
            userId: user.id,
            persona: personaToPersist,
            error: String(personaUpdateError),
          });
        } else {
          storedPersona = personaToPersist;
        }
      };

      const resolveOrgDestination = async (
        chosenMembership: MembershipRecord | null
      ): Promise<string | null> => {
        if (!chosenMembership?.organization) {
          return null;
        }

        let slug = chosenMembership.organization.slug;

        if (!slug) {
          try {
            slug = await ensureOrgSlugForId(
              chosenMembership.organization.id,
              chosenMembership.organization.display_name ?? undefined
            );
          } catch (ensureError) {
            console.warn('[signIn] ensureOrgSlugForId failed', {
              userId: user.id,
              organizationId: chosenMembership.organization.id,
              error: String(ensureError),
            });
            return null;
          }
        }

        return slug ? `/app/o/${slug}/home` : null;
      };

      if (personaSelection === PERSONA.ORG_MEMBER) {
        await persistPersonaIfNeeded(PERSONA.ORG_MEMBER);

        if (activeMemberships.length === 0) {
          await supabase.auth.signOut();
          return {
            error:
              'You are not a member of any organization yet. Log in as an individual to continue.',
          };
        }

        let chosenMembership = activeMemberships[0];

        if (organizationSlug) {
          const match = activeMemberships.find(
            (membership) => membership.organization?.slug === organizationSlug
          );

          if (!match) {
            await supabase.auth.signOut();
            return {
              error: `We couldn't find an organization with slug "${organizationSlug}" for your account.`,
            };
          }

          chosenMembership = match;
        }

        destination = await resolveOrgDestination(chosenMembership);

        if (!destination) {
          console.warn('[signIn] organization persona selected but no slug available', {
            userId: user.id,
          });
        }
      } else if (personaSelection === PERSONA.INDIVIDUAL) {
        await persistPersonaIfNeeded(PERSONA.INDIVIDUAL);
        destination = '/app/i/home';
      } else {
        const personaPreference =
          storedPersona && storedPersona !== PERSONA.UNKNOWN ? storedPersona : null;
        const shouldPrioritizeOrg =
          personaPreference === PERSONA.ORG_MEMBER || activeMemberships.length > 0;

        if (shouldPrioritizeOrg) {
          if (activeMemberships.length === 0) {
            console.warn('[signIn] expected organization persona but no active memberships', {
              userId: user.id,
            });
          } else {
            let chosenMembership = activeMemberships[0];

            if (organizationSlug) {
              const match = activeMemberships.find(
                (membership) => membership.organization?.slug === organizationSlug
              );
              if (match) {
                chosenMembership = match;
              }
            }

            destination = await resolveOrgDestination(chosenMembership);

            if (destination) {
              await persistPersonaIfNeeded(PERSONA.ORG_MEMBER);
            }
          }
        }
      }
    }

    if (!destination) {
      destination = await resolveUserHomePath(supabase);

      if (personaSelection === PERSONA.ORG_MEMBER) {
        console.warn('[signIn] falling back to resolved home path despite organization selection', {
          destination,
        });
      }
    }

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

  const siteUrl = resolveRequestSiteUrl(headersList);
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
  try {
    const provider = formData.get('provider');
    const personaSelectionRaw = (formData.get('persona') as string | null) ?? '';
    const normalizedPersona = personaSelectionRaw
      ? normalizePersonaToken(personaSelectionRaw)
      : null;
    const persona =
      normalizedPersona && normalizedPersona !== PERSONA.UNKNOWN ? normalizedPersona : null;
    const organizationSlugInput = ((formData.get('organizationSlug') as string | null) ?? '')
      .trim()
      .toLowerCase();
    const organizationSlug =
      organizationSlugInput && /^[a-z0-9-]+$/.test(organizationSlugInput)
        ? organizationSlugInput
        : null;
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
    const callbackUrl = new URL('/auth/callback', siteUrl);
    if (persona) {
      callbackUrl.searchParams.set('persona', persona);
    }
    if (organizationSlug) {
      callbackUrl.searchParams.set('org', organizationSlug);
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: result.data,
      options: {
        redirectTo: callbackUrl.toString(),
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
