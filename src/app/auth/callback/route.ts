import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveUserHomePath } from '@/lib/auth';
import { ensureOrgSlugForId } from '@/lib/orgs';
import { PERSONA, normalizePersonaToken, type PersonaValue } from '@/constants/persona';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next');
  const personaParam = requestUrl.searchParams.get('persona');
  const normalizedPersona = personaParam ? normalizePersonaToken(personaParam) : null;
  const personaSelection: PersonaValue | null =
    normalizedPersona && normalizedPersona !== PERSONA.UNKNOWN ? normalizedPersona : null;
  const orgParam = requestUrl.searchParams.get('org');
  const organizationSlug =
    orgParam && /^[a-z0-9-]+$/.test(orgParam) ? orgParam.trim().toLowerCase() : null;

  const redirectToLoginWithError = (message: string) => {
    const errorUrl = new URL('/login', requestUrl.origin);
    errorUrl.searchParams.set('error', message);
    if (personaSelection) {
      errorUrl.searchParams.set('persona', personaSelection);
    }
    if (organizationSlug) {
      errorUrl.searchParams.set('org', organizationSlug);
    }
    return NextResponse.redirect(errorUrl);
  };

  const supabase = await createClient();

  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        return redirectToLoginWithError(
          'We could not validate your authentication link. Please try again.'
        );
      }
    } catch (exchangeError) {
      console.error('Failed to exchange OAuth code for session:', exchangeError);
      return redirectToLoginWithError(
        'We could not validate your authentication link. Please try again.'
      );
    }
  }

  if (type === 'email' && tokenHash) {
    const verifyUrl = new URL('/verify-email', requestUrl.origin);
    verifyUrl.searchParams.set('token', tokenHash);
    return NextResponse.redirect(verifyUrl);
  }

  if (type === 'recovery') {
    const resetUrl = new URL('/reset-password/confirm', requestUrl.origin);
    if (code) {
      resetUrl.searchParams.set('code', code);
    }
    if (tokenHash) {
      resetUrl.searchParams.set('token_hash', tokenHash);
      resetUrl.searchParams.set('token', tokenHash);
    }
    return NextResponse.redirect(resetUrl);
  }

  if (next) {
    try {
      const nextUrl = new URL(next, requestUrl.origin);
      const isSameOrigin = nextUrl.origin === requestUrl.origin;
      const isRelativePath = next.startsWith('/') && !next.startsWith('//');

      if (isSameOrigin || isRelativePath) {
        return NextResponse.redirect(nextUrl);
      }
    } catch (_) {
      // ignore invalid next parameter
    }
  }

  const {
    data: { user },
    error: getUserError,
  } = await supabase.auth.getUser();

  if (getUserError) {
    console.warn('[auth-callback] failed to load session user', {
      error: String(getUserError),
    });
  }

  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('persona')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.warn('[auth-callback] failed to load profile persona', {
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
        console.warn('[auth-callback] failed to insert profile row', {
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
        console.warn('[auth-callback] failed to canonicalize stored persona', {
          userId: user.id,
          error: String(canonicalizeError),
        });
      }
    }

    type MembershipRecord = {
      status: string | null;
      joined_at: string | null;
      organization: { id: string; slug: string | null; display_name: string | null } | null;
    };

    const { data: membershipsData, error: membershipError } = await supabase
      .from('organization_members')
      .select('status, joined_at, organization:organizations(id, slug, display_name)')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false });

    if (membershipError) {
      console.warn('[auth-callback] failed to load membership status', {
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
        console.warn('[auth-callback] failed to persist persona preference', {
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
          console.warn('[auth-callback] ensureOrgSlugForId failed', {
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
      if (activeMemberships.length === 0) {
        return redirectToLoginWithError(
          'You are not a member of any organization yet. Log in as an individual to continue.'
        );
      }

      await persistPersonaIfNeeded(PERSONA.ORG_MEMBER);

      let chosenMembership = activeMemberships[0];

      if (organizationSlug) {
        const match = activeMemberships.find(
          (membership) => membership.organization?.slug === organizationSlug
        );
        if (match) {
          chosenMembership = match;
        }
      }

      const destination = await resolveOrgDestination(chosenMembership);

      if (destination) {
        const slugPart = destination.split('/')[3] ?? null;
        console.info('[auth/callback] redirect → org home', {
          userId: user.id,
          slug: slugPart,
        });
        return NextResponse.redirect(new URL(destination, requestUrl.origin));
      }

      console.warn('[auth-callback] organization persona requested but slug missing', {
        userId: user.id,
      });
    } else if (personaSelection === PERSONA.INDIVIDUAL) {
      await persistPersonaIfNeeded(PERSONA.INDIVIDUAL);
      return NextResponse.redirect(new URL('/app/i/home', requestUrl.origin));
    } else {
      const personaPreference =
        storedPersona && storedPersona !== PERSONA.UNKNOWN ? storedPersona : null;
      const shouldPrioritizeOrg =
        personaPreference === PERSONA.ORG_MEMBER || activeMemberships.length > 0;

      if (shouldPrioritizeOrg && activeMemberships.length > 0) {
        let chosenMembership = activeMemberships[0];

        if (organizationSlug) {
          const match = activeMemberships.find(
            (membership) => membership.organization?.slug === organizationSlug
          );
          if (match) {
            chosenMembership = match;
          }
        }

        const destination = await resolveOrgDestination(chosenMembership);
        if (destination) {
          await persistPersonaIfNeeded(PERSONA.ORG_MEMBER);
          const slugPart = destination.split('/')[3] ?? null;
          console.info('[auth/callback] redirect → org home', {
            userId: user.id,
            slug: slugPart,
          });
          return NextResponse.redirect(new URL(destination, requestUrl.origin));
        }
      }
    }
  }

  const destinationPath = await resolveUserHomePath(supabase);

  if (personaSelection === PERSONA.ORG_MEMBER && destinationPath.startsWith('/app/i/')) {
    console.warn(
      '[auth-callback] organization persona requested but falling back to individual shell',
      {
        destination: destinationPath,
      }
    );
  }

  return NextResponse.redirect(new URL(destinationPath, requestUrl.origin));
}
