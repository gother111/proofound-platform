import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProofoundLanding } from '@/components/ProofoundLanding';

export const dynamic = 'force-dynamic';

export default async function Home() {
  // Auth check disabled for debugging/verification of landing page
  return <ProofoundLanding />;
}
