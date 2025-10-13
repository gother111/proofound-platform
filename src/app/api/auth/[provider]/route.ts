import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { resolveSiteUrl } from '@/lib/site-url';

type Provider = 'google';

const allowedProviders: Provider[] = ['google'];

function isAllowedProvider(value: string): value is Provider {
  return allowedProviders.includes(value as Provider);
}

function buildLoginErrorRedirect(origin: string, message: string) {
  const loginUrl = new URL('/login', origin);
  loginUrl.searchParams.set('error', message);
  return NextResponse.redirect(loginUrl);
}

export async function GET(request: NextRequest, { params }: { params: { provider: string } }) {
  const requestUrl = new URL(request.url);
  const providerParam = params.provider?.toLowerCase();

  if (!providerParam || !isAllowedProvider(providerParam)) {
    return buildLoginErrorRedirect(requestUrl.origin, 'Unsupported sign-in provider.');
  }

  const provider: Provider = providerParam;

  const headersList = headers();
  const siteUrl = resolveSiteUrl(headersList);

  if (!siteUrl) {
    console.error('Unable to resolve site URL for OAuth flow.');
    return buildLoginErrorRedirect(
      requestUrl.origin,
      'We could not start the sign-in flow. Please try again.'
    );
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (error || !data?.url) {
      if (error) {
        console.error('Failed to start OAuth sign-in flow:', error);
      }
      return buildLoginErrorRedirect(
        siteUrl,
        'We could not start the sign-in flow. Please try again.'
      );
    }

    return NextResponse.redirect(data.url);
  } catch (signInError) {
    console.error('Unexpected error while starting OAuth sign-in flow:', signInError);
    return buildLoginErrorRedirect(
      siteUrl,
      'We could not start the sign-in flow. Please try again.'
    );
  }
}
