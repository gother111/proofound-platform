import { CommunicationsHub } from '@/components/communications/CommunicationsHub';

export const dynamic = 'force-dynamic';

export default async function IndividualCommunicationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ section?: string }>;
}) {
  const params = await searchParams;

  return <CommunicationsHub perspective="individual" initialSection={params?.section} />;
}
