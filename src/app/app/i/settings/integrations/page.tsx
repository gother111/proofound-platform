import { requireAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface IntegrationsPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function IntegrationsPage({ searchParams }: IntegrationsPageProps) {
  await requireAuth();

  const resolvedParams = (await searchParams) ?? {};
  const nextParams = new URLSearchParams({ tab: 'integrations' });

  const success = resolvedParams.success;
  const error = resolvedParams.error;
  const message = resolvedParams.message;

  if (typeof success === 'string' && success) nextParams.set('success', success);
  if (typeof error === 'string' && error) nextParams.set('error', error);
  if (typeof message === 'string' && message) nextParams.set('message', message);

  redirect(`/app/i/settings?${nextParams.toString()}`);
}
