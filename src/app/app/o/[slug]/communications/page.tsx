import { CommunicationsHub } from '@/components/communications/CommunicationsHub';

export const dynamic = 'force-dynamic';

export default function OrganizationCommunicationsPage() {
  return <CommunicationsHub perspective="organization" />;
}
