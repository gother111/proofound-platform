import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SignIn } from '@/components/auth/SignIn';
import { resolveUserHomePath } from '@/lib/auth';

export const metadata = {
  title: 'Sign In | Proofound',
  description: 'Sign in to your Proofound account',
};

export default async function LoginPage() {
  try {
    // Check if user is already logged in
    const supabase = await createClient({ allowCookieWrite: true });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // If there's an auth error, log it but don't crash - just show login page
    if (authError) {
      console.error('Auth check failed on login page:', authError);
    }

    // If already logged in, redirect to appropriate dashboard based on persona
    if (user) {
      try {
        const homePath = await resolveUserHomePath(supabase);
        redirect(homePath);
      } catch (redirectError) {
        console.error('Error resolving home path:', redirectError);
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
