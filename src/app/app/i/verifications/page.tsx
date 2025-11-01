import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { VerificationsClient } from './VerificationsClient';

export default async function VerificationsPage() {
  const user = await requireAuth();
  const supabase = await createClient();
  
  // Get user's email
  const { data: authUser } = await supabase.auth.getUser();
  const userEmail = authUser.user?.email || '';
  
  // Fetch all incoming verification requests
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/expertise/verifications/incoming`,
    {
      headers: {
        cookie: '', // Headers will be inherited from server context
      },
      cache: 'no-store',
    }
  );
  
  let requests = [];
  if (response.ok) {
    const data = await response.json();
    requests = data.requests || [];
  }
  
  return <VerificationsClient requests={requests} userEmail={userEmail} />;
}

