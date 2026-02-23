import { requireAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function SkillGapsPage() {
  await requireAuth();
  redirect('/app/i/expertise?tab=gap-analysis');
}
