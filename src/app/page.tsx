import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProofoundLanding } from '@/components/ProofoundLanding';

export default async function Home() {
  try {
    // Check if user is already logged in
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // If there's an auth error, log it but don't crash - just show landing page
    if (authError) {
      console.error('Auth check failed:', authError);
    }

    // If logged in, redirect to dashboard
    if (user) {
      redirect('/app/i/home');
    }
  } catch (error) {
    // If anything fails, log it and continue to show landing page
    console.error('Error checking authentication:', error);
  }

  // Render Figma landing page for non-authenticated users
  // Navigation is handled internally by the component using Next.js router
  return <ProofoundLanding />;
}
