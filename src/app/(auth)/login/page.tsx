import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SignIn } from '@/components/auth/SignIn';
import { resolveUserHomePath } from '@/lib/auth';

export const dynamic = 'force-dynamic';
// Force Node.js runtime so server helpers (Supabase + crypto) run outside Edge
export const runtime = 'nodejs';

export const metadata = {
  title: 'Sign In | Proofound',
  description: 'Sign in to your Proofound account',
};

export default async function LoginPage() {
  try {
    // Check if user is already logged in
    const supabase = await createClient({ allowCookieWrite: true });
    let user = null;
    try {
      const result = await supabase.auth.getUser();
      user = result?.data?.user ?? null;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/381d9e33-65b3-4af0-9925-b21521306aaa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'pre-fix-2',
          hypothesisId: 'H-login-1',
          location: 'login/page.tsx:getUser',
          message: 'Auth check on login page',
          data: { hasUser: Boolean(user) },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
    } catch (authError) {
      console.error('Auth check failed on login page:', authError);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/381d9e33-65b3-4af0-9925-b21521306aaa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'pre-fix-2',
          hypothesisId: 'H-login-err',
          location: 'login/page.tsx:getUser',
          message: 'Auth check failed',
          data: { error: authError instanceof Error ? authError.message : 'unknown' },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
    }

    // If already logged in, redirect to appropriate dashboard based on persona
    if (user) {
      try {
        const homePath = await resolveUserHomePath(supabase);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/381d9e33-65b3-4af0-9925-b21521306aaa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: 'debug-session',
            runId: 'run-login-3',
            hypothesisId: 'H-redirect-loop',
            location: 'login/page.tsx:redirect',
            message: 'Redirecting logged-in user',
            data: { homePath },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        redirect(homePath);
      } catch (redirectError) {
        console.error('Error resolving home path:', redirectError);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/381d9e33-65b3-4af0-9925-b21521306aaa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: 'debug-session',
            runId: 'run-login-3',
            hypothesisId: 'H-redirect-loop',
            location: 'login/page.tsx:redirect-error',
            message: 'Home path resolution failed',
            data: { error: redirectError instanceof Error ? redirectError.message : 'unknown' },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        // Fall through to show login page if redirect fails
      }
    }
  } catch (error) {
    // If anything fails, log it and continue to show login page
    console.error('Error checking authentication on login page:', error);
  }

  // Render SignIn component with MVP design
  return <SignIn />;
}
