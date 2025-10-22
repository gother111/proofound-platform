import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveUserHomePath } from '@/lib/auth';
import { ensureOrgContextForUser, type MembershipWithOrganization } from '@/lib/orgs';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next');

  const redirectToLoginWithError = (message: string) => {
    const errorUrl = new URL('/login', requestUrl.origin);
    errorUrl.searchParams.set('error', message);
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

    let persona = profile?.persona ?? null;

    if (!profile && !profileError) {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({ id: user.id, persona: 'unknown' });

      if (insertError) {
        console.warn('[auth-callback] failed to insert profile row', {
          userId: user.id,
          error: String(insertError),
        });
      } else {
        persona = 'unknown';
      }
    }

    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('status, organization:organizations(slug, display_name)')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false })
      .limit(1)
      .maybeSingle<MembershipWithOrganization>();

    if (membershipError) {
      console.warn('[auth-callback] failed to load membership status', {
        userId: user.id,
        error: String(membershipError),
      });
    }

    let targetSlug = membership?.organization?.slug ?? null;

    const shouldEnsureOrg = membership?.status === 'active' || persona !== 'individual';

    if (shouldEnsureOrg) {
      try {
        targetSlug = await ensureOrgContextForUser(user.id, {
          displayNameHint: membership?.organization?.display_name ?? null,
          email: user.email ?? null,
        });
      } catch (error) {
        console.warn('[auth-callback] ensureOrgContextForUser failed', {
          userId: user.id,
          error: String(error),
        });
      }
    }

    if (targetSlug) {
      console.info('[auth/callback] redirect → org home', {
        userId: user.id,
        slug: targetSlug,
      });
      return NextResponse.redirect(new URL(`/app/o/${targetSlug}/home`, requestUrl.origin));
    }
  }

  const destinationPath = await resolveUserHomePath(supabase);

  return NextResponse.redirect(new URL(destinationPath, requestUrl.origin));
}
