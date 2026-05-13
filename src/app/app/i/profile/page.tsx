import { requireAuth } from '@/lib/auth';
import { getProfileData } from '@/actions/profile';
import { DeferredEditableProfileView } from '@/components/profile/DeferredEditableProfileView';

export default async function IndividualProfilePage() {
  await requireAuth();
  const profile = await getProfileData();
  return <DeferredEditableProfileView initialProfile={profile} />;
}
