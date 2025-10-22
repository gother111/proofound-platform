import { requireAuth } from '@/lib/auth';
import { EditableProfileView } from '@/components/profile/EditableProfileView';

export default async function IndividualProfilePage() {
  await requireAuth();
  return <EditableProfileView />;
}
