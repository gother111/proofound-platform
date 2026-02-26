import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveUserHomePath } from '@/lib/auth';
import { reconcileVerifierContradictions } from '@/lib/verification/contradiction';

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

  const supabase = await createClient({ allowCookieWrite: true });

  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        return redirectToLoginWithError(
          'We could not validate your authentication link. Please try again.'
        );
      }

      try {
        const { data: authUser } = await supabase.auth.getUser();
        const userId = authUser.user?.id || null;
        const userEmail = authUser.user?.email || null;
        if (userId || userEmail) {
          await reconcileVerifierContradictions({
            verifierProfileId: userId,
            verifierEmail: userEmail,
          });
        }
      } catch (reconcileError) {
        console.error('Auth callback contradiction reconciliation failed:', reconcileError);
      }
    } catch (exchangeError) {
      console.error('Failed to exchange OAuth code for session:', exchangeError);
      return redirectToLoginWithError(
        'We could not validate your authentication link. Please try again.'
      );
    }
  }

  if ((type === 'email' || type === 'signup') && tokenHash) {
    const verifyUrl = new URL('/verify-email', requestUrl.origin);
    verifyUrl.searchParams.set('token', tokenHash);
    verifyUrl.searchParams.set('type', type);
    return NextResponse.redirect(verifyUrl);
  }

  if (type === 'recovery') {
    const resetUrl = new URL('/reset-password/confirm', requestUrl.origin);
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

  // Use the same Supabase client (which now holds the new session) to compute the destination.
  // Creating a fresh client here would miss the just-set auth cookies and send users back to /login.
  const destinationPath = await resolveUserHomePath(supabase);

  return NextResponse.redirect(new URL(destinationPath, requestUrl.origin));
}
