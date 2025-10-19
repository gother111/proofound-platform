import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

  if (code) {
    const supabase = await createClient();
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

  return NextResponse.redirect(new URL('/app/i/home', requestUrl.origin));
}
