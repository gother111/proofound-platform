import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SignIn } from '@/components/auth/SignIn';
import { resolveUserHomePath } from '@/lib/auth';
import { sendDebugIngest } from '@/lib/debug-ingest';

export const dynamic = 'force-dynamic';
// Force Node.js runtime so server helpers (Supabase + crypto) run outside Edge
export const runtime = 'nodejs';

export const metadata = {
  title: 'Sign In | Proofound',
  description: 'Sign in to your Proofound account',
};

function sanitizeNextPath(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;

  const trimmed = raw.trim();
  if (
    !trimmed ||
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.includes('\\') ||
    /^[a-z][a-z\d+\-.]*:/i.test(trimmed)
  ) {
    return null;
  }

  return trimmed;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string | string[] }>;
}) {
  const isMock = process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === 'true';
  const params = (await searchParams) ?? {};
  const nextPath = sanitizeNextPath(params.next);
  let supabase: Awaited<ReturnType<typeof createClient>> | null = null;
  let hasUser = false;

  try {
    // Check if user is already logged in
    supabase = await createClient({ allowCookieWrite: true });
    try {
      const result = await supabase.auth.getUser();
      hasUser = Boolean(result?.data?.user);
      sendDebugIngest({
        sessionId: 'debug-session',
        runId: 'launch-readiness',
        hypothesisId: 'H-login-1',
        location: 'login/page.tsx:getUser',
        message: 'Auth check on login page',
        data: { hasUser },
      });
    } catch (authError) {
      console.error('Auth check failed on login page:', authError);
      sendDebugIngest({
        sessionId: 'debug-session',
        runId: 'launch-readiness',
        hypothesisId: 'H-login-err',
        location: 'login/page.tsx:getUser',
        message: 'Auth check failed',
        data: { error: authError instanceof Error ? authError.message : 'unknown' },
      });
    }
  } catch (error) {
    // If anything fails, log it and continue to show login page
    console.error('Error checking authentication on login page:', error);
  }

  // If already logged in, redirect to appropriate dashboard based on persona.
  // In mock mode we intentionally keep the login page reachable for auth E2E tests.
  if (hasUser && supabase && !isMock) {
    let homePath: string | null = null;
    try {
      homePath = await resolveUserHomePath(supabase);
    } catch (resolveError) {
      console.error('Error resolving home path:', resolveError);
      // Fall through to show login page if home path resolution fails
    }

    if (homePath) {
      sendDebugIngest({
        sessionId: 'debug-session',
        runId: 'launch-readiness',
        hypothesisId: 'H-redirect-loop',
        location: 'login/page.tsx:redirect',
        message: 'Redirecting logged-in user',
        data: { homePath, nextPath },
      });

      // Important: do not catch the redirect (it throws NEXT_REDIRECT internally).
      redirect(nextPath || homePath);
    }
  }

  // Render SignIn component with MVP design
  return <SignIn />;
}
