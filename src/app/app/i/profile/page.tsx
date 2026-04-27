import { requireAuth } from '@/lib/auth';
import { getProfileData } from '@/actions/profile';
import { EditableProfileView } from '@/components/profile/EditableProfileView';

export default async function IndividualProfilePage() {
  await requireAuth();
  const profile = await getProfileData();
  return <EditableProfileView initialProfile={profile} />;
}
