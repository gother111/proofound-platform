import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SignIn } from '@/components/auth/SignIn';
import { resolveUserHomePath } from '@/lib/auth';

export const metadata = {
  title: 'Sign In | Proofound',
  description: 'Sign in to your Proofound account',
};

export default async function LoginPage() {
  // Check if user is already logged in
  const supabase = await createClient({ allowCookieWrite: true });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If already logged in, redirect to appropriate dashboard based on persona
  if (user) {
    const homePath = await resolveUserHomePath(supabase);
    redirect(homePath);
  }

  // Render SignIn component with MVP design
  return <SignIn />;
}
