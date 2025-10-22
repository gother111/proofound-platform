import type { ParamsPromise } from '@/types/next';

export default async function OrgTeamPage({ params }: { params: ParamsPromise<{ slug: string }> }) {
  return (
    <div className="p-6">
      Team — org <code>{(params as unknown as { slug: string }).slug}</code>
    </div>
  );
}
